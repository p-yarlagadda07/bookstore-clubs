import { z } from 'zod';
import { IdParams } from './common.js';

export { IdParams };

export const CreateMeetingBody = z.object({
  date: z.coerce.date(),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:MM format'),
  location: z.string().min(1).max(120),
  agenda: z.string().max(500).default(''),
  bookId: z.string().optional(),
  chapterRange: z
    .object({
      from: z.number().int().min(1),
      to: z.number().int(),
    })
    .refine((range) => range.to >= range.from, {
      message: 'Chapter end must be greater than or equal to chapter start',
    })
    .optional(),
});

export const UpdateClubBody = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  published: z.boolean().optional(),
  rules: z.array(z.string()).optional(),
  currentBookId: z.string().optional(),
  readingPace: z
    .object({
      pagesPerWeek: z.number().optional(),
    })
    .optional(),
});