import { bookingService } from "./booking.service.js";
import { sendSuccess } from "../../../common/response.js";

export const createBooking = async (req, res, next) => {
  try {
    const userId = req.user.user_id; // Lấy từ auth.middleware
    const result = await bookingService.createBooking(userId, req.body);
    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 
    const result = await bookingService.processCheckInOut(id, status);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
