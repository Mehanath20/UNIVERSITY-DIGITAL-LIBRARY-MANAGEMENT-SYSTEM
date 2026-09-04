import { sendError } from '../utils/response.js';

/**
 * Middleware to restrict access based on user roles.
 * @param  {...string} allowedRoles 
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required before authorization', 'UNAUTHORIZED', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied: role '${req.user.role}' is not authorized to access this resource`,
        'FORBIDDEN',
        403
      );
    }

    next();
  };
};
