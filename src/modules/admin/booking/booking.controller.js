import { bookingService } from "./booking.service.js";

export const getBookingStatus = async (req, res, next) => {
  try {
    const data = await bookingService.getStatus();
    res.json(data);
  } catch (error) {
    next(error);
  }
};
