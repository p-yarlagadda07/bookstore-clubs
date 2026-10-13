import { Router } from 'express';

import {
  reserve,
  getMyReservations,
  cancelReservation,
  collectReservation,
  getHeldReservations,
} from './service.js';

import { ReserveBody } from '@bookstore/shared/schemas/reservations';
import { IdParams } from '@bookstore/shared/schemas/common';

import { requireAuth, requireVerified, requireRole } from '../../middleware/auth.js';

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
    const reservation = await reserve(req.user, req.params.id, req.body);
    return res.ok(reservation, 201);
  }),
);

router.get(
  '/reservations/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    const reservations = await getMyReservations(req.user);
    return res.ok(reservations);
  }),
);
router.get(
  '/reservations/held',
  requireAuth,
  requireRole('bookseller'),
  asyncHandler(async (_req, res) => {
    return res.ok(await getHeldReservations());
  }),
);
router.delete(
  '/reservations/:id',
  requireAuth,
  validate({ params: IdParams }),
  asyncHandler(async (req, res) => {
    const reservation = await cancelReservation(req.user, req.params.id);
    return res.ok(reservation);
  }),
);

router.patch(
  '/reservations/:id/collect',
  requireAuth,
  requireRole('bookseller'),
  validate({ params: IdParams }),
  asyncHandler(async (req, res) => {
    const reservation = await collectReservation(req.user, req.params.id);
    return res.ok(reservation);
  }),
);

export default router;
