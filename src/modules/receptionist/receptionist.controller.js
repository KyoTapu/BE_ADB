import { sendSuccess } from "../../common/response.js";
import { receptionistService } from "./receptionist.service.js";

export const receptionistController = {
  async lookup(req, res, next) {
    try {
      return sendSuccess(res, await receptionistService.lookupBooking(req.user, req.query));
    } catch (error) {
      return next(error);
    }
  },

  async roomBoard(req, res, next) {
    try {
      return sendSuccess(res, await receptionistService.roomBoard(req.user, req.query));
    } catch (error) {
      return next(error);
    }
  },

  async dailyBookings(req, res, next) {
    try {
      return sendSuccess(res, await receptionistService.listDailyBookings(req.user, req.query));
    } catch (error) {
      return next(error);
    }
  },

  async checkIn(req, res, next) {
    try {
      return sendSuccess(res, await receptionistService.checkInBooking(req.user, req.params.id));
    } catch (error) {
      return next(error);
    }
  },

  async checkOut(req, res, next) {
    try {
      return sendSuccess(res, await receptionistService.checkOutBooking(req.user, req.params.id));
    } catch (error) {
      return next(error);
    }
  },

  async markPaidAtDesk(req, res, next) {
    try {
      return sendSuccess(res, await receptionistService.markPaidAtDesk(req.user, req.params.id));
    } catch (error) {
      return next(error);
    }
  },

  async markNoShow(req, res, next) {
    try {
      return sendSuccess(res, await receptionistService.markNoShow(req.user, req.params.id));
    } catch (error) {
      return next(error);
    }
  },
};
