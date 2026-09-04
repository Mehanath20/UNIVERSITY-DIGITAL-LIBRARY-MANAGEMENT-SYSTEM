import Book from '../models/Book.js';
import Transaction from '../models/Transaction.js';
import InventoryLog from '../models/InventoryLog.js';
import { AppError } from '../utils/response.js';
import { getPagination, formatPaginatedResponse } from '../utils/pagination.js';

export class BookService {
  static async createBook(data, userId) {
    const existing = await Book.findOne({ isbn: data.isbn.trim() });
    if (existing) {
      throw new AppError(`Book with ISBN '${data.isbn}' already exists`, 409, 'DUPLICATE_ISBN');
    }

    const availableCopies = data.totalCopies;
    const book = await Book.create({
      ...data,
      availableCopies,
      lostCopies: 0,
      damagedCopies: 0,
      status: availableCopies > 0 ? 'AVAILABLE' : 'UNAVAILABLE'
    });

    // Create initial inventory log
    await InventoryLog.create({
      bookId: book._id,
      action: 'BOOK_ADDED',
      quantity: book.totalCopies,
      previousAvailableCopies: 0,
      newAvailableCopies: book.availableCopies,
      performedBy: userId,
      reason: 'Initial book catalog entry'
    });

    return book;
  }

  static async getBooks(queryParams) {
    const { page, limit, skip } = getPagination(queryParams);
    const filter = {};

    if (queryParams.category) {
      filter.category = new RegExp(queryParams.category, 'i');
    }
    if (queryParams.status) {
      filter.status = queryParams.status.toUpperCase();
    }

    const total = await Book.countDocuments(filter);
    const books = await Book.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return formatPaginatedResponse(books, total, page, limit);
  }

  static async searchBooks(queryParams) {
    const { page, limit, skip } = getPagination(queryParams);
    const filter = {};

    if (queryParams.title) {
      filter.title = { $regex: queryParams.title.trim(), $options: 'i' };
    }
    if (queryParams.author) {
      filter.author = { $regex: queryParams.author.trim(), $options: 'i' };
    }
    if (queryParams.category) {
      filter.category = { $regex: queryParams.category.trim(), $options: 'i' };
    }
    if (queryParams.available === 'true') {
      filter.availableCopies = { $gt: 0 };
      filter.status = 'AVAILABLE';
    } else if (queryParams.available === 'false') {
      filter.availableCopies = 0;
    }

    const total = await Book.countDocuments(filter);
    const books = await Book.find(filter)
      .sort({ title: 1 })
      .skip(skip)
      .limit(limit);

    return formatPaginatedResponse(books, total, page, limit);
  }

  static async getBookById(id) {
    const book = await Book.findById(id);
    if (!book) {
      throw new AppError('Book not found', 404, 'NOT_FOUND');
    }
    return book;
  }

  static async updateBook(id, updateData, userId) {
    const book = await Book.findById(id);
    if (!book) {
      throw new AppError('Book not found', 404, 'NOT_FOUND');
    }

    if (updateData.isbn && updateData.isbn !== book.isbn) {
      const conflict = await Book.findOne({ isbn: updateData.isbn.trim(), _id: { $ne: id } });
      if (conflict) {
        throw new AppError(`ISBN '${updateData.isbn}' is already registered to another book`, 409, 'DUPLICATE_ISBN');
      }
    }

    // If totalCopies is being updated directly
    if (typeof updateData.totalCopies === 'number') {
      if (updateData.totalCopies < (book.lostCopies + book.damagedCopies)) {
        throw new AppError('Total copies cannot be less than lost and damaged copies combined', 400, 'INVALID_COPIES');
      }
      const issued = book.totalCopies - (book.availableCopies + book.lostCopies + book.damagedCopies);
      const newAvailable = updateData.totalCopies - issued - book.lostCopies - book.damagedCopies;
      if (newAvailable < 0) {
        throw new AppError(`Cannot reduce total copies below active loans (${issued})`, 409, 'ACTIVE_LOANS_EXCEED');
      }
      book.totalCopies = updateData.totalCopies;
      book.availableCopies = newAvailable;
    }

    Object.assign(book, updateData);
    await book.save();
    return book;
  }

  static async deleteBook(id) {
    const book = await Book.findById(id);
    if (!book) {
      throw new AppError('Book not found', 404, 'NOT_FOUND');
    }

    // Check for active transactions
    const activeTransactions = await Transaction.countDocuments({
      bookId: id,
      status: { $in: ['ISSUED', 'OVERDUE'] }
    });

    if (activeTransactions > 0) {
      throw new AppError(
        `Cannot delete book '${book.title}'. It currently has ${activeTransactions} active borrowing transaction(s). Archive the book instead.`,
        409,
        'ACTIVE_TRANSACTIONS_EXIST'
      );
    }

    // Check if historical transactions exist
    const historyCount = await Transaction.countDocuments({ bookId: id });
    if (historyCount > 0) {
      book.status = 'ARCHIVED';
      book.availableCopies = 0;
      await book.save();
      return { message: 'Book has borrowing history and has been ARCHIVED to preserve records', archived: true };
    }

    await Book.findByIdAndDelete(id);
    return { message: 'Book deleted successfully', archived: false };
  }
}
