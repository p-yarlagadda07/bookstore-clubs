import { Router } from 'express';
import { IdParams } from '@bookstore/shared';
import { requireAuth, requireVerified } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { listClubs, getClub, joinClubController, getClubProgressController } from './controller.js';

const router = Router();

router.get('/clubs', asyncHandler(listClubs));
router.get('/clubs/:id', validate({ params: IdParams }), asyncHandler(getClub));
router.get(
  '/clubs/:id/progress',
  requireAuth,
  validate({ params: IdParams }),
  asyncHandler(getClubProgressController),
);

router.post(
  '/clubs/:id/join',
  requireAuth,
  requireVerified,
  validate({ params: IdParams }),
  asyncHandler(joinClubController),
);

export default router;
