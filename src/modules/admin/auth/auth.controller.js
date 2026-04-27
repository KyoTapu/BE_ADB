import { authService } from "./auth.service.js";
import { sendSuccess } from "../../../common/response.js";

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const getAuthStatus = async (req, res, next) => {
  try {
    const data = await authService.getStatus();
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
};

export const loginAdmin = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getMyAuthProfile = async (req, res, next) => {
  try {
    return sendSuccess(res, {
      id: req.user?.sub || null,
      email: req.user?.email || null,
      role: req.user?.role || null,
    });
  } catch (error) {
    return next(error);
  }
};

export const setAdmin = async (req, res, next) => {
  try {
    const userId = String(req.body?.userId || "").trim();
    if (!UUID_V4_REGEX.test(userId)) {
      const error = new Error("Invalid userId");
      error.status = 400;
      error.code = "INVALID_USER_ID";
      throw error;
    }

    const data = await authService.setAdmin({ userId });
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
};

export const deleteAdmin = async (req, res, next) => {
  try {
    const userId = String(req.body?.userId || "").trim();
    if (!UUID_V4_REGEX.test(userId)) {
      const error = new Error("Invalid userId");
      error.status = 400;
      error.code = "INVALID_USER_ID";
      throw error;
    }

    const data = await authService.deleteAdmin({ userId });
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
};
