import { z } from 'zod';
import { IdParams } from './common.js';

export { IdParams };

export const CreateMeetingBody = z.object({
  date: z.coerce.date(),
  time: z.string().optional(),
  location: z.string().optional(),
  bookId: z.string().optional(),
  agenda: z.string().optional(),
  chapterRange: z
    .object({
      from: z.number().optional(),
      to: z.number().optional(),
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