import { z } from 'zod';

export const DiscoverQuery = z.object({
  q: z.string().trim().min(3).max(300),
  limit: z.coerce.number().int().min(1).max(10).default(5),
});
