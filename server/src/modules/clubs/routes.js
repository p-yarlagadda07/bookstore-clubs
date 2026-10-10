import { Router } from 'express';
import {
  CreateMeetingBody,
  UpdateClubBody,
  ExcerptListQuery,
  ApproveExcerptBody,
} from '@bookstore/shared/schemas/clubs';
import { IdParams } from '@bookstore/shared';
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
  updateClubController,
  removeClubMemberController,
  listClubExcerptsController,
  updateExcerptApprovalController,
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

router.patch(
  '/clubs/:id',
  requireAuth,
  requireClubModerator('id'),
  validate({ params: IdParams, body: UpdateClubBody }),
  asyncHandler(updateClubController),
);

router.delete(
  '/clubs/:id/members/:userId',
  requireAuth,
  requireClubModerator('id'),
  validate({
    params: IdParams.extend({
      userId: IdParams.shape.id,
    }),
  }),
  asyncHandler(removeClubMemberController),
);

router.get(
  '/clubs/:id/excerpts',
  requireAuth,
  requireClubModerator('id'),
  validate({
    params: IdParams,
    query: ExcerptListQuery,
  }),
  asyncHandler(listClubExcerptsController),
);

router.patch(
  '/clubs/:id/excerpts/:excerptId',
  requireAuth,
  requireClubModerator('id'),
  validate({
    params: IdParams.extend({
      excerptId: IdParams.shape.id,
    }),
    body: ApproveExcerptBody,
  }),
  asyncHandler(updateExcerptApprovalController),
);

export default router;
