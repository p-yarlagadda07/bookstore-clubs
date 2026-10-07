import { z } from 'zod';

export const ListBooksQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().optional(),
  theme: z.string().trim().optional(),
  mood: z.string().trim().optional(),
  maxPages: z.coerce.number().int().min(1).optional(),
  available: z.coerce.boolean().optional()
});