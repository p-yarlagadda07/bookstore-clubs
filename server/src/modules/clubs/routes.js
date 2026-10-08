import { Router } from 'express';
import { IdParams, CreateMeetingBody } from '@bookstore/shared';
import { requireAuth, requireVerified, requireClubModerator } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import {
  listClubs,
  getClub,
  joinClubController,
  getClubProgressController,
  createMeetingController,
  getClubMembersController,
} from './controller.js';

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

router.post(
  '/clubs/:id/meetings',
  requireAuth,
  requireClubModerator('id'),
  validate({ params: IdParams, body: CreateMeetingBody }),
  asyncHandler(createMeetingController),
);

router.get(
  '/clubs/:id/members',
  requireAuth,
  requireClubModerator('id'),
  validate({ params: IdParams }),
  asyncHandler(getClubMembersController),
);

export default router;