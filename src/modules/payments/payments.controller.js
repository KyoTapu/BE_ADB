import { sendSuccess } from "../../common/response.js";
import { paymentsService } from "./payments.service.js";

export const paymentsController = {
  async list(req, res, next) {
    try {
      return sendSuccess(res, await paymentsService.list(req.query));
    } catch (error) {
      return next(error);
    }
  },

  async getById(req, res, next) {
    try {
      return sendSuccess(res, await paymentsService.getById(req.params.id));
    } catch (error) {
      return next(error);
    }
  },

  async create(req, res, next) {
    try {
      return sendSuccess(res, await paymentsService.create(req.body), 201);
    } catch (error) {
      return next(error);
    }
  },

  async update(req, res, next) {
    try {
      return sendSuccess(res, await paymentsService.update(req.params.id, req.body));
    } catch (error) {
      return next(error);
    }
  },

  async remove(req, res, next) {
    try {
      return sendSuccess(res, await paymentsService.remove(req.params.id));
    } catch (error) {
      return next(error);
    }
  },

  async getBookingStatus(req, res, next) {
    try {
      return sendSuccess(res, await paymentsService.getStatusByBookingId(req.params.bookingId));
    } catch (error) {
      return next(error);
    }
  },

  async vnpayIpn(req, res, next) {
    try {
      return res.status(200).json(await paymentsService.handleVnpayIpn(req.query));
    } catch (error) {
      return next(error);
    }
  },

  async vnpayReturn(req, res, next) {
    try {
      return res.redirect(await paymentsService.buildVnpayReturnRedirect(req.query));
    } catch (error) {
      return next(error);
    }
  },
};
