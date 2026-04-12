import { userService } from "./user.service.js";
import { sendSuccess } from "../../../common/response.js";

export const getUserStatus = async (req, res, next) => {
  try {
    const data = await userService.getStatus();
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
};

