import { z } from 'zod';

export const ListInventoryQuery = z.object({
q: z.string().trim().optional(),
page: z.coerce.number().int().min(1).default(1),
limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const AdjustStockBody = z
.object({
delta: z.number().int().refine((value) => value !== 0, {
message: 'delta must not be zero',
}).optional(),
status: z.enum(['active', 'unavailable']).optional(),
reason: z.string().trim().min(3).max(200),
})
.refine(
(value) => value.delta !== undefined || value.status !== undefined,
{ message: 'Provide delta or status' },
);
