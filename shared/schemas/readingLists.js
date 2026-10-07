import { z } from 'zod';
import { ObjectId } from './common.js';

export const CreateListBody = z.object({
  name: z.string().trim().min(1).max(80),
});

export const UpdateListBody = z.object({
  name: z.string().min(1).max(80).optional(),
  visibility: z.enum(['private', 'public']).optional(),
});

export const AddItemBody = z.object({
  bookId: ObjectId,
  note: z.string().max(300).optional(),
});
