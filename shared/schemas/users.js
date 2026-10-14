import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const UsersQuery = z.object({
  q: z.string().trim().max(100).optional(),
});

// admin is not in the list, so it can't be given or taken here
export const StaffRoleBody = z
  .object({
    action: z.enum(['grant', 'revoke']),
    role: z.enum(['bookseller', 'moderator']),
    clubId: objectId.optional(),
  })
  .refine((b) => b.role !== 'moderator' || b.clubId, {
    message: 'clubId is required for moderator',
    path: ['clubId'],
  });
