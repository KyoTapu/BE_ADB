import { userRepository } from "./user.repository.js";
import { toUserResponse } from "./user.model.js";

class UserService {
  async getStatus() {
    const record = await userRepository.getStatus();
    return toUserResponse(record);
  }
}

export const userService = new UserService();
