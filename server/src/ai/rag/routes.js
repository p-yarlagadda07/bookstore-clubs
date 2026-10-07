import { Router } from 'express';
import { BookChatBody } from '@bookstore/shared/schemas/bookChat';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { bookChat } from './bookChat.js';

const router = Router();

router.post(
  '/book-chat',
  requireAuth,
  validate({ body: BookChatBody }),
  asyncHandler(async (req, res) => {
    const result = await bookChat(req.user, req.body);
    res.ok(result);
  }),
);

export default router;
