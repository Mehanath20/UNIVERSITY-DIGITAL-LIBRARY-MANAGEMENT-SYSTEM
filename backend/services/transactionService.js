import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import Book from '../models/Book.js';
import User from '../models/User.js';
import MembershipPlan from '../models/MembershipPlan.js';
import InventoryLog from '../models/InventoryLog.js';
import { HoldService } from './holdService.js';
import { calculateFine } from '../utils/calculateFine.js';
import { AppError } from '../utils/response.js';
import { getPagination, formatPaginatedResponse } from '../utils/pagination.js';

export class TransactionService {
  /**
   * Issues a book to a member following all 12 business rules.
   */
  static async issueBook({ bookId, memberId, notes = '' }, librarianUser) {
    // 1. Resolve member (by ObjectId or memberId string)
    let member;
    if (mongoose.Types.ObjectId.isValid(memberId)) {
      member = await User.findById(memberId);
    }
    if (!member) {
      member = await User.findOne({ memberId: memberId.trim().toUpperCase() });
    }
    if (!member) {
      throw new AppError(`Member not found with identifier '${memberId}'`, 404, 'MEMBER_NOT_FOUND');
    }

    // 2. Member must be active
    if (!member.isActive) {
      throw new AppError(`Member account '${member.name}' is currently deactivated`, 403, 'MEMBER_INACTIVE');
    }

    // 3. Book must exist
    const book = await Book.findById(bookId);
    if (!book) {
      throw new AppError('Book not found', 404, 'BOOK_NOT_FOUND');
    }
    if (book.status === 'ARCHIVED') {
      throw new AppError('Cannot issue an archived book', 400, 'BOOK_ARCHIVED');
    }

    // 4. Book must have available copies
    if (book.availableCopies <= 0) {
      throw new AppError(`No available copies for '${book.title}'. Current available copies: 0`, 409, 'BOOK_UNAVAILABLE');
    }

    // 5. Member must not already have the same book currently issued
    const existingActiveIssue = await Transaction.findOne({
      bookId: book._id,
      memberId: member._id,
      status: { $in: ['ISSUED', 'OVERDUE'] }
    });
    if (existingActiveIssue) {
      throw new AppError(
        `Member '${member.name}' already has an active copy of '${book.title}' issued (Due: ${existingActiveIssue.dueDate.toLocaleDateString()})`,
        409,
        'DUPLICATE_ISSUE'
      );
    }

    // 6. Check membership plan and limits
    let plan = await MembershipPlan.findOne({ memberType: member.memberType, isActive: true });
    if (!plan) {
      // Default fallback if plan not yet seeded
      plan = {
        maxBooksAllowed: member.memberType === 'FACULTY' ? 5 : 3,
        loanDurationDays: member.memberType === 'FACULTY' ? 30 : 14,
        finePerDay: member.memberType === 'FACULTY' ? 2 : 5,
        maxFine: 500
      };
    }

    const currentIssuedCount = await Transaction.countDocuments({
      memberId: member._id,
      status: { $in: ['ISSUED', 'OVERDUE'] }
    });

    if (currentIssuedCount >= plan.maxBooksAllowed) {
      throw new AppError(
        `Member has reached maximum borrowing limit (${plan.maxBooksAllowed} book(s) allowed for ${member.memberType}). Currently borrowed: ${currentIssuedCount}`,
        409,
        'BORROW_LIMIT_EXCEEDED'
      );
    }

    // 7. Check for blocking unpaid overdue fines (> 50 or configured)
    const unpaidFines = await Transaction.find({
      memberId: member._id,
      fineStatus: { $in: ['UNPAID', 'PARTIAL'] }
    });
    const totalUnpaid = unpaidFines.reduce((acc, t) => acc + (t.fine || 0), 0);
    if (totalUnpaid > 100) {
      throw new AppError(
        `Member has excessive outstanding unpaid fines ($${totalUnpaid}). Fines must be cleared before issuing new books.`,
        409,
        'UNPAID_FINES_BLOCKING'
      );
    }

    // 8. Calculate due date using membership plan
    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + plan.loanDurationDays);

    // 9. Decrease available copies
    const prevAvailable = book.availableCopies;
    book.availableCopies -= 1;
    if (book.availableCopies === 0) {
      book.status = 'UNAVAILABLE';
    }
    await book.save();

    // 10. Create transaction
    const transaction = await Transaction.create({
      bookId: book._id,
      memberId: member._id,
      issuedBy: librarianUser._id,
      issueDate,
      dueDate,
      status: 'ISSUED',
      fineStatus: 'NONE',
      fine: 0,
      notes
    });

    // 11. Create inventory log
    await InventoryLog.create({
      bookId: book._id,
      action: 'BOOK_ISSUED',
      quantity: 1,
      previousAvailableCopies: prevAvailable,
      newAvailableCopies: book.availableCopies,
      performedBy: librarianUser._id,
      reason: `Issued to ${member.name} (${member.memberId || member.email})`
    });

    return {
      transactionId: transaction._id,
      book: {
        _id: book._id,
        title: book.title,
        isbn: book.isbn,
        availableCopies: book.availableCopies
      },
      member: {
        _id: member._id,
        name: member.name,
        email: member.email,
        memberId: member.memberId,
        memberType: member.memberType
      },
      issueDate,
      dueDate,
      status: transaction.status
    };
  }

  /**
   * Returns a borrowed book, calculates overdue fine, logs inventory, and notifies hold queue.
   */
  static async returnBook(transactionId, { returnDate = new Date(), notes = '' } = {}, librarianUser) {
    const transaction = await Transaction.findById(transactionId)
      .populate('bookId')
      .populate('memberId');

    if (!transaction) {
      throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
    }

    // Rule 2 & 3: Must be ISSUED or OVERDUE, prevent duplicate return
    if (transaction.status === 'RETURNED') {
      throw new AppError(
        `This book was already returned on ${new Date(transaction.returnDate).toLocaleDateString()}`,
        409,
        'ALREADY_RETURNED'
      );
    }

    if (!['ISSUED', 'OVERDUE'].includes(transaction.status)) {
      throw new AppError(`Cannot return transaction with status '${transaction.status}'`, 400, 'INVALID_STATUS');
    }

    // 4. Set returnDate
    const actualReturnDate = returnDate ? new Date(returnDate) : new Date();
    transaction.returnDate = actualReturnDate;

    // 5 & 6. Get membership plan to get fine rate
    const member = transaction.memberId;
    let plan = await MembershipPlan.findOne({ memberType: member.memberType });
    const fineRate = plan ? plan.finePerDay : 5;
    const maxFine = plan ? plan.maxFine : 500;

    // 7. Calculate overdue fine
    const { overdueDays, fine } = calculateFine(transaction.dueDate, actualReturnDate, fineRate, maxFine);
    transaction.fine = fine;
    transaction.fineStatus = fine > 0 ? 'UNPAID' : 'NONE';
    transaction.status = 'RETURNED';
    if (notes) {
      transaction.notes = transaction.notes ? `${transaction.notes}; ${notes}` : notes;
    }
    await transaction.save();

    // 9. Increase availableCopies
    const book = await Book.findById(transaction.bookId._id);
    let holdNotification = null;

    if (book) {
      const prevAvailable = book.availableCopies;
      book.availableCopies += 1;
      if (book.status === 'UNAVAILABLE' && book.availableCopies > 0) {
        book.status = 'AVAILABLE';
      }
      await book.save();

      // 10. Create inventory log
      await InventoryLog.create({
        bookId: book._id,
        action: 'BOOK_RETURNED',
        quantity: 1,
        previousAvailableCopies: prevAvailable,
        newAvailableCopies: book.availableCopies,
        performedBy: librarianUser ? librarianUser._id : transaction.issuedBy,
        reason: `Returned by ${member.name}. Overdue days: ${overdueDays}, Fine: $${fine}`
      });

      // 12. Process hold queue if applicable
      holdNotification = await HoldService.processNextHold(book._id);
    }

    return {
      transaction,
      overdueDays,
      fine,
      fineStatus: transaction.fineStatus,
      holdNotification: holdNotification ? {
        notifiedMemberId: holdNotification.memberId,
        expiresAt: holdNotification.expiresAt
      } : null
    };
  }

  static async getMemberHistory(memberId, queryParams) {
    const { page, limit, skip } = getPagination(queryParams);
    const filter = { memberId };

    if (queryParams.status) {
      filter.status = queryParams.status.toUpperCase();
    }

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .populate('bookId', 'title author isbn category')
      .populate('issuedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return formatPaginatedResponse(transactions, total, page, limit);
  }

  static async getAllTransactions(queryParams) {
    const { page, limit, skip } = getPagination(queryParams);
    const filter = {};

    if (queryParams.status) {
      filter.status = queryParams.status.toUpperCase();
    }
    if (queryParams.fineStatus) {
      filter.fineStatus = queryParams.fineStatus.toUpperCase();
    }

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .populate('bookId', 'title author isbn')
      .populate('memberId', 'name email memberId memberType')
      .populate('issuedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return formatPaginatedResponse(transactions, total, page, limit);
  }
}
