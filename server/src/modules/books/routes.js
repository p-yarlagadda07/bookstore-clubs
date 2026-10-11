import { Router } from 'express';
import { IdParams } from '@bookstore/shared';
import { ListBooksQuery, CreateBookBody, UpdateBookBody } from '@bookstore/shared/schemas/books';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import * as controller from './controller.js';

const router = Router();

router.get('/books', validate({ query: ListBooksQuery }), asyncHandler(controller.list));
router.get('/books/:id', validate({ params: IdParams }), asyncHandler(controller.get));

router.post(
  '/books',
  requireAuth,
  requireRole('bookseller'),
  validate({ body: CreateBookBody }),
  asyncHandler(controller.create),
);

router.patch(
  '/books/:id',
  requireAuth,
  requireRole('bookseller'),
  validate({ params: IdParams, body: UpdateBookBody }),
  asyncHandler(controller.update),
);

export default router;
