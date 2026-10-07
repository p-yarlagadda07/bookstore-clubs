import { z } from 'zod';

export const BookChatBody = z.object({
  message: z.string().min(1).max(1000),
  bookId: z.string().optional(),
  clubId: z.string().optional(),
  conversationId: z.string().optional(),
});