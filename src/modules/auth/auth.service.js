import bcrypt from "bcryptjs";
import { badRequest, conflict, forbidden, notFound, unauthorized } from "../../common/errors.js";
import { toAuthUser, toLoginResponse } from "./auth.model.js";
import { authRepository } from "./auth.repository.js";

export const authService = {
  async getStatus() {
    return authRepository.getStatus();
  },

  async register(payload = {}) {
    const email = String(payload.email || "").trim();
    const password = String(payload.password || "");
    const fullName = String(payload.fullName || payload.full_name || "").trim();
    const phone = String(payload.phone || "").trim() || null;

    if (!email || !password) {
      throw badRequest("Email and password are required", "MISSING_CREDENTIALS");
    }

    if (password.length < 6) {
      throw badRequest("Password length must be at least 6 characters", "INVALID_PASSWORD");
    }

    const existingUser = await authRepository.findUserByEmail(email);
    if (existingUser) {
      throw conflict("Email already exists", "EMAIL_ALREADY_EXISTS");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await authRepository.createUser({
      fullName,
      email,
      phone,
      passwordHash,
    });

    return toLoginResponse(user);
  },

  async login(payload = {}, expectedRole = null) {
    const email = String(payload.email || "").trim();
    const password = String(payload.password || "");

    if (!email || !password) {
      throw badRequest("Email and password are required", "MISSING_CREDENTIALS");
    }

    const user = await authRepository.findUserByEmail(email);
    const isPasswordValid = user?.password_hash && (await bcrypt.compare(password, user.password_hash));

    if (!user || !isPasswordValid) {
      throw unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
    }

    if (user.is_banned) {
      throw forbidden("Account is banned", "ACCOUNT_BANNED");
    }

    if (user.is_active === false) {
      throw forbidden("Account is inactive", "ACCOUNT_INACTIVE");
    }

    if (expectedRole && user.role !== expectedRole) {
      throw forbidden("Role is not allowed for this endpoint", "ROLE_NOT_ALLOWED");
    }

    return toLoginResponse(user);
  },

  async me(userId) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw notFound("User not found", "USER_NOT_FOUND");
    }

    return toAuthUser(user);
  },

  async setRole(userId, role) {
    const updatedUser = await authRepository.setUserRole(userId, role);
    if (!updatedUser) {
      throw notFound("User not found", "USER_NOT_FOUND");
    }

    return toAuthUser(updatedUser);
  },
};
