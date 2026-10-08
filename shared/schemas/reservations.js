import { z } from 'zod';
import { ObjectId } from './common.js';

export const ReserveBody = z.object({
  condition: z.enum(['new', 'used']),
  pickupWindowId: ObjectId,
});