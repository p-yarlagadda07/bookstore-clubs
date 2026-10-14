import { Router } from 'express';
import { PreferencesBody } from '@bookstore/shared/schemas/preferences';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import * as controller from './controller.js';

const router = Router();

router.get('/users/me/preferences', requireAuth, asyncHandler(controller.get));

router.patch(
  '/users/me/preferences',
  requireAuth,
  validate({ body: PreferencesBody }),
  asyncHandler(controller.update),
);

export default router;
