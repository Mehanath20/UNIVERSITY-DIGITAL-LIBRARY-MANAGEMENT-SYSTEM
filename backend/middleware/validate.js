import { sendError } from '../utils/response.js';

/**
 * Higher-order middleware factory for validating request parts with Joi schemas.
 * @param {import('joi').Schema} schema
 * @param {'body' | 'query' | 'params'} source
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(d => d.message.replace(/['"]/g, ''));
      return sendError(res, details.join('; '), 'VALIDATION_ERROR', 400, details);
    }

    req[source] = value;
    next();
  };
};
