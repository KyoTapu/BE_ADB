import { userService } from "./user.service.js";
import { sendError, sendSuccess } from "../../../common/response.js";

export const getAdminUserById = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return sendError(res, {
        status: 400,
        message: "Invalid user id",
        code: "INVALID_USER_ID",
      });
    }

    const data = await userService.getById(userId);
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getAllAdminUser = async (req, res) => {
  const result = await userService.getAll();

  return sendSuccess(res, result);
};
