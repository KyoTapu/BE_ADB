import { userRepository } from "./user.repository.js";
import { toUserListResponse, toUserResponse } from "./user.model.js";
import { buildPaginationMeta } from "../../../common/pagination.js";

class UserService {
  async getById(id) {
    const record = await userRepository.findById(id);

    if (!record) {
      const error = new Error("User not found");
      error.status = 404;
      error.code = "USER_NOT_FOUND";
      throw error;
    }

    return toUserResponse(record);
  }

  async getAll({ page, limit, offset } = {}) {
    if (page && limit) {
      const { rows, totalItems } = await userRepository.findAllPaged({
        limit,
        offset,
      });

      return {
        items: toUserListResponse(rows),
        meta: buildPaginationMeta({ page, limit, totalItems }),
      };
    }

    const data = await userRepository.findAll();
    return { items: toUserListResponse(data), meta: null };
  }
}

export const userService = new UserService();
