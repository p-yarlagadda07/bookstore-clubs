import { Router } from 'express';
import { IdParams, ObjectId } from '@bookstore/shared';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { meetingIcs } from './service.js';

const router = Router();

const MeetingParams = IdParams.extend({ meetingId: ObjectId });

router.get(
  '/clubs/:id/meetings/:meetingId/calendar.ics',
  requireAuth,
  validate({ params: MeetingParams }),
  asyncHandler(async (req, res) => {
    const text = await meetingIcs(req.user, req.params.id, req.params.meetingId);
    // a file download, so not res.ok
    res.set('Content-Type', 'text/calendar; charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="booklore-meeting.ics"');
    res.send(text);
  }),
);

export default router;
