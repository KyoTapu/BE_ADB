import { verifyAccessToken } from "./jwt.js";

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      const error = new Error("Missing bearer token");
      error.status = 401;
      error.code = "MISSING_BEARER_TOKEN";
      throw error;
    }

    const token = authHeader.slice(7).trim();
    const payload = verifyAccessToken(token);

    req.user = payload;
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
        const error = new Error("Unauthenticated");
        error.status = 401;
        error.code = "UNAUTHENTICATED";
        throw error;
      }

      if (allowedRoles.length === 0) {
        return next();
      }

      if (!allowedRoles.includes(req.user.role)) {
        const error = new Error("Forbidden");
        error.status = 403;
        error.code = "FORBIDDEN";
        throw error;
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
