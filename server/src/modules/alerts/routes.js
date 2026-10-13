import { Router } from 'express';
import { requireAuth, requireVerified } from '../../middleware/auth.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import * as service from './service.js';

const router = Router();

router.post(
  '/books/:id/alerts',
  requireAuth,
  requireVerified,
  asyncHandler(async (req, res) => {
    const result = await service.createAlert(req.user, req.params.id);
    res.status(result.created ? 201 : 200).json(result.alert);
  }),
);

router.get(
  '/alerts/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await service.listMine(req.user));
  }),
);

router.delete(
  '/alerts/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await service.deleteAlert(req.user, req.params.id));
  }),
);

export default router;
