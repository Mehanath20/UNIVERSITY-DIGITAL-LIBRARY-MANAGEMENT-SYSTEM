import Joi from 'joi';

export const issueBookSchema = Joi.object({
  bookId: Joi.string().hex().length(24).required().messages({
    'string.length': 'bookId must be a valid 24-character ObjectId'
  }),
  memberId: Joi.string().trim().required().messages({
    'any.required': 'memberId is required (User ID or MEM-XXXX ID)'
  }),
  notes: Joi.string().trim().allow('').default('')
});

export const returnBookSchema = Joi.object({
  returnDate: Joi.date().iso().optional(),
  notes: Joi.string().trim().allow('').default('')
});
