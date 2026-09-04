import User from '../models/User.js';
import { AuthService } from '../services/authService.js';
import { ReportService } from '../services/reportService.js';
import { sendSuccess, AppError } from '../utils/response.js';

export const createLibrarian = async (req, res, next) => {
  try {
    const librarian = await AuthService.createLibrarian(req.body);
    return sendSuccess(res, 'Librarian account created successfully', librarian, 201);
  } catch (error) {
    next(error);
  }
};

export const getLibrarians = async (req, res, next) => {
  try {
    const librarians = await User.find({ role: 'LIBRARIAN' }).select('-passwordHash').sort({ createdAt: -1 });
    return sendSuccess(res, 'Librarians retrieved successfully', librarians);
  } catch (error) {
    next(error);
  }
};

export const updateLibrarian = async (req, res, next) => {
  try {
    const librarian = await User.findOne({ _id: req.params.id, role: 'LIBRARIAN' });
    if (!librarian) {
      throw new AppError('Librarian account not found', 404, 'NOT_FOUND');
    }

    if (req.body.name) librarian.name = req.body.name;
    if (req.body.phone !== undefined) librarian.phone = req.body.phone;
    if (typeof req.body.isActive === 'boolean') librarian.isActive = req.body.isActive;

    await librarian.save();

    const safeUser = librarian.toObject();
    delete safeUser.passwordHash;

    return sendSuccess(res, 'Librarian account updated successfully', safeUser);
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    if (user.role === 'ADMIN' && req.user._id.toString() === user._id.toString()) {
      throw new AppError('Administrators cannot disable their own accounts', 400, 'SELF_DEACTIVATION_PROHIBITED');
    }

    user.isActive = !user.isActive;
    await user.save();

    return sendSuccess(res, `User account ${user.isActive ? 'activated' : 'deactivated'} successfully`, {
      userId: user._id,
      name: user.name,
      isActive: user.isActive
    });
  } catch (error) {
    next(error);
  }
};

export const getSystemStats = async (req, res, next) => {
  try {
    const overview = await ReportService.getOverview();
    return sendSuccess(res, 'System statistics retrieved', overview);
  } catch (error) {
    next(error);
  }
};
