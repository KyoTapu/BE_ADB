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

