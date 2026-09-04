import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { sendError } from '../utils/response.js';
import User from '../models/User.js';

export const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication token required', 'AUTH_REQUIRED', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      return sendError(res, 'User belonging to this token no longer exists', 'USER_NOT_FOUND', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Your account has been deactivated. Please contact library administration.', 'ACCOUNT_DEACTIVATED', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid authentication token', 'AUTH_INVALID_TOKEN', 401);
    }
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Authentication token has expired. Please login again.', 'AUTH_TOKEN_EXPIRED', 401);
    }
    return next(error);
  }
};
