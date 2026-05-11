export class AppError extends Error {
  constructor(message, status = 500, code = "INTERNAL_SERVER_ERROR", details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, code = "BAD_REQUEST", details = null) =>
  new AppError(message, 400, code, details);

export const unauthorized = (message = "Unauthorized", code = "UNAUTHORIZED") =>
  new AppError(message, 401, code);

export const forbidden = (message = "Forbidden", code = "FORBIDDEN") =>
  new AppError(message, 403, code);

export const notFound = (message = "Not found", code = "NOT_FOUND") =>
  new AppError(message, 404, code);

export const conflict = (message = "Conflict", code = "CONFLICT") =>
  new AppError(message, 409, code);
