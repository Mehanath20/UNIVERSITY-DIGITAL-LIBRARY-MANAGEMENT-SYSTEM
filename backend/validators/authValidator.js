import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(6).required(),
  memberType: Joi.string().valid('STUDENT', 'FACULTY').default('STUDENT'),
  phone: Joi.string().trim().allow('', null).optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required()
});

export const createLibrarianSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().trim().allow('', null).optional()
});

export const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  phone: Joi.string().trim().allow('', null).optional(),
  isActive: Joi.boolean().optional(),
  memberType: Joi.string().valid('STUDENT', 'FACULTY').optional()
});
