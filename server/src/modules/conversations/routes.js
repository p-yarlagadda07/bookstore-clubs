import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { AppError } from '../../lib/AppError.js';
import { listMine, getOne } from './service.js';

const router = Router();

router.get(
  '/conversations/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await listMine(req.user);
    res.ok(result);
  }),
);

router.get(
  '/conversations/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      throw new AppError('NOT_FOUND', 404, 'Conversation not found');
    }

    const result = await getOne(req.user, req.params.id);
    res.ok(result);
  }),
);

export default router;
