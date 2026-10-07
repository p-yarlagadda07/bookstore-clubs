import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { SetProgressBody, BookIdParams } from '@bookstore/shared/schemas/progress';
import * as ctrl from './controller.js';

const router = Router();

router.put('/progress', requireAuth, validate({ body: SetProgressBody }), asyncHandler(ctrl.set));
router.get('/progress/:bookId', requireAuth, validate({ params: BookIdParams }), asyncHandler(ctrl.getOne));

export default router;
