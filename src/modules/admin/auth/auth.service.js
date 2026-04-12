import { authRepository } from "./auth.repository.js";
import { toAuthResponse } from "./auth.model.js";

class AuthService {
  async getStatus() {
    const record = await authRepository.getStatus();
    return toAuthResponse(record);
  }
}

export const authService = new AuthService();
