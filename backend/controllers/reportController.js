import { ReportService } from '../services/reportService.js';
import { sendSuccess } from '../utils/response.js';

export const getOverview = async (req, res, next) => {
  try {
    const data = await ReportService.getOverview();
    return sendSuccess(res, 'Overview metrics retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const getMostBorrowed = async (req, res, next) => {
  try {
    const data = await ReportService.getMostBorrowed(req.query.limit || 10);
    return sendSuccess(res, 'Most borrowed books retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const getOverdueReport = async (req, res, next) => {
  try {
    const data = await ReportService.getOverdueReport();
    return sendSuccess(res, 'Overdue report retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const getInventoryHealth = async (req, res, next) => {
  try {
    const data = await ReportService.getInventoryHealth();
    return sendSuccess(res, 'Inventory health metrics retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const getFineReport = async (req, res, next) => {
  try {
    const data = await ReportService.getFineReport();
    return sendSuccess(res, 'Fine collection report retrieved', data);
  } catch (error) {
    next(error);
  }
};
