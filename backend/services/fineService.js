import Transaction from '../models/Transaction.js';
import FinePayment from '../models/FinePayment.js';
import { AppError } from '../utils/response.js';

export class FineService {
  static async getMyFines(memberId) {
    const transactions = await Transaction.find({
      memberId,
      fine: { $gt: 0 }
    })
      .populate('bookId', 'title author isbn')
      .sort({ createdAt: -1 });

    const totalFines = transactions.reduce((sum, t) => sum + (t.fine || 0), 0);
    const unpaidFines = transactions
      .filter(t => t.fineStatus === 'UNPAID' || t.fineStatus === 'PARTIAL')
      .reduce((sum, t) => sum + (t.fine || 0), 0);
    const paidFines = transactions
      .filter(t => t.fineStatus === 'PAID')
      .reduce((sum, t) => sum + (t.fine || 0), 0);
    const waivedFines = transactions
      .filter(t => t.fineStatus === 'WAIVED')
      .reduce((sum, t) => sum + (t.fine || 0), 0);

    const payments = await FinePayment.find({ memberId }).sort({ createdAt: -1 });

    return {
      summary: {
        totalFines,
        unpaidFines,
        paidFines,
        waivedFines
      },
      transactions,
      payments
    };
  }

  static async getTransactionFine(transactionId, user) {
    const transaction = await Transaction.findById(transactionId)
      .populate('bookId', 'title author isbn')
      .populate('memberId', 'name email memberId memberType');

    if (!transaction) {
      throw new AppError('Transaction not found', 404, 'NOT_FOUND');
    }

    if (user.role === 'MEMBER' && transaction.memberId._id.toString() !== user._id.toString()) {
      throw new AppError('Access denied: You cannot view fine details for another member', 403, 'FORBIDDEN');
    }

    const payments = await FinePayment.find({ transactionId });
    return { transaction, payments };
  }

  static async payFine(transactionId, { amount, paymentMethod = 'MOCK', notes = '' }, processedBy) {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      throw new AppError('Transaction not found', 404, 'NOT_FOUND');
    }

    if (transaction.fine <= 0) {
      throw new AppError('No overdue fine assessed on this transaction', 400, 'NO_FINE');
    }

    if (transaction.fineStatus === 'PAID') {
      throw new AppError('Fine for this transaction has already been paid in full', 400, 'ALREADY_PAID');
    }

    if (transaction.fineStatus === 'WAIVED') {
      throw new AppError('Fine for this transaction was previously waived', 400, 'ALREADY_WAIVED');
    }

    const payAmount = Number(amount) > 0 ? Number(amount) : transaction.fine;

    const payment = await FinePayment.create({
      transactionId: transaction._id,
      memberId: transaction.memberId,
      amount: payAmount,
      paymentMethod,
      paymentStatus: 'PAID',
      paidAt: new Date(),
      processedBy: processedBy ? processedBy._id : transaction.memberId,
      referenceNumber: `PAY-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      notes
    });

    transaction.fineStatus = 'PAID';
    await transaction.save();

    return { transaction, payment };
  }

  static async waiveFine(transactionId, reason, librarianUser) {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      throw new AppError('Transaction not found', 404, 'NOT_FOUND');
    }

    if (transaction.fine <= 0) {
      throw new AppError('No fine exists to waive on this transaction', 400, 'NO_FINE');
    }

    if (transaction.fineStatus === 'PAID') {
      throw new AppError('Cannot waive a fine that is already paid', 400, 'ALREADY_PAID');
    }

    if (transaction.fineStatus === 'WAIVED') {
      throw new AppError('Fine is already waived', 400, 'ALREADY_WAIVED');
    }

    const payment = await FinePayment.create({
      transactionId: transaction._id,
      memberId: transaction.memberId,
      amount: transaction.fine,
      paymentMethod: 'MOCK',
      paymentStatus: 'WAIVED',
      paidAt: new Date(),
      processedBy: librarianUser._id,
      referenceNumber: `WAIVE-${Date.now()}`,
      notes: `Waived by staff: ${reason}`
    });

    transaction.fineStatus = 'WAIVED';
    await transaction.save();

    return { transaction, payment };
  }
}
