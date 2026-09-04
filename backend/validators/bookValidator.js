import Joi from 'joi';

export const createBookSchema = Joi.object({
  title: Joi.string().trim().required(),
  author: Joi.string().trim().required(),
  isbn: Joi.string().trim().required(),
  category: Joi.string().trim().required(),
  description: Joi.string().trim().allow('').default(''),
  publisher: Joi.string().trim().allow('').default(''),
  publicationYear: Joi.number().integer().min(1000).max(new Date().getFullYear() + 1).optional(),
  totalCopies: Joi.number().integer().min(1).required()
});

export const updateBookSchema = Joi.object({
  title: Joi.string().trim().optional(),
  author: Joi.string().trim().optional(),
  isbn: Joi.string().trim().optional(),
  category: Joi.string().trim().optional(),
  description: Joi.string().trim().allow('').optional(),
  publisher: Joi.string().trim().allow('').optional(),
  publicationYear: Joi.number().integer().min(1000).max(new Date().getFullYear() + 1).optional(),
  totalCopies: Joi.number().integer().min(0).optional(),
  status: Joi.string().valid('AVAILABLE', 'UNAVAILABLE', 'ARCHIVED').optional()
});

export const searchBookSchema = Joi.object({
  title: Joi.string().trim().allow('').optional(),
  author: Joi.string().trim().allow('').optional(),
  category: Joi.string().trim().allow('').optional(),
  available: Joi.string().valid('true', 'false').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

export const adjustInventorySchema = Joi.object({
  quantity: Joi.number().integer().required(),
  action: Joi.string().valid('COPY_ADJUSTED', 'COPY_RESTORED', 'BOOK_ADDED').default('COPY_ADJUSTED'),
  reason: Joi.string().trim().allow('').default('')
});

export const lostOrDamagedSchema = Joi.object({
  quantity: Joi.number().integer().min(1).default(1),
  reason: Joi.string().trim().allow('').default('')
});
