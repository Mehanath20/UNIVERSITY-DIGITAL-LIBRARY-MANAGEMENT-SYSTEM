import Joi from 'joi';

export const payFineSchema = Joi.object({
  amount: Joi.number().min(0.01).optional(),
  paymentMethod: Joi.string().valid('CASH', 'ONLINE', 'CARD', 'MOCK').default('MOCK'),
  notes: Joi.string().trim().allow('').default('')
});

export const waiveFineSchema = Joi.object({
  reason: Joi.string().trim().min(3).required().messages({
    'any.required': 'Reason is required when waiving fines'
  })
});
