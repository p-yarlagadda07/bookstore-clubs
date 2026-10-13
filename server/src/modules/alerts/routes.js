import { IdParams } from '@bookstore/shared';
import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth, requireVerified } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as service from './service.js';

const router = Router();

router.post(
  '/books/:id/alerts',
  requireAuth,
  requireVerified,
  validate({ params: IdParams }),
  asyncHandler(async (req, res) => {
    const result = await service.createAlert(req.user, req.params.id);
    res.ok(result.alert, result.created ? 201 : 200);
  }),
);

router.get(
  '/alerts/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.ok(await service.listMine(req.user));
  }),
);

router.delete(
  '/alerts/:id',
  requireAuth,
  validate({ params: IdParams }),
  asyncHandler(async (req, res) => {
    res.ok(await service.deleteAlert(req.user, req.params.id));
  }),
);

export default router;
