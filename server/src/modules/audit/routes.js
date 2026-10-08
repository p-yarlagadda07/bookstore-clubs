import { Router } from 'express';
import { Pagination } from '@bookstore/shared';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { listAudit } from './service.js';

const router = Router();

router.get(
  '/admin/audit',
  requireAuth,
  requireRole('admin'),
  validate({ query: Pagination }),
  asyncHandler(async (req, res) => {
    res.ok(await listAudit(req.validatedQuery));
  }),
);

export default router;