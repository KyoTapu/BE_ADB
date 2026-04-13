import { authService } from "./auth.service.js";
import { sendSuccess } from "../../../common/response.js";

export const getAuthStatus = async (req, res, next) => {
  try {
    const data = await authService.getStatus();
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
};

export const registerClient = async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    return sendSuccess(res, data, 201);
  } catch (error) {
    return next(error);
  }
};

export const loginClient = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getClientAuthProfile = async (req, res, next) => {
  try {
    const data = await authService.getMyProfile(req.user?.sub);
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
};

