import { randomUUID } from "crypto";
import { conflict, notFound, badRequest } from "../../common/errors.js";
import { getMongoCollection } from "../../configs/mongodb.js";
import { buildInventoryLockKey, connectRedis } from "../../configs/redis.js";
import { paymentsService } from "../payments/payments.service.js";
import { isVnpayConfigured } from "../payments/vnpay.js";
import { pricingService } from "../pricing/pricing.service.js";
import { bookingsModel } from "./bookings.model.js";
import { bookingsRepository } from "./bookings.repository.js";

const acquireInventoryLock = async (roomTypeId, date, ttlSeconds = 30) => {
  const client = await connectRedis();
  const key = buildInventoryLockKey(roomTypeId, date);
  const acquired = await client.set(key, "1", {
    NX: true,
    EX: ttlSeconds,
  });

  if (!acquired) {
    throw conflict("Room currently unavailable", "INVENTORY_LOCK_FAILED");
  }

  return key;
};

const releaseInventoryLock = async (key) => {
  const client = await connectRedis();
  await client.del(key);
};

export const bookingsService = {
  async listMyHistory(user = {}, queryParams = {}) {
    const email = String(user.email || "").trim();
    if (!email) {
      throw badRequest("Authenticated user email is required", "MISSING_USER_EMAIL");
    }

    return bookingsRepository.listHistory({
      ...queryParams,
      customer_email: email,
    });
  },

  async listAdminHistory(queryParams = {}) {
    return bookingsRepository.listHistory(queryParams);
  },

  async list(queryParams = {}) {
    return bookingsRepository.list(queryParams, bookingsModel);
  },

  async getById(id) {
    const booking = await bookingsRepository.getById(id);
    if (!booking) {
      throw notFound("Booking not found", "BOOKING_NOT_FOUND");
    }

    return booking;
  },

  async create(payload = {}) {
    const customer = payload.customer || {};
    const normalizedPaymentMethod = String(payload.paymentMethod || "pay_at_hotel").trim().toLowerCase();
    const firstName = String(customer.firstName || "").trim();
    const lastName = String(customer.lastName || "").trim();
    const email = String(customer.email || "").trim();

    if (!firstName || !lastName || !email) {
      throw badRequest("Customer firstName, lastName and email are required", "MISSING_CUSTOMER_FIELDS");
    }

    if (normalizedPaymentMethod === "vnpay" && !isVnpayConfigured()) {
      throw badRequest("VNPay is not configured on the server", "VNPAY_NOT_CONFIGURED");
    }

    const quote = await pricingService.quote(payload);
    const availability = await bookingsRepository.findAvailability(payload.roomTypeId, quote.stayDates);

    if (
      availability.length !== quote.stayDates.length ||
      availability.some((item) => Number(item.available_inventory) <= 0)
    ) {
      throw conflict("Selected room type is no longer available", "INVENTORY_UNAVAILABLE");
    }

    const lockKeys = [];

    try {
      for (const date of quote.stayDates) {
        lockKeys.push(await acquireInventoryLock(payload.roomTypeId, date));
      }

      const booking = await bookingsRepository.createBooking({
        bookingNumber: payload.bookingNumber || `BK-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`,
        hotelId: quote.hotel.id,
        roomTypeId: payload.roomTypeId,
        ratePlanId: payload.ratePlanId || null,
        checkIn: payload.checkIn,
        checkOut: payload.checkOut,
        totalNights: quote.stayDates.length,
        subtotalAmount: quote.charges.subtotal,
        discountAmount: quote.charges.losDiscount + quote.charges.promotionDiscount,
        taxAmount: quote.charges.taxAmount,
        serviceChargeAmount: quote.charges.serviceCharge,
        finalAmount: quote.charges.finalAmount,
        currency: payload.currency || "VND",
        bookingStatus:
          payload.bookingStatus ||
          (normalizedPaymentMethod === "vnpay" ? "PENDING" : "CONFIRMED"),
        paymentStatus: payload.paymentStatus || "PENDING",
        sourceChannel: payload.sourceChannel || "DIRECT",
        adults: Number(payload.adults) || 1,
        children: Number(payload.children) || 0,
        stayDates: quote.stayDates,
        facilities: quote.facilities,
        promotionId: quote.promotion?.id || null,
        customer: {
          firstName,
          lastName,
          email,
          phone: customer.phone || null,
          nationality: customer.nationality || null,
          loyaltyTier: customer.loyaltyTier || null,
        },
      });

      try {
        const collection = await getMongoCollection("pricing_history");
        const firstNight = quote.nightlyBreakdown?.[0] || null;
        await collection.insertOne({
          hotel_id: String(quote.hotel.id),
          room_type_id: String(payload.roomTypeId),
          rate_date: quote.stayDates[0],
          old_price: Number(firstNight?.baseRate ?? quote.nightlyRates?.[0]?.base_rate ?? quote.nightlyRates?.[0]?.final_rate ?? 0),
          new_price: Number(firstNight?.adjustedRate ?? quote.nightlyRates?.[0]?.final_rate ?? quote.nightlyRates?.[0]?.base_rate ?? 0),
          factors: quote.factors,
          booking_id: String(booking.id),
          created_at: new Date(),
          quote_snapshot: quote,
        });
      } catch (error) {
        console.warn("Pricing history log unavailable:", error.message);
      }

      const payment = await paymentsService.createInternalPayment({
        bookingId: booking.id,
        amount: quote.charges.finalAmount,
        paymentMethod: normalizedPaymentMethod,
        bookingNumber: booking.booking_number,
      });

      let paymentRedirectUrl = null;
      if (normalizedPaymentMethod === "vnpay") {
        paymentRedirectUrl = await paymentsService.createVnpayPaymentUrl({
          booking,
          payment,
          amount: quote.charges.finalAmount,
          ipAddress: payload.ipAddress || "127.0.0.1",
        });
      }

      return {
        booking,
        payment,
        paymentRedirectUrl,
        quote,
      };
    } finally {
      await Promise.all(
        lockKeys.map((key) =>
          releaseInventoryLock(key).catch((error) => {
            console.warn("Failed to release lock:", error.message);
          }),
        ),
      );
    }
  },

  async update(id, payload = {}) {
    const booking = await bookingsRepository.update(id, payload, bookingsModel);
    if (!booking) {
      throw notFound("Booking not found", "BOOKING_NOT_FOUND");
    }

    return booking;
  },

  async remove(id) {
    const booking = await bookingsRepository.remove(id);
    if (!booking) {
      throw notFound("Booking not found", "BOOKING_NOT_FOUND");
    }

    return booking;
  },
};
