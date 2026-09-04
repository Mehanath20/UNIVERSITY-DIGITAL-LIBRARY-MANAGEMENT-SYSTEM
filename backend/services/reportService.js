import Book from '../models/Book.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import FinePayment from '../models/FinePayment.js';
import { calculateFine } from '../utils/calculateFine.js';

export class ReportService {
  static async getOverview() {
    const totalBooks = await Book.countDocuments({ status: { $ne: 'ARCHIVED' } });

    const copyAggregation = await Book.aggregate([
      { $match: { status: { $ne: 'ARCHIVED' } } },
      {
        $group: {
          _id: null,
          totalCopies: { $sum: '$totalCopies' },
          availableCopies: { $sum: '$availableCopies' },
          lostCopies: { $sum: '$lostCopies' },
          damagedCopies: { $sum: '$damagedCopies' }
        }
      }
    ]);

    const copyStats = copyAggregation[0] || {
      totalCopies: 0,
      availableCopies: 0,
      lostCopies: 0,
      damagedCopies: 0
    };

    const issuedBooks = copyStats.totalCopies - (copyStats.availableCopies + copyStats.lostCopies + copyStats.damagedCopies);

    const totalMembers = await User.countDocuments({ role: 'MEMBER' });
    const activeMembers = await User.countDocuments({ role: 'MEMBER', isActive: true });
    const totalLibrarians = await User.countDocuments({ role: 'LIBRARIAN' });

    const now = new Date();
    const overdueTransactions = await Transaction.countDocuments({
      status: { $in: ['ISSUED', 'OVERDUE'] },
      dueDate: { $lt: now }
    });

    const fineAggregation = await Transaction.aggregate([
      { $match: { fine: { $gt: 0 } } },
      {
        $group: {
          _id: '$fineStatus',
          totalAmount: { $sum: '$fine' }
        }
      }
    ]);

    let outstandingFines = 0;
    let collectedFines = 0;
    let waivedFines = 0;

    fineAggregation.forEach(item => {
      if (item._id === 'UNPAID' || item._id === 'PARTIAL') {
        outstandingFines += item.totalAmount;
      } else if (item._id === 'PAID') {
        collectedFines += item.totalAmount;
      } else if (item._id === 'WAIVED') {
        waivedFines += item.totalAmount;
      }
    });

    return {
      totalBooks,
      totalCopies: copyStats.totalCopies,
      availableCopies: copyStats.availableCopies,
      issuedBooks: Math.max(0, issuedBooks),
      lostCopies: copyStats.lostCopies,
      damagedCopies: copyStats.damagedCopies,
      totalMembers,
      activeMembers,
      totalLibrarians,
      overdueTransactions,
      outstandingFines,
      collectedFines,
      waivedFines
    };
  }

  static async getMostBorrowed(limit = 10) {
    const results = await Transaction.aggregate([
      {
        $group: {
          _id: '$bookId',
          borrowCount: { $sum: 1 }
        }
      },
      { $sort: { borrowCount: -1 } },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'book'
        }
      },
      { $unwind: '$book' },
      {
        $project: {
          bookId: '$_id',
          title: '$book.title',
          author: '$book.author',
          isbn: '$book.isbn',
          category: '$book.category',
          borrowCount: 1,
          availableCopies: '$book.availableCopies',
          totalCopies: '$book.totalCopies'
        }
      }
    ]);

    return results;
  }

  static async getOverdueReport() {
    const now = new Date();
    const overdueTxs = await Transaction.find({
      status: { $in: ['ISSUED', 'OVERDUE'] },
      dueDate: { $lt: now }
    })
      .populate('bookId', 'title author isbn')
      .populate('memberId', 'name email memberId memberType phone')
      .sort({ dueDate: 1 });

    return overdueTxs.map(tx => {
      const { overdueDays, fine } = calculateFine(tx.dueDate, now, 5, 500);
      return {
        transactionId: tx._id,
        member: tx.memberId,
        book: tx.bookId,
        issueDate: tx.issueDate,
        dueDate: tx.dueDate,
        daysOverdue: overdueDays,
        estimatedFine: fine,
        fineStatus: tx.fineStatus
      };
    });
  }

  static async getInventoryHealth() {
    const aggregation = await Book.aggregate([
      {
        $group: {
          _id: null,
          totalTitles: { $sum: 1 },
          totalCopies: { $sum: '$totalCopies' },
          availableCopies: { $sum: '$availableCopies' },
          lostCopies: { $sum: '$lostCopies' },
          damagedCopies: { $sum: '$damagedCopies' }
        }
      }
    ]);

    const stats = aggregation[0] || {
      totalTitles: 0,
      totalCopies: 0,
      availableCopies: 0,
      lostCopies: 0,
      damagedCopies: 0
    };

    const issuedCopies = Math.max(0, stats.totalCopies - (stats.availableCopies + stats.lostCopies + stats.damagedCopies));
    const availabilityPercentage = stats.totalCopies > 0
      ? `${Math.round((stats.availableCopies / stats.totalCopies) * 100)}%`
      : '0%';

    return {
      ...stats,
      issuedCopies,
      availabilityPercentage
    };
  }

  static async getFineReport() {
    const fineStats = await Transaction.aggregate([
      { $match: { fine: { $gt: 0 } } },
      {
        $group: {
          _id: '$fineStatus',
          totalAmount: { $sum: '$fine' },
          count: { $sum: 1 }
        }
      }
    ]);

    let totalFines = 0;
    let paidFines = 0;
    let unpaidFines = 0;
    let waivedFines = 0;

    fineStats.forEach(item => {
      totalFines += item.totalAmount;
      if (item._id === 'PAID') paidFines += item.totalAmount;
      if (item._id === 'UNPAID' || item._id === 'PARTIAL') unpaidFines += item.totalAmount;
      if (item._id === 'WAIVED') waivedFines += item.totalAmount;
    });

    const recentPayments = await FinePayment.find()
      .populate('memberId', 'name email memberId')
      .populate('processedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(10);

    return {
      totalFines,
      paidFines,
      unpaidFines,
      waivedFines,
      outstandingAmount: unpaidFines,
      statusBreakdown: fineStats,
      recentPayments
    };
  }
}
