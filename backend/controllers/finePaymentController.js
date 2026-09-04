import { FineService } from '../services/fineService.js';
import { sendSuccess } from '../utils/response.js';

export const getMyFines = async (req, res, next) => {
  try {
    const result = await FineService.getMyFines(req.user._id);
    return sendSuccess(res, 'Member fines retrieved', result);
  } catch (error) {
    next(error);
  }
};

export const getTransactionFine = async (req, res, next) => {
  try {
    const result = await FineService.getTransactionFine(req.params.transactionId, req.user);
    return sendSuccess(res, 'Transaction fine details retrieved', result);
  } catch (error) {
    next(error);
  }
};

export const payFine = async (req, res, next) => {
  try {
    const result = await FineService.payFine(req.params.transactionId, req.body, req.user);
    return sendSuccess(res, 'Fine payment recorded successfully', result);
  } catch (error) {
    next(error);
  }
};

export const waiveFine = async (req, res, next) => {
  try {
    const result = await FineService.waiveFine(req.params.transactionId, req.body.reason, req.user);
    return sendSuccess(res, 'Fine waived successfully', result);
  } catch (error) {
    next(error);
  }
};
