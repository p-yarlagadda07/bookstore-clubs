import { z } from 'zod';

export const ListInventoryQuery = z.object({
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const AdjustStockBody = z
  .object({
    delta: z
      .number()
      .int()
      .refine((v) => v !== 0, { message: 'delta must not be zero' })
      .optional(),
    status: z.enum(['active', 'unavailable']).optional(),
    reason: z.string().trim().min(3).max(200),
  })
  .refine((v) => v.delta !== undefined || v.status !== undefined, {
    message: 'Send delta or status',
  });
export const PickupWindowBody = z
  .object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  })
  .refine((value) => new Date(value.end) > new Date(value.start), {
    message: 'End must be after start',
    path: ['end'],
  })
  .refine((value) => new Date(value.start) > new Date(), {
    message: 'Start must be in the future',
    path: ['start'],
  });
