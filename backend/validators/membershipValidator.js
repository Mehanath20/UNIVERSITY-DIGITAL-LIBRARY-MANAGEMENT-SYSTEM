import Joi from 'joi';

export const createMembershipPlanSchema = Joi.object({
  name: Joi.string().trim().required(),
  memberType: Joi.string().valid('STUDENT', 'FACULTY').required(),
  maxBooksAllowed: Joi.number().integer().min(1).required(),
  loanDurationDays: Joi.number().integer().min(1).required(),
  finePerDay: Joi.number().min(0).required(),
  maxFine: Joi.number().min(0).default(500),
  isActive: Joi.boolean().default(true)
});

export const updateMembershipPlanSchema = Joi.object({
  name: Joi.string().trim().optional(),
  maxBooksAllowed: Joi.number().integer().min(1).optional(),
  loanDurationDays: Joi.number().integer().min(1).optional(),
  finePerDay: Joi.number().min(0).optional(),
  maxFine: Joi.number().min(0).optional(),
  isActive: Joi.boolean().optional()
});
