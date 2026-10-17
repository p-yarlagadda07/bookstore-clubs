import { Router } from 'express';
import { IdParams, ObjectId } from '@bookstore/shared';
import {
  ListInventoryQuery,
  AdjustStockBody,
  BookStockBody,
  PickupWindowBody,
} from '@bookstore/shared/schemas/inventory';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import {
  listStock,
  adjustStock,
  adjustBookStock,
  addPickupWindow,
  removePickupWindow,
} from './service.js';

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

router.patch(
  '/books/:id/stock',
  requireAuth,
  requireRole('bookseller'),
  validate({ params: IdParams, body: BookStockBody }),
  asyncHandler(async (req, res) => {
    const { condition, ...change } = req.body;
    res.ok(await adjustBookStock(req.user, req.params.id, condition, change));
  }),
);

router.post(
  '/inventory/:id/pickup-windows',
  requireAuth,
  requireRole('bookseller'),
  validate({ params: IdParams, body: PickupWindowBody }),
  asyncHandler(async (req, res) => {
    res.ok(await addPickupWindow(req.user, req.params.id, req.body), 201);
  }),
);

router.delete(
  '/inventory/:id/pickup-windows/:pickupWindowId',
  requireAuth,
  requireRole('bookseller'),
  validate({
    params: IdParams.extend({
      pickupWindowId: ObjectId,
    }),
  }),
  asyncHandler(async (req, res) => {
    res.ok(await removePickupWindow(req.user, req.params.id, req.params.pickupWindowId));
  }),
);

export default router;
