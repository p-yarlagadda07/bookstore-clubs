import { z } from 'zod';

// Reusable building blocks for every module's schemas.
export const ObjectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
export const IdParams = z.object({ id: ObjectId });

export const Pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const ApiError = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});
