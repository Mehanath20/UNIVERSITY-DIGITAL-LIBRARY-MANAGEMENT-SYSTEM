import MembershipPlan from '../models/MembershipPlan.js';
import { sendSuccess, AppError } from '../utils/response.js';

export const getPlans = async (req, res, next) => {
  try {
    const plans = await MembershipPlan.find().sort({ memberType: 1 });
    return sendSuccess(res, 'Membership plans retrieved', plans);
  } catch (error) {
    next(error);
  }
};

export const getPlanById = async (req, res, next) => {
  try {
    const plan = await MembershipPlan.findById(req.params.id);
    if (!plan) {
      throw new AppError('Membership plan not found', 404, 'NOT_FOUND');
    }
    return sendSuccess(res, 'Membership plan retrieved', plan);
  } catch (error) {
    next(error);
  }
};

export const createPlan = async (req, res, next) => {
  try {
    const existing = await MembershipPlan.findOne({ memberType: req.body.memberType });
    if (existing) {
      throw new AppError(`Plan for member type '${req.body.memberType}' already exists`, 409, 'DUPLICATE_PLAN');
    }
    const plan = await MembershipPlan.create(req.body);
    return sendSuccess(res, 'Membership plan created successfully', plan, 201);
  } catch (error) {
    next(error);
  }
};

export const updatePlan = async (req, res, next) => {
  try {
    const plan = await MembershipPlan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!plan) {
      throw new AppError('Membership plan not found', 404, 'NOT_FOUND');
    }
    return sendSuccess(res, 'Membership plan updated successfully', plan);
  } catch (error) {
    next(error);
  }
};

export const deletePlan = async (req, res, next) => {
  try {
    const plan = await MembershipPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      throw new AppError('Membership plan not found', 404, 'NOT_FOUND');
    }
    return sendSuccess(res, 'Membership plan deleted successfully', plan);
  } catch (error) {
    next(error);
  }
};
