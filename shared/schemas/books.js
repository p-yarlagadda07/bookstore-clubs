
import { z } from 'zod';

export const ListBooksQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().optional(),
  theme: z.string().trim().optional(),
  mood: z.string().trim().optional(),
  maxPages: z.coerce.number().int().min(1).optional(),
  // z.coerce.boolean() turns the string 'false' into true, so map it by hand
  available: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export const CreateBookBody = z.object({
  title: z.string().trim().min(1).max(200),
  authors: z.array(z.string().trim().min(1)).min(1),
  synopsis: z.string().trim().max(2000),
  themes: z.array(z.string().trim()).max(10),
  moods: z.array(z.string().trim()).max(10),
  pageCount: z.number().int().min(1).max(5000),
  chapterCount: z.number().int().min(1).max(200).optional(),
});

export const UpdateBookBody = CreateBookBody.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' },
);
