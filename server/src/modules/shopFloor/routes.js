import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { getShopFloor } from './service.js';

const router = Router();

router.get(
  '/staff/shop-floor',
  requireAuth,
  requireRole('bookseller'),
  asyncHandler(async (_req, res) => {
    const data = await getShopFloor();
    res.ok(data);
  }),
);

export default router;
