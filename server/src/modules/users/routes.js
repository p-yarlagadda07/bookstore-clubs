import { Router } from 'express';
import { IdParams } from '@bookstore/shared';
import { StaffRoleBody, UsersQuery } from '@bookstore/shared/schemas/users';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { listUsers, changeStaffRole } from './service.js';

const router = Router();

router.get(
  '/admin/users',
  requireAuth,
  requireRole('admin'),
  validate({ query: UsersQuery }),
  asyncHandler(async (req, res) => {
    res.ok(await listUsers(req.validatedQuery));
  }),
);

router.patch(
  '/users/:id/staff-role',
  requireAuth,
  requireRole('admin'),
  validate({ params: IdParams, body: StaffRoleBody }),
  asyncHandler(async (req, res) => {
    res.ok(await changeStaffRole(req.user, req.params.id, req.body));
  }),
);

export default router;
