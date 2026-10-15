import { Router } from 'express';
import { IdParams } from '@bookstore/shared';
import { SourcePermissionBody } from '@bookstore/shared/schemas/catalogSources';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import * as service from './service.js';

const router = Router();

router.get(
  '/admin/sources',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    res.ok({ items: await service.listSources() });
  }),
);

router.patch(
  '/admin/sources/:id',
  requireAuth,
  requireRole('admin'),
  validate({ params: IdParams, body: SourcePermissionBody }),
  asyncHandler(async (req, res) => {
    res.ok(await service.setPermission(req.user, req.params.id, req.body.permission));
  }),
);

export default router;
