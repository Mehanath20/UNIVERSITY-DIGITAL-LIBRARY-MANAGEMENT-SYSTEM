import Joi from 'joi';

export const createHoldSchema = Joi.object({
  bookId: Joi.string().hex().length(24).required().messages({
    'string.length': 'bookId must be a valid 24-character ObjectId'
  })
});
