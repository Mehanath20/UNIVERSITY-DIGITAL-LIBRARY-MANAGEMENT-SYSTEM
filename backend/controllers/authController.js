import { AuthService } from '../services/authService.js';
import { sendSuccess } from '../utils/response.js';

export const register = async (req, res, next) => {
  try {
    const result = await AuthService.register(req.body);
    return sendSuccess(res, 'Member registered successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await AuthService.login(req.body);
    return sendSuccess(res, 'Login successful', result, 200);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await AuthService.getMe(req.user._id);
    return sendSuccess(res, 'Profile retrieved successfully', user, 200);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  return sendSuccess(res, 'Logged out successfully', {}, 200);
};
