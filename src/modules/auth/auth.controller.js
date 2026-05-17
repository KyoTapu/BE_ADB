import { sendSuccess } from "../../common/response.js";
import { authService } from "./auth.service.js";

export const authController = {
  async listUsers(req, res, next) {
    try {
      return sendSuccess(res, await authService.listUsers());
    } catch (error) {
      return next(error);
    }
  },

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

  async receptionistLogin(req, res, next) {
    try {
      return sendSuccess(res, await authService.login(req.body, "receptionist"));
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

  async setReceptionist(req, res, next) {
    try {
      return sendSuccess(res, await authService.setRole(req.body.userId, "receptionist"));
    } catch (error) {
      return next(error);
    }
  },

  async setReceptionistHotel(req, res, next) {
    try {
      return sendSuccess(
        res,
        await authService.setReceptionistHotel(req.body.userId, req.body.hotelId),
      );
    } catch (error) {
      return next(error);
    }
  },

  async removeReceptionist(req, res, next) {
    try {
      return sendSuccess(res, await authService.removeReceptionist(req.body.userId));
    } catch (error) {
      return next(error);
    }
  },
};
