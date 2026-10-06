import { AppError } from '../lib/AppError.js';

// Usage: router.post('/x', validate({ body: Schema, query: Q, params: P }), handler)
export const validate = (schemas) => (req, _res, next) => {
  for (const key of ['params', 'query', 'body']) {
    if (!schemas[key]) continue;
    const result = schemas[key].safeParse(req[key]);
    if (!result.success) {
      return next(new AppError('VALIDATION_ERROR', 400, 'Invalid input', result.error.flatten()));
    }
    if (key === 'query')
      req.validatedQuery = result.data; // req.query is read-only in some setups
    else req[key] = result.data;
  }
  next();
};
