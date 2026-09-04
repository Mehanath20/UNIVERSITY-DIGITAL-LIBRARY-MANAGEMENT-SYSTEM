import { BookService } from '../services/bookService.js';
import { sendSuccess } from '../utils/response.js';

export const getBooks = async (req, res, next) => {
  try {
    const result = await BookService.getBooks(req.query);
    return sendSuccess(res, 'Books retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const searchBooks = async (req, res, next) => {
  try {
    const result = await BookService.searchBooks(req.query);
    return sendSuccess(res, 'Book search results', result);
  } catch (error) {
    next(error);
  }
};

export const getBookById = async (req, res, next) => {
  try {
    const book = await BookService.getBookById(req.params.id);
    return sendSuccess(res, 'Book details retrieved successfully', book);
  } catch (error) {
    next(error);
  }
};

export const createBook = async (req, res, next) => {
  try {
    const book = await BookService.createBook(req.body, req.user._id);
    return sendSuccess(res, 'Book created successfully', book, 201);
  } catch (error) {
    next(error);
  }
};

export const updateBook = async (req, res, next) => {
  try {
    const book = await BookService.updateBook(req.params.id, req.body, req.user._id);
    return sendSuccess(res, 'Book updated successfully', book);
  } catch (error) {
    next(error);
  }
};

export const deleteBook = async (req, res, next) => {
  try {
    const result = await BookService.deleteBook(req.params.id);
    return sendSuccess(res, result.message, result);
  } catch (error) {
    next(error);
  }
};
