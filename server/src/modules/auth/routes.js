import { Router } from 'express';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { LoginBody } from '@bookstore/shared/schemas/auth';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { AppError } from '../../lib/AppError.js';
import * as ctrl from './controller.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip)}:${String(req.body?.email ?? '').toLowerCase()}`,
  handler: (_req, _res, next) =>
    next(new AppError('RATE_LIMITED', 429, 'Too many login attempts, try again in 15 minutes')),
});

router.get('/auth/csrf', ctrl.csrf);
router.post('/auth/login', loginLimiter, validate({ body: LoginBody }), asyncHandler(ctrl.login));
router.post('/auth/logout', asyncHandler(ctrl.logout));
router.get('/auth/me', requireAuth, ctrl.me);

export default router;