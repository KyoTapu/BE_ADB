import { sendSuccess } from "../../common/response.js";
import { bookingsService } from "./bookings.service.js";
import { getRequestIp } from "../payments/vnpay.js";

export const bookingsController = {
  async myHistory(req, res, next) {
    try {
      return sendSuccess(res, await bookingsService.listMyHistory(req.user, req.query));
    } catch (error) {
      return next(error);
    }
  },

  async adminHistory(req, res, next) {
    try {
      return sendSuccess(res, await bookingsService.listAdminHistory(req.query));
    } catch (error) {
      return next(error);
    }
  },

  async list(req, res, next) {
    try {
      return sendSuccess(res, await bookingsService.list(req.query));
    } catch (error) {
      return next(error);
    }
  },

  async getById(req, res, next) {
    try {
      return sendSuccess(res, await bookingsService.getById(req.params.id));
    } catch (error) {
      return next(error);
    }
  },

  async create(req, res, next) {
    try {
      return sendSuccess(
        res,
        await bookingsService.create({
          ...req.body,
          ipAddress: getRequestIp(req),
        }),
        201,
      );
    } catch (error) {
      return next(error);
    }
  },

  async update(req, res, next) {
    try {
      return sendSuccess(res, await bookingsService.update(req.params.id, req.body));
    } catch (error) {
      return next(error);
    }
  },

  async remove(req, res, next) {
    try {
      return sendSuccess(res, await bookingsService.remove(req.params.id));
    } catch (error) {
      return next(error);
    }
  },
};
