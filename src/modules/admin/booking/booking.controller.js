import { adminBookingService } from "./booking.service.js";
import { sendSuccess } from "../../../common/response.js";

export const getBookings = async (req, res, next) => {
  try {
    const data = await adminBookingService.getDashboardList(req.query);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const data = await adminBookingService.changeStatus(id, status);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};
