import { Router } from 'express';

import { reserve } from './service.js';
import { ReserveBody } from '@bookstore/shared/schemas/reservations';
import { IdParams } from '@bookstore/shared/schemas/common';

import { requireAuth, requireVerified } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';

const router = Router();

router.post(
  '/books/:id/reservations',
  requireAuth,
  requireVerified,
  validate({
    params: IdParams,
    body: ReserveBody,
  }),
  asyncHandler(async (req, res) => {
    const reservation = await reserve(
      req.user,
      req.params.id,
      req.body
    );

    return res.ok(reservation, 201);
  })
);

export default router;