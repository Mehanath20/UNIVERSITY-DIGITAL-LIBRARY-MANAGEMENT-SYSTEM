import Hold from '../models/Hold.js';
import Book from '../models/Book.js';
import User from '../models/User.js';
import { NotificationService } from './notificationService.js';
import { AppError } from '../utils/response.js';
import { ENV } from '../config/env.js';

export class HoldService {
  static async createHold(bookId, memberId) {
    const member = await User.findById(memberId);
    if (!member || !member.isActive) {
      throw new AppError('Active member account required to place holds', 400, 'MEMBER_INACTIVE');
    }

    const book = await Book.findById(bookId);
    if (!book) {
      throw new AppError('Book not found', 404, 'NOT_FOUND');
    }
    if (book.status === 'ARCHIVED') {
      throw new AppError('Cannot place hold on an archived book', 400, 'BOOK_ARCHIVED');
    }

    // Holds are only useful when no copies are currently available
    if (book.availableCopies > 0) {
      throw new AppError(
        'Copies of this book are currently available in the library for direct issue. Reservation is only permitted when available copies are 0.',
        400,
        'COPIES_AVAILABLE'
      );
    }

    // Check duplicate active hold
    const existingHold = await Hold.findOne({
      bookId,
      memberId,
      status: { $in: ['WAITING', 'NOTIFIED'] }
    });

    if (existingHold) {
      throw new AppError('You already have an active hold reservation on this book', 409, 'DUPLICATE_HOLD');
    }

    // Calculate queue position
    const waitingCount = await Hold.countDocuments({
      bookId,
      status: 'WAITING'
    });
    const queuePosition = waitingCount + 1;

    const hold = await Hold.create({
      bookId,
      memberId,
      queuePosition,
      status: 'WAITING',
      requestedAt: new Date()
    });

    const populatedHold = await Hold.findById(hold._id).populate('bookId', 'title author isbn');
    return populatedHold;
  }

  static async getMyHolds(memberId) {
    return Hold.find({ memberId })
      .populate('bookId', 'title author isbn availableCopies status')
      .sort({ requestedAt: -1 });
  }

  static async getBookHolds(bookId) {
    return Hold.find({ bookId, status: { $in: ['WAITING', 'NOTIFIED'] } })
      .populate('memberId', 'name email memberId memberType')
      .sort({ queuePosition: 1, requestedAt: 1 });
  }

  static async cancelHold(holdId, userId, userRole) {
    const hold = await Hold.findById(holdId);
    if (!hold) {
      throw new AppError('Hold reservation not found', 404, 'NOT_FOUND');
    }

    // Only the member who created it or Staff can cancel
    if (userRole === 'MEMBER' && hold.memberId.toString() !== userId.toString()) {
      throw new AppError('You cannot cancel another member\'s reservation', 403, 'FORBIDDEN');
    }

    if (['FULFILLED', 'CANCELLED', 'EXPIRED'].includes(hold.status)) {
      throw new AppError(`Hold is already marked as ${hold.status}`, 400, 'HOLD_ALREADY_CLOSED');
    }

    hold.status = 'CANCELLED';
    await hold.save();

    // Re-index remaining waiting queue positions for this book
    const remaining = await Hold.find({ bookId: hold.bookId, status: 'WAITING' }).sort({ requestedAt: 1 });
    for (let i = 0; i < remaining.length; i++) {
      remaining[i].queuePosition = i + 1;
      await remaining[i].save();
    }

    return hold;
  }

  /**
   * Process next hold in queue when a copy is returned.
   */
  static async processNextHold(bookId) {
    const nextHold = await Hold.findOne({
      bookId,
      status: 'WAITING'
    }).sort({ queuePosition: 1, requestedAt: 1 }).populate('bookId');

    if (!nextHold) return null;

    const expiryDays = ENV.HOLD_EXPIRY_DAYS || 3;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    nextHold.status = 'NOTIFIED';
    nextHold.expiresAt = expiresAt;
    await nextHold.save();

    // Generate notification for this member
    await NotificationService.createNotification({
      memberId: nextHold.memberId,
      type: 'BOOK_AVAILABLE',
      message: `Great news! The reserved book "${nextHold.bookId.title}" is now available for you to borrow. Please collect it before ${expiresAt.toLocaleDateString()}.`
    });

    return nextHold;
  }
}
