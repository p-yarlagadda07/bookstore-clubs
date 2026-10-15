import { z } from 'zod';

export const SourcePermissionBody = z.object({
  permission: z.enum(['approved', 'pending', 'revoked']),
});
