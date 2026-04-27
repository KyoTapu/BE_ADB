import { userService } from "./user.service.js";
import { sendError, sendSuccess } from "../../../common/response.js";
import { parsePagination } from "../../../common/pagination.js";

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const getAdminUserById = async (req, res, next) => {
  try {
    const userId = String(req.params.id || "").trim();

    if (!UUID_V4_REGEX.test(userId)) {
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

export const getAllAdminUser = async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query, {
      defaultPage: 1,
      defaultLimit: 20,
      maxLimit: 100,
    });

    const result = await userService.getAll(pagination);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};
