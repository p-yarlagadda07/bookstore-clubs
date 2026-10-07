import { Router } from 'express';
import { SetProgressBody, BookIdParams } from '@bookstore/shared/schemas/progress';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './controller.js';

const router = Router();

router.patch(
  '/reading-progress',
  requireAuth,
  validate({ body: SetProgressBody }),
  asyncHandler(ctrl.set),
);
router.get('/reading-progress/mine', requireAuth, asyncHandler(ctrl.listMine));
router.get(
  '/reading-progress/:bookId',
  requireAuth,
  validate({ params: BookIdParams }),
  asyncHandler(ctrl.getOne),
);

export default router;
