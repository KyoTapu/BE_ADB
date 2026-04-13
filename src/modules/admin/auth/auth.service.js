import { authRepository } from "./auth.repository.js";
import { toAuthResponse, toLoginResponse, toRoleUpdateResponse } from "./auth.model.js";
import { signAccessToken } from "../../../common/jwt.js";
import bcrypt from "bcryptjs";

class AuthService {
  async getStatus() {
    const record = await authRepository.getStatus();
    return toAuthResponse(record);
  }

  async login(payload = {}) {
    const email = String(payload.email || "").trim();
    const password = String(payload.password || "");

    if (!email || !password) {
      const error = new Error("Email and password are required");
      error.status = 400;
      error.code = "MISSING_CREDENTIALS";
      throw error;
    }

    const user = await authRepository.findUserByEmail(email);

    const isPasswordValid =
      user?.password_hash && (await bcrypt.compare(password, user.password_hash));

    if (!user || !isPasswordValid) {
      const error = new Error("Invalid email or password");
      error.status = 401;
      error.code = "INVALID_CREDENTIALS";
      throw error;
    }

    if (user.is_banned) {
      const error = new Error("Account is banned");
      error.status = 403;
      error.code = "ACCOUNT_BANNED";
      throw error;
    }

    if (user.is_active === false) {
      const error = new Error("Account is inactive");
      error.status = 403;
      error.code = "ACCOUNT_INACTIVE";
      throw error;
    }

    if (user.role !== "admin") {
      const error = new Error("Only admin can login via admin auth");
      error.status = 403;
      error.code = "ROLE_NOT_ADMIN";
      throw error;
    }

    const role = user.role;
    const accessToken = signAccessToken({
      sub: user.user_id,
      email: user.email,
      role,
    });

    return toLoginResponse({
      accessToken,
      expiresIn: process.env.JWT_EXPIRES_IN,
      user: {
        id: user.user_id,
        email: user.email,
        fullName: user.full_name,
        role,
      },
    });
  }

  async setAdmin(payload = {}) {
    const userId = String(payload.userId || "").trim();

    if (!userId) {
      const error = new Error("userId is required");
      error.status = 400;
      error.code = "MISSING_USER_ID";
      throw error;
    }

    const updated = await authRepository.setUserRole(userId, "admin");
    if (!updated) {
      const error = new Error("User not found");
      error.status = 404;
      error.code = "USER_NOT_FOUND";
      throw error;
    }

    return toRoleUpdateResponse(updated);
  }

  async deleteAdmin(payload = {}) {
    const userId = String(payload.userId || "").trim();

    if (!userId) {
      const error = new Error("userId is required");
      error.status = 400;
      error.code = "MISSING_USER_ID";
      throw error;
    }

    const updated = await authRepository.setUserRole(userId, "client");
    if (!updated) {
      const error = new Error("User not found");
      error.status = 404;
      error.code = "USER_NOT_FOUND";
      throw error;
    }

    return toRoleUpdateResponse(updated);
  }
}

export const authService = new AuthService();
