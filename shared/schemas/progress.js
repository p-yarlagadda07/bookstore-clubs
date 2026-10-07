import { z } from 'zod';
import { ObjectId } from './common.js';

export const SetProgressBody = z.object({
  bookId: ObjectId,
  clubId: ObjectId.optional(),
  chapter: z.number().int().min(0),
  page: z.number().int().min(0).optional(),
  visibility: z.enum(['private', 'club']).optional(),
});

export const BookIdParams = z.object({
  bookId: ObjectId,
});