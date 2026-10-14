import { z } from 'zod';

export const PreferencesBody = z
  .object({
    genres: z.array(z.string()).max(10).optional(),
    moods: z.array(z.string()).max(10).optional(),
    maxPages: z.number().int().min(50).max(2000).nullable().optional(),
    spoilerStrict: z.boolean().optional(),
    bookmarkVisibility: z.enum(['private', 'club', 'public']).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: 'At least one preference field is required',
  });
