import { Router } from 'express';

import { IdParams } from '@bookstore/shared';
import { TalkingPointsBody } from '@bookstore/shared/schemas/talkingPoints';
import { requireAuth, requireClubModerator } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { getTalkingPoints } from './service.js';

const router = Router();

router.post(
  '/clubs/:id/talking-points',
  requireAuth,
  requireClubModerator('id'),
  validate({
    params: IdParams,
    body: TalkingPointsBody,
  }),
  asyncHandler(async (req, res) =>
    res.ok(await getTalkingPoints(req.params.id, req.body.meetingId)),
  ),
);

export default router;
