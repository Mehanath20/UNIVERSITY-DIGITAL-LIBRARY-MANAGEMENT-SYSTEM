import { sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.errorCode || 'SERVER_ERROR';

  // Handle Mongoose CastError (Invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for resource identifier: '${err.value}'`;
    errorCode = 'INVALID_ID';
  }

  // Handle Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const val = err.keyValue ? err.keyValue[field] : '';
    message = `Duplicate value '${val}' for unique field: '${field}'`;
    errorCode = 'DUPLICATE_RESOURCE';
  }

  // Handle Mongoose Schema Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
    errorCode = 'VALIDATION_ERROR';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    errorCode = 'AUTH_INVALID_TOKEN';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please login again.';
    errorCode = 'AUTH_TOKEN_EXPIRED';
  }

  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error('[Unhandled Error]:', err);
  }

  return sendError(res, message, errorCode, statusCode, err.stack);
};
