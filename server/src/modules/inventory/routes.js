import { Router } from 'express';
import { IdParams } from '@bookstore/shared';
import {
ListInventoryQuery,
AdjustStockBody,
} from '@bookstore/shared/schemas/inventory';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { AppError } from '../../lib/AppError.js';
import Inventory from './model.js';
import Book from '../books/model.js';
import { logAudit } from '../audit/service.js';

const router = Router();

router.get(
'/inventory',
requireAuth,
requireRole('bookseller'),
validate({ query: ListInventoryQuery }),
asyncHandler(async (req, res) => {
const { q, page, limit } = req.validatedQuery;
const filter = {};

```
if (q?.trim()) {
  const books = await Book.find({
    title: { $regex: q.trim(), $options: 'i' },
  }).select('_id');

  filter.bookId = { $in: books.map((book) => book._id) };
}

const [rows, total] = await Promise.all([
  Inventory.find(filter)
    .populate('bookId', 'title authors')
    .sort({ _id: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean(),
  Inventory.countDocuments(filter),
]);

const items = rows.map((row) => ({
  id: String(row._id),
  bookId: String(row.bookId?._id ?? row.bookId),
  title: row.bookId?.title ?? '',
  authors: row.bookId?.authors ?? [],
  condition: row.condition,
  total: row.total,
  available: row.available,
  held: row.held,
  status: row.status,
}));

res.ok({ items, page, limit, total });
```

}),
);

router.patch(
'/inventory/:id',
requireAuth,
requireRole('bookseller'),
validate({ params: IdParams, body: AdjustStockBody }),
asyncHandler(async (req, res) => {
const { delta, status, reason } = req.validatedBody;

```
const inventory = await Inventory.findById(req.validatedParams.id);

if (!inventory) {
  throw new AppError('NOT_FOUND', 404, 'Inventory item not found');
}

const before = {
  total: inventory.total,
  available: inventory.available,
  held: inventory.held,
  status: inventory.status,
};

if (delta !== undefined) {
  const nextTotal = inventory.total + delta;

  if (nextTotal < inventory.held) {
    throw new AppError(
      'BAD_REQUEST',
      400,
      "Total can't be lower than copies on hold",
    );
  }

  if (nextTotal < 0) {
    throw new AppError('BAD_REQUEST', 400, 'Total cannot be negative');
  }

  inventory.total = nextTotal;
  inventory.available = nextTotal - inventory.held;
}

if (status !== undefined) {
  inventory.status = status;
}

await inventory.save();

const updated = {
  id: String(inventory._id),
  bookId: String(inventory.bookId),
  condition: inventory.condition,
  total: inventory.total,
  available: inventory.available,
  held: inventory.held,
  status: inventory.status,
  pickupWindows: inventory.pickupWindows,
};

await logAudit(
  req.user,
  'stock.adjust',
  { type: 'inventory', id: inventory._id },
  { before, after: updated, reason },
);

res.ok(updated);
```

}),
);

export default router;
