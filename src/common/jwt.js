import jwt from "jsonwebtoken";
import { AppError } from "./errors.js";
import { env } from "../configs/env.js";

const normalizeExpiresIn = (rawValue) => {
  const normalized = String(rawValue || "1d").trim().toLowerCase();
  return normalized === "1day" ? "1d" : normalized;
};

const getJwtSecret = () => {
  if (!env.jwtAccessSecret) {
    throw new AppError("JWT_ACCESS_SECRET is missing", 500, "JWT_SECRET_MISSING");
  }

  return env.jwtAccessSecret;
};

export const signAccessToken = (payload) => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: normalizeExpiresIn(env.jwtExpiresIn),
  });
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    throw new AppError(
      "Invalid or expired token",
      401,
      error?.name === "TokenExpiredError" ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
    );
  }
};
