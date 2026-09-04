import { InventoryService } from '../services/inventoryService.js';
import { sendSuccess } from '../utils/response.js';

export const getInventory = async (req, res, next) => {
  try {
    const result = await InventoryService.getInventory(req.query);
    return sendSuccess(res, 'Inventory retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getBookInventory = async (req, res, next) => {
  try {
    const result = await InventoryService.getBookInventory(req.params.bookId);
    return sendSuccess(res, 'Book inventory details retrieved', result);
  } catch (error) {
    next(error);
  }
};

export const adjustCopies = async (req, res, next) => {
  try {
    const result = await InventoryService.adjustCopies(req.params.bookId, req.body, req.user);
    return sendSuccess(res, 'Book copies adjusted successfully', result);
  } catch (error) {
    next(error);
  }
};

export const markLost = async (req, res, next) => {
  try {
    const result = await InventoryService.markLost(req.params.bookId, req.body, req.user);
    return sendSuccess(res, 'Book marked as lost and inventory updated', result);
  } catch (error) {
    next(error);
  }
};

export const markDamaged = async (req, res, next) => {
  try {
    const result = await InventoryService.markDamaged(req.params.bookId, req.body, req.user);
    return sendSuccess(res, 'Book marked as damaged and inventory updated', result);
  } catch (error) {
    next(error);
  }
};

export const getBookLogs = async (req, res, next) => {
  try {
    const logs = await InventoryService.getBookLogs(req.params.bookId);
    return sendSuccess(res, 'Inventory logs retrieved', logs);
  } catch (error) {
    next(error);
  }
};
