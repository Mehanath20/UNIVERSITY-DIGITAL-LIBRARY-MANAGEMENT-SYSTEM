import Book from '../models/Book.js';
import InventoryLog from '../models/InventoryLog.js';
import { AppError } from '../utils/response.js';
import { getPagination, formatPaginatedResponse } from '../utils/pagination.js';

export class InventoryService {
  static async getInventory(queryParams) {
    const { page, limit, skip } = getPagination(queryParams);
    const filter = {};

    if (queryParams.category) {
      filter.category = new RegExp(queryParams.category, 'i');
    }
    if (queryParams.status) {
      filter.status = queryParams.status;
    }

    const total = await Book.countDocuments(filter);
    const books = await Book.find(filter)
      .sort({ title: 1 })
      .skip(skip)
      .limit(limit);

    const inventoryData = books.map(book => {
      const b = book.toObject();
      const availabilityPct = b.totalCopies > 0
        ? Math.round((b.availableCopies / b.totalCopies) * 100)
        : 0;
      return {
        ...b,
        availabilityPercentage: `${availabilityPct}%`
      };
    });

    return formatPaginatedResponse(inventoryData, total, page, limit);
  }

  static async getBookInventory(bookId) {
    const book = await Book.findById(bookId);
    if (!book) {
      throw new AppError('Book not found', 404, 'NOT_FOUND');
    }
    const b = book.toObject();
    const availabilityPct = b.totalCopies > 0
      ? Math.round((b.availableCopies / b.totalCopies) * 100)
      : 0;
    return {
      ...b,
      availabilityPercentage: `${availabilityPct}%`
    };
  }

  static async adjustCopies(bookId, { quantity, action = 'COPY_ADJUSTED', reason = '' }, user) {
    const book = await Book.findById(bookId);
    if (!book) {
      throw new AppError('Book not found', 404, 'NOT_FOUND');
    }

    const prevAvailable = book.availableCopies;
    const newAvailable = prevAvailable + quantity;

    if (newAvailable < 0) {
      throw new AppError(`Cannot adjust copies: available copies cannot drop below 0 (current: ${prevAvailable}, adjustment: ${quantity})`, 400, 'INSUFFICIENT_COPIES');
    }

    book.totalCopies = Math.max(0, book.totalCopies + quantity);
    book.availableCopies = newAvailable;
    await book.save();

    const log = await InventoryLog.create({
      bookId: book._id,
      action,
      quantity,
      previousAvailableCopies: prevAvailable,
      newAvailableCopies: newAvailable,
      performedBy: user._id,
      reason
    });

    return { book, log };
  }

  static async markLost(bookId, { quantity = 1, reason = '' }, user) {
    const book = await Book.findById(bookId);
    if (!book) {
      throw new AppError('Book not found', 404, 'NOT_FOUND');
    }

    if (book.availableCopies < quantity) {
      throw new AppError(`Cannot mark ${quantity} copies as lost; only ${book.availableCopies} available in stock`, 400, 'INSUFFICIENT_STOCK');
    }

    const prevAvailable = book.availableCopies;
    book.availableCopies -= quantity;
    book.lostCopies = (book.lostCopies || 0) + quantity;
    await book.save();

    const log = await InventoryLog.create({
      bookId: book._id,
      action: 'BOOK_LOST',
      quantity,
      previousAvailableCopies: prevAvailable,
      newAvailableCopies: book.availableCopies,
      performedBy: user._id,
      reason: reason || 'Marked lost during inventory audit'
    });

    return { book, log };
  }

  static async markDamaged(bookId, { quantity = 1, reason = '' }, user) {
    const book = await Book.findById(bookId);
    if (!book) {
      throw new AppError('Book not found', 404, 'NOT_FOUND');
    }

    if (book.availableCopies < quantity) {
      throw new AppError(`Cannot mark ${quantity} copies as damaged; only ${book.availableCopies} available in stock`, 400, 'INSUFFICIENT_STOCK');
    }

    const prevAvailable = book.availableCopies;
    book.availableCopies -= quantity;
    book.damagedCopies = (book.damagedCopies || 0) + quantity;
    await book.save();

    const log = await InventoryLog.create({
      bookId: book._id,
      action: 'BOOK_DAMAGED',
      quantity,
      previousAvailableCopies: prevAvailable,
      newAvailableCopies: book.availableCopies,
      performedBy: user._id,
      reason: reason || 'Identified damaged condition'
    });

    return { book, log };
  }

  static async getBookLogs(bookId) {
    return InventoryLog.find({ bookId })
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 });
  }
}
