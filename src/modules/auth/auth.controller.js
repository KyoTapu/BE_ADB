import { sendSuccess } from "../../common/response.js";
import { authService } from "./auth.service.js";

export const authController = {
  async health(req, res, next) {
    try {
      return sendSuccess(res, await authService.getStatus());
    } catch (error) {
      return next(error);
    }
  },

  async register(req, res, next) {
    try {
      return sendSuccess(res, await authService.register(req.body), 201);
    } catch (error) {
      return next(error);
    }
  },

  async login(req, res, next) {
    try {
      return sendSuccess(res, await authService.login(req.body));
    } catch (error) {
      return next(error);
    }
  },

  async adminLogin(req, res, next) {
    try {
      return sendSuccess(res, await authService.login(req.body, "admin"));
    } catch (error) {
      return next(error);
    }
  },

  async me(req, res, next) {
    try {
      return sendSuccess(res, await authService.me(req.user?.sub));
    } catch (error) {
      return next(error);
    }
  },

  async setAdmin(req, res, next) {
    try {
      return sendSuccess(res, await authService.setRole(req.body.userId, "admin"));
    } catch (error) {
      return next(error);
    }
  },

  async removeAdmin(req, res, next) {
    try {
      return sendSuccess(res, await authService.setRole(req.body.userId, "client"));
    } catch (error) {
      return next(error);
    }
  },
};
