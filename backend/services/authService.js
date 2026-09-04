import User from '../models/User.js';
import { generateMemberId } from '../utils/generateMemberId.js';
import { generateToken } from '../utils/generateToken.js';
import { AppError } from '../utils/response.js';

export class AuthService {
  static async register({ name, email, password, memberType = 'STUDENT', phone }) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new AppError(`User with email '${email}' already exists`, 409, 'EMAIL_EXISTS');
    }

    const passwordHash = await User.hashPassword(password);
    let memberId = generateMemberId();

    // Ensure memberId uniqueness
    let conflict = await User.findOne({ memberId });
    while (conflict) {
      memberId = generateMemberId();
      conflict = await User.findOne({ memberId });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'MEMBER',
      memberType,
      memberId,
      phone,
      isActive: true
    });

    const token = generateToken({
      userId: user._id,
      role: user.role,
      memberType: user.memberType
    });

    const safeUser = user.toObject();
    delete safeUser.passwordHash;

    return { user: safeUser, token };
  }

  static async login({ email, password }) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated. Please contact administrator.', 403, 'ACCOUNT_DEACTIVATED');
    }

    const token = generateToken({
      userId: user._id,
      role: user.role,
      memberType: user.memberType
    });

    const safeUser = user.toObject();
    delete safeUser.passwordHash;

    return { user: safeUser, token };
  }

  static async getMe(userId) {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }
    return user;
  }

  static async createLibrarian({ name, email, password, phone }) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new AppError(`User with email '${email}' already exists`, 409, 'EMAIL_EXISTS');
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'LIBRARIAN',
      phone,
      isActive: true
    });

    const safeUser = user.toObject();
    delete safeUser.passwordHash;
    return safeUser;
  }
}
