import { Router } from 'express';
import { IdParams } from '@bookstore/shared';
import { ListInventoryQuery, AdjustStockBody } from '@bookstore/shared/schemas/inventory';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { listStock, adjustStock } from './service.js';

const router = Router();

router.get(
  '/inventory',
  requireAuth,
  requireRole('bookseller'),
  validate({ query: ListInventoryQuery }),
  asyncHandler(async (req, res) => {
    res.ok(await listStock(req.validatedQuery));
  }),
);

router.patch(
  '/inventory/:id',
  requireAuth,
  requireRole('bookseller'),
  validate({ params: IdParams, body: AdjustStockBody }),
  asyncHandler(async (req, res) => {
    res.ok(await adjustStock(req.user, req.params.id, req.body));
  }),
);

export default router;
