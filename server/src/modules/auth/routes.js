import { Router } from 'express';
import { z } from 'zod';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { LoginBody, SignupBody, ForgotBody, ResetBody } from '@bookstore/shared/schemas/auth';
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
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${String(req.body?.email ?? '').toLowerCase()}`,
  handler: (_req, _res, next) =>
    next(new AppError('RATE_LIMITED', 429, 'Too many login attempts, try again in 15 minutes')),
});

const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  handler: (_req, _res, next) =>
    next(new AppError('RATE_LIMITED', 429, 'Too many sign ups, try again in 15 minutes')),
});

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  handler: (_req, _res, next) =>
    next(new AppError('RATE_LIMITED', 429, 'Too many requests, try again in 15 minutes')),
});

const VerifyQuery = z.object({ token: z.string().min(10).max(200) });

router.get('/auth/csrf', ctrl.csrf);
router.post('/auth/login', loginLimiter, validate({ body: LoginBody }), asyncHandler(ctrl.login));
router.post('/auth/logout', asyncHandler(ctrl.logout));
router.get('/auth/me', requireAuth, ctrl.me);
router.post(
  '/auth/signup',
  signupLimiter,
  validate({ body: SignupBody }),
  asyncHandler(ctrl.signup),
);
router.get('/auth/verify', validate({ query: VerifyQuery }), asyncHandler(ctrl.verify));
router.post(
  '/auth/forgot',
  forgotLimiter,
  validate({ body: ForgotBody }),
  asyncHandler(ctrl.forgot),
);
router.post('/auth/reset', validate({ body: ResetBody }), asyncHandler(ctrl.reset));

export default router;
