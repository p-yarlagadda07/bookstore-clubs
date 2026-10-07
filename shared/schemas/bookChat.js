import { z } from 'zod';
import { ObjectId } from './common.js';

export const BookChatBody = z.object({
  message: z.string().trim().min(1).max(1000),
  bookId: ObjectId.optional(),
  clubId: ObjectId.optional(),
  conversationId: ObjectId.optional(),
});
