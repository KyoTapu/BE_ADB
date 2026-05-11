import { verifyAccessToken } from "./jwt.js";
import { forbidden, unauthorized } from "./errors.js";

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      throw unauthorized("Missing bearer token", "MISSING_BEARER_TOKEN");
    }

    const token = authHeader.slice(7).trim();
    req.user = verifyAccessToken(token);
    return next();
  } catch (error) {
    return next(error);
  }
};

export const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    try {
      if (!req.user) {
        throw unauthorized("Unauthenticated", "UNAUTHENTICATED");
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
        throw forbidden("Forbidden", "FORBIDDEN");
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
