import { z } from 'zod';
import { ObjectId } from './common.js';

export const TalkingPointsBody = z.object({
  meetingId: ObjectId.optional(),
});