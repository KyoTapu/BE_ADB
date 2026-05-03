import { bookingRepository } from "./booking.repository.js";
import { toBookingResponse } from "./booking.model.js";
import {
  buildRoomTypeNightlyRates,
  buildServiceQuote,
  generateStayDates,
} from "./booking.pricing.js";

const createError = (message, status = 400, code = "BAD_REQUEST") => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
};

class BookingService {
  parseGuests(rawValue) {
    const matched = String(rawValue || "").match(/\d+/);
    return Math.max(Number(matched?.[0]) || 1, 1);
  }

  async buildQuote(payload = {}) {
    const roomTypeId = Number(payload.roomTypeId ?? payload.room_type_id);
    const checkIn = String(payload.checkIn || payload.check_in || "").trim();
    const checkOut = String(payload.checkOut || payload.check_out || "").trim();
    const guests = this.parseGuests(payload.guests);
    const serviceIds = Array.isArray(payload.serviceIds ?? payload.service_ids)
      ? [...new Set((payload.serviceIds ?? payload.service_ids).map((item) => Number(item)).filter((item) => item > 0))]
      : [];

    if (!roomTypeId || !checkIn || !checkOut) {
      throw createError("roomTypeId, checkIn and checkOut are required", 400, "MISSING_BOOKING_FIELDS");
    }

    const stayDates = generateStayDates(checkIn, checkOut);
    if (!stayDates.length) {
      throw createError("checkOut must be after checkIn", 400, "INVALID_STAY_DATES");
    }

    const roomType = await bookingRepository.getRoomTypeById(roomTypeId);
    if (!roomType) {
      throw createError("Room type not found", 404, "ROOM_TYPE_NOT_FOUND");
    }

    const [seasonalRows, specialRows, selectedServices, availableRoom] = await Promise.all([
      bookingRepository.getSeasonalPricingByHotelId(roomType.hotel_id),
      bookingRepository.getSpecialDatePricingByRoomTypeId(roomTypeId),
      bookingRepository.getServicesByIds(serviceIds),
      bookingRepository.findAvailableRoomByType(roomTypeId, checkIn, checkOut),
    ]);

    if (!availableRoom) {
      throw createError("No available room for this room type in the selected dates", 409, "ROOM_TYPE_UNAVAILABLE");
    }

    const invalidService = selectedServices.find((service) => Number(service.hotel_id) !== Number(roomType.hotel_id));
    if (selectedServices.length !== serviceIds.length || invalidService) {
      throw createError("One or more selected services are invalid for this hotel", 400, "INVALID_SERVICE_SELECTION");
    }

    const nightlyRates = buildRoomTypeNightlyRates({
      roomType,
      stayDates,
      seasonalPricing: seasonalRows,
      specialDatePricing: specialRows,
    });
    const roomTotal = nightlyRates.reduce((total, night) => total + night.rate, 0);
    const serviceQuotes = selectedServices.map((service) =>
      buildServiceQuote(service, stayDates.length, guests),
    );
    const serviceTotal = serviceQuotes.reduce((total, service) => total + service.total, 0);
    const taxesAndFees = Math.round((roomTotal + serviceTotal) * 0.08);
    const totalAmount = roomTotal + serviceTotal + taxesAndFees;

    return {
      hotelId: roomType.hotel_id,
      hotelName: roomType.hotel_name,
      roomTypeId: roomType.room_type_id,
      roomTypeName: roomType.room_type_name,
      checkIn,
      checkOut,
      guests,
      stayNights: stayDates.length,
      availableRoomId: availableRoom.room_id,
      nightlyRates,
      roomTotal,
      services: serviceQuotes,
      serviceTotal,
      taxesAndFees,
      totalAmount,
    };
  }

  async createBooking(userId, payload) {
    const quote = await this.buildQuote(payload);

    const bookingData = {
      user_id: userId,
      check_in: quote.checkIn,
      check_out: quote.checkOut,
      total_amount: quote.totalAmount,
      status: "Pending",
    };

    const details = [
      {
        room_id: quote.availableRoomId,
        price_at_booking: quote.roomTotal,
        count_child: Math.max(Number(payload.countChild ?? payload.count_child) || 0, 0),
        count_parent: Math.max(Number(payload.countParent ?? payload.count_parent ?? quote.guests) || 1, 1),
      },
    ];

    const record = await bookingRepository.createWithDetails(bookingData, details);
    return {
      ...toBookingResponse(record),
      quote,
    };
  }

  async processCheckInOut(id, status) {
    const record = await bookingRepository.updateStatus(id, status);
    return toBookingResponse(record);
  }
}

export const bookingService = new BookingService();
