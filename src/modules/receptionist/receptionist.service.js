import { badRequest, forbidden, notFound } from "../../common/errors.js";
import { bookingsRepository } from "../bookings/bookings.repository.js";

const normalizeDate = (rawDate) => {
  const value = String(rawDate || "").trim();
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw badRequest("Invalid date format", "INVALID_DATE");
  }

  return date.toISOString().slice(0, 10);
};

const getAssignedHotelId = (user = {}) => {
  const hotelId = String(user.assignedHotelId || "").trim();
  if (!hotelId) {
    throw forbidden("Receptionist has no assigned hotel", "RECEPTIONIST_HOTEL_NOT_ASSIGNED");
  }
  return hotelId;
};

const normalizeStatus = (value) => String(value || "").trim().toUpperCase();

export const receptionistService = {
  async roomBoard(user = {}, query = {}) {
    const hotelId = getAssignedHotelId(user);
    const date = normalizeDate(query.date);

    const roomTypes = await bookingsRepository.getHotelRoomBoardByDate({
      hotelId,
      date,
    });

    return {
      date,
      hotelId,
      roomTypes,
      summary: {
        totalInventory: roomTypes.reduce((sum, item) => sum + Number(item.total_inventory || 0), 0),
        occupiedCount: roomTypes.reduce((sum, item) => sum + Number(item.occupied_count || 0), 0),
        availableCount: roomTypes.reduce((sum, item) => sum + Number(item.available_count || 0), 0),
      },
    };
  },

  async listDailyBookings(user = {}, query = {}) {
    const hotelId = getAssignedHotelId(user);
    const date = normalizeDate(query.date);
    const limit = Math.min(Math.max(Number(query.limit) || 100, 1), 200);
    const offset = Math.max(Number(query.offset) || 0, 0);

    const items = await bookingsRepository.listByHotelAndDate({
      hotelId,
      date,
      limit,
      offset,
    });

    return {
      items,
      date,
      hotelId,
      pagination: {
        limit,
        offset,
      },
    };
  },

  async checkInBooking(user = {}, bookingId) {
    const hotelId = getAssignedHotelId(user);
    const normalizedBookingId = String(bookingId || "").trim();
    if (!normalizedBookingId) {
      throw badRequest("Booking ID is required", "MISSING_BOOKING_ID");
    }

    const current = await bookingsRepository.getBookingByIdAndHotel(normalizedBookingId, hotelId);
    if (!current) {
      throw notFound("Booking not found in assigned hotel", "BOOKING_NOT_FOUND");
    }
    const currentStatus = normalizeStatus(current.booking_status);
    if (!["PENDING", "CONFIRMED"].includes(currentStatus)) {
      throw badRequest("Booking is not eligible for check-in", "INVALID_CHECKIN_STATE");
    }

    const updated = await bookingsRepository.updateBookingStatusByHotel(normalizedBookingId, hotelId, "CHECKED_IN");

    if (!updated) {
      throw notFound("Booking not found in assigned hotel", "BOOKING_NOT_FOUND");
    }

    return updated;
  },

  async checkOutBooking(user = {}, bookingId) {
    const hotelId = getAssignedHotelId(user);
    const normalizedBookingId = String(bookingId || "").trim();
    if (!normalizedBookingId) {
      throw badRequest("Booking ID is required", "MISSING_BOOKING_ID");
    }

    const current = await bookingsRepository.getBookingByIdAndHotel(normalizedBookingId, hotelId);
    if (!current) {
      throw notFound("Booking not found in assigned hotel", "BOOKING_NOT_FOUND");
    }
    const currentStatus = normalizeStatus(current.booking_status);
    if (currentStatus !== "CHECKED_IN") {
      throw badRequest("Booking must be CHECKED_IN before check-out", "INVALID_CHECKOUT_STATE");
    }

    const updated = await bookingsRepository.updateBookingStatusByHotel(normalizedBookingId, hotelId, "CHECKED_OUT");

    if (!updated) {
      throw notFound("Booking not found in assigned hotel", "BOOKING_NOT_FOUND");
    }

    return updated;
  },

  async markPaidAtDesk(user = {}, bookingId) {
    const hotelId = getAssignedHotelId(user);
    const normalizedBookingId = String(bookingId || "").trim();
    if (!normalizedBookingId) {
      throw badRequest("Booking ID is required", "MISSING_BOOKING_ID");
    }

    const current = await bookingsRepository.getBookingByIdAndHotel(normalizedBookingId, hotelId);
    if (!current) {
      throw notFound("Booking not found in assigned hotel", "BOOKING_NOT_FOUND");
    }
    const paymentStatus = normalizeStatus(current.payment_status);
    if (paymentStatus === "PAID") {
      throw badRequest("Booking payment already marked as PAID", "ALREADY_PAID");
    }

    const updated = await bookingsRepository.updateBookingPaymentStatusByHotel(normalizedBookingId, hotelId, "PAID");

    if (!updated) {
      throw notFound("Booking not found in assigned hotel", "BOOKING_NOT_FOUND");
    }

    return updated;
  },

  async markNoShow(user = {}, bookingId) {
    const hotelId = getAssignedHotelId(user);
    const normalizedBookingId = String(bookingId || "").trim();
    if (!normalizedBookingId) {
      throw badRequest("Booking ID is required", "MISSING_BOOKING_ID");
    }

    const current = await bookingsRepository.getBookingByIdAndHotel(normalizedBookingId, hotelId);
    if (!current) {
      throw notFound("Booking not found in assigned hotel", "BOOKING_NOT_FOUND");
    }

    const currentStatus = normalizeStatus(current.booking_status);
    if (!["PENDING", "CONFIRMED"].includes(currentStatus)) {
      throw badRequest("Only pending/confirmed booking can be marked no-show", "INVALID_NOSHOW_STATE");
    }

    const updated = await bookingsRepository.updateBookingStatusByHotel(normalizedBookingId, hotelId, "NO_SHOW");
    return updated;
  },

  async lookupBooking(user = {}, query = {}) {
    const hotelId = getAssignedHotelId(user);
    const bookingNumber = String(query.bookingNumber || "").trim();
    if (!bookingNumber) {
      throw badRequest("bookingNumber is required", "MISSING_BOOKING_NUMBER");
    }

    const booking = await bookingsRepository.getBookingByNumberAndHotel(bookingNumber, hotelId);
    if (!booking) {
      throw notFound("Booking not found", "BOOKING_NOT_FOUND");
    }

    return booking;
  },
};
