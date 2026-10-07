import { Router } from 'express';
import { z } from 'zod';
import { IdParams, ObjectId } from '@bookstore/shared';
import {
  CreateListBody,
  UpdateListBody,
  AddItemBody,
} from '@bookstore/shared/schemas/readingLists';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import * as controller from './controller.js';

const ItemParams = z.object({ id: ObjectId, bookId: ObjectId });

const router = Router();

router.get('/reading-lists', requireAuth, asyncHandler(controller.list));
router.post(
  '/reading-lists',
  requireAuth,
  validate({ body: CreateListBody }),
  asyncHandler(controller.create),
);
router.get(
  '/reading-lists/:id',
  requireAuth,
  validate({ params: IdParams }),
  asyncHandler(controller.get),
);
router.patch(
  '/reading-lists/:id',
  requireAuth,
  validate({ params: IdParams, body: UpdateListBody }),
  asyncHandler(controller.update),
);
router.delete(
  '/reading-lists/:id',
  requireAuth,
  validate({ params: IdParams }),
  asyncHandler(controller.removeList),
);
router.post(
  '/reading-lists/:id/items',
  requireAuth,
  validate({ params: IdParams, body: AddItemBody }),
  asyncHandler(controller.add),
);
router.delete(
  '/reading-lists/:id/items/:bookId',
  requireAuth,
  validate({ params: ItemParams }),
  asyncHandler(controller.remove),
);

export default router;
