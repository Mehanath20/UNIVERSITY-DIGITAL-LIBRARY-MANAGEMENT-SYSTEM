import Notification from '../models/Notification.js';
import Transaction from '../models/Transaction.js';
import { getPagination, formatPaginatedResponse } from '../utils/pagination.js';

export class NotificationService {
  static async createNotification({ memberId, transactionId = null, type, message }) {
    return Notification.create({
      memberId,
      transactionId,
      type,
      message,
      status: 'SENT',
      sentAt: new Date()
    });
  }

  static async getMyNotifications(memberId, queryParams) {
    const { page, limit, skip } = getPagination(queryParams);
    const filter = { memberId };

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return formatPaginatedResponse(notifications, total, page, limit);
  }

  static async markAsRead(notificationId, memberId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, memberId },
      { status: 'READ' },
      { new: true }
    );
  }

  static async scanAndGenerateOverdueNotifications() {
    const now = new Date();
    // Find active transactions where dueDate < now
    const overdueTransactions = await Transaction.find({
      status: { $in: ['ISSUED', 'OVERDUE'] },
      dueDate: { $lt: now }
    }).populate('bookId memberId');

    let createdCount = 0;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const tx of overdueTransactions) {
      if (tx.status !== 'OVERDUE') {
        tx.status = 'OVERDUE';
        await tx.save();
      }

      // Check if notification exists within last 24 hours for this transaction
      const recentNotice = await Notification.findOne({
        transactionId: tx._id,
        type: 'OVERDUE_REMINDER',
        createdAt: { $gte: oneDayAgo }
      });

      if (!recentNotice && tx.memberId) {
        const bookTitle = tx.bookId?.title || 'Borrowed Book';
        const formattedDue = new Date(tx.dueDate).toLocaleDateString();
        await Notification.create({
          memberId: tx.memberId._id,
          transactionId: tx._id,
          type: 'OVERDUE_REMINDER',
          message: `Your borrowed book "${bookTitle}" was due on ${formattedDue}. Please return it to avoid further overdue fines.`,
          status: 'SENT',
          sentAt: now
        });
        createdCount++;
      }
    }

    return {
      scanned: overdueTransactions.length,
      notificationsGenerated: createdCount
    };
  }
}
