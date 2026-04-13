import jwt from "jsonwebtoken";

const normalizeExpiresIn = (rawValue) => {
  const normalized = String(rawValue || "1d").trim().toLowerCase();
  return normalized === "1day" ? "1d" : normalized;
};

export const signAccessToken = (payload) => {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    const error = new Error("JWT_ACCESS_SECRET is missing");
    error.status = 500;
    error.code = "JWT_SECRET_MISSING";
    throw error;
  }

  return jwt.sign(payload, secret, {
    expiresIn: normalizeExpiresIn(process.env.JWT_EXPIRES_IN),
  });
};

export const verifyAccessToken = (token) => {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    const error = new Error("JWT_ACCESS_SECRET is missing");
    error.status = 500;
    error.code = "JWT_SECRET_MISSING";
    throw error;
  }

  try {
    return jwt.verify(token, secret);
  } catch (err) {
    const error = new Error("Invalid or expired token");
    error.status = 401;
    error.code = err?.name === "TokenExpiredError" ? "TOKEN_EXPIRED" : "INVALID_TOKEN";
    throw error;
  }
};
