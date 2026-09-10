import { TransactionService } from '../services/transactionService.js';
import { sendSuccess } from '../utils/response.js';

export const issueBook = async (req, res, next) => {
  try {
    const result = await TransactionService.issueBook(req.body, req.user);
    return sendSuccess(res, 'Book issued successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

// Allows a signed-in member to borrow a book for their own account.
export const borrowBook = async (req, res, next) => {
  try {
    const result = await TransactionService.issueBook(
      { ...req.body, memberId: req.user._id },
      req.user
    );
    return sendSuccess(res, 'Book borrowed successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

export const returnBook = async (req, res, next) => {
  try {
    const result = await TransactionService.returnBook(req.params.id, req.body, req.user);
    return sendSuccess(res, 'Book returned successfully', result, 200);
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (req, res, next) => {
  try {
    const result = await TransactionService.getAllTransactions(req.query);
    return sendSuccess(res, 'Transactions retrieved successfully', result, 200);
  } catch (error) {
    next(error);
  }
};
