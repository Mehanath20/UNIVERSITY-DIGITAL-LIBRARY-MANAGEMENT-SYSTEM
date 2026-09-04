import { HoldService } from '../services/holdService.js';
import { sendSuccess } from '../utils/response.js';

export const createHold = async (req, res, next) => {
  try {
    const hold = await HoldService.createHold(req.body.bookId, req.user._id);
    return sendSuccess(res, 'Hold reservation placed successfully', hold, 201);
  } catch (error) {
    next(error);
  }
};

export const getMyHolds = async (req, res, next) => {
  try {
    const holds = await HoldService.getMyHolds(req.user._id);
    return sendSuccess(res, 'Member reservations retrieved', holds);
  } catch (error) {
    next(error);
  }
};

export const getBookHolds = async (req, res, next) => {
  try {
    const holds = await HoldService.getBookHolds(req.params.bookId);
    return sendSuccess(res, 'Book hold queue retrieved', holds);
  } catch (error) {
    next(error);
  }
};

export const cancelHold = async (req, res, next) => {
  try {
    const result = await HoldService.cancelHold(req.params.id, req.user._id, req.user.role);
    return sendSuccess(res, 'Hold reservation cancelled successfully', result);
  } catch (error) {
    next(error);
  }
};
