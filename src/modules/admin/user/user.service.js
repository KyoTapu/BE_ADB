import { userRepository } from "./user.repository.js";
import { toUserListResponse, toUserResponse } from "./user.model.js";

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

  async getAll() {
    const data = await userRepository.findAll();

    if (!data) {
      throw new Error("can not find users");
    }
    console.log("🚀 ~ UserService ~ getAll ~ data:", data);
    return toUserListResponse(data);
  }
}

export const userService = new UserService();
