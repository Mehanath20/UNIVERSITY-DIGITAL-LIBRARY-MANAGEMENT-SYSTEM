import User from '../models/User.js';
import { TransactionService } from '../services/transactionService.js';
import { sendSuccess, AppError } from '../utils/response.js';
import { getPagination, formatPaginatedResponse } from '../utils/pagination.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};

    if (req.query.role) filter.role = req.query.role.toUpperCase();
    if (req.query.memberType) filter.memberType = req.query.memberType.toUpperCase();
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { memberId: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, 'Users retrieved successfully', formatPaginatedResponse(users, total, page, limit));
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }
    return sendSuccess(res, 'User retrieved successfully', user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    // Role can only be changed by admin
    if (req.body.role && req.user.role !== 'ADMIN') {
      throw new AppError('Only administrators can modify user roles', 403, 'FORBIDDEN');
    }

    Object.assign(user, req.body);
    await user.save();

    const safeUser = user.toObject();
    delete safeUser.passwordHash;

    return sendSuccess(res, 'User updated successfully', safeUser);
  } catch (error) {
    next(error);
  }
};

export const getMyHistory = async (req, res, next) => {
  try {
    const result = await TransactionService.getMemberHistory(req.user._id, req.query);
    return sendSuccess(res, 'Borrowing history retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getMemberHistoryById = async (req, res, next) => {
  try {
    // If regular member requests, ensure they can only query their own ID
    if (req.user.role === 'MEMBER' && req.params.id !== req.user._id.toString()) {
      throw new AppError('Access denied: You cannot view another member\'s borrowing history', 403, 'FORBIDDEN');
    }

    const result = await TransactionService.getMemberHistory(req.params.id, req.query);
    return sendSuccess(res, 'Member borrowing history retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};
