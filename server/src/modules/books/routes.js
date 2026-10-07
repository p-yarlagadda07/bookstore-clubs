import { Router } from 'express';
import { IdParams } from '@bookstore/shared';
import { ListBooksQuery } from '@bookstore/shared/schemas/books';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import * as controller from './controller.js';

const router = Router();

router.get('/books', validate({ query: ListBooksQuery }), asyncHandler(controller.list));
router.get('/books/:id', validate({ params: IdParams }), asyncHandler(controller.get));

export default router;
