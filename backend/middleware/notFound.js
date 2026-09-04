import { sendError } from '../utils/response.js';

export const notFound = (req, res, next) => {
  return sendError(res, `Resource not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND', 404);
};
