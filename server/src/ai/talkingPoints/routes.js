import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { IdParams } from '@bookstore/shared/schemas/common';
import { TalkingPointsBody } from '@bookstore/shared/schemas/talkingPoints';
import { requireClubModerator } from '../../middleware/auth.js';
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
  async (req, res, next) => {
    try {
      const result = await getTalkingPoints(
        req.params.id,
        req.body.meetingId,
      );

      res.ok(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;