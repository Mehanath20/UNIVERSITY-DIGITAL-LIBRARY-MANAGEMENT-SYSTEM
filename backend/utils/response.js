/**
 * Standard API response helper ensuring uniform responses across all endpoints.
 */

export const sendSuccess = (res, message = 'Operation successful', data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

export const sendError = (res, message = 'An error occurred', errorCode = 'SERVER_ERROR', statusCode = 500, details = null) => {
  const payload = {
    success: false,
    message,
    errorCode
  };
  if (details && process.env.NODE_ENV !== 'production') {
    payload.details = details;
  }
  return res.status(statusCode).json(payload);
};

export class AppError extends Error {
  constructor(message, statusCode = 400, errorCode = 'BAD_REQUEST') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
