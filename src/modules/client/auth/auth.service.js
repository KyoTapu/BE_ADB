import { authRepository } from "./auth.repository.js";
import { toAuthResponse, toClientAuthUser, toLoginResponse } from "./auth.model.js";
import { signAccessToken } from "../../../common/jwt.js";
import bcrypt from "bcryptjs";

class AuthService {
  async getStatus() {
    const record = await authRepository.getStatus();
    return toAuthResponse(record);
  }

  async register(payload = {}) {
    const fullName = String(payload.fullName || "").trim();
    const email = String(payload.email || "").trim();
    const phone = String(payload.phone || "").trim() || null;
    const password = String(payload.password || "");

    if (!email || !password) {
      const error = new Error("Email and password are required");
      error.status = 400;
      error.code = "MISSING_CREDENTIALS";
      throw error;
    }
    if (password.length <= 5) {
      const error = new Error("password length must longer than 5");
      error.status = 400;
      error.code = "INVALID_PASSWORD";
      throw error;
    }

    const existed = await authRepository.findUserByEmail(email);
    if (existed) {
      const error = new Error("Email already exists");
      error.status = 409;
      error.code = "EMAIL_ALREADY_EXISTS";
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let user;
    try {
      user = await authRepository.createUser({
        fullName,
        email,
        phone,
        passwordHash,
      });
    } catch (dbError) {
      if (dbError?.code === "23505") {
        const error = new Error("Email already exists");
        error.status = 409;
        error.code = "EMAIL_ALREADY_EXISTS";
        throw error;
      }
      throw dbError;
    }

    const role = user.role || "client";
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role,
    });

    return toLoginResponse({
      accessToken,
      expiresIn: process.env.JWT_EXPIRES_IN,
      user,
    });
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
    const isPasswordValid = user?.password_hash && (await bcrypt.compare(password, user.password_hash));

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

    const role = user.role || "client";
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role,
    });

    return toLoginResponse({
      accessToken,
      expiresIn: process.env.JWT_EXPIRES_IN,
      user,
    });
  }

  async getMyProfile(userId) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      error.code = "USER_NOT_FOUND";
      throw error;
    }

    return toClientAuthUser(user);
  }
}

export const authService = new AuthService();
