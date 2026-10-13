import { Router } from 'express';
import { IdParams } from '@bookstore/shared';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { listMine, getOne } from './service.js';

const router = Router();

router.get(
  '/conversations/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await listMine(req.user);
    res.ok(result);
  }),
);

router.get(
  '/conversations/:id',
  requireAuth,
  validate({ params: IdParams }),
  asyncHandler(async (req, res) => {
    const result = await getOne(req.user, req.params.id);
    res.ok(result);
  }),
);

export default router;
