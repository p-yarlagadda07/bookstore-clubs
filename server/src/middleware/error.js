import { AppError } from '../lib/AppError.js';

export function notFound(req, _res, next) {
  next(new AppError('NOT_FOUND', 404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, _next) {
  const status = err.status ?? 500;
  if (status >= 500) req.log?.error({ err }, 'request failed');
  res.status(status).json({
    ok: false,
    error: {
      code: err.code ?? 'INTERNAL',
      message: status >= 500 ? 'Something went wrong' : err.message,
      details: err.details,
    },
  });
}
