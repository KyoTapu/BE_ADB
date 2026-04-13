import { bookingRepository } from "./booking.repository.js";
import { toBookingResponse } from "./booking.model.js";

class BookingService {
  async getStatus() {
    const record = await bookingRepository.getStatus();
    return toBookingResponse(record);
  }
}

export const bookingService = new BookingService();
