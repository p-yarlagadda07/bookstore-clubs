import { Router } from 'express';
import { requireAuth, requireVerified } from '../../middleware/auth.js';
import {
  listClubs,
  getClub,
  joinClubController,
} from './controller.js';

const router = Router();

router.get('/clubs', listClubs);

router.get('/clubs/:id', getClub);

router.post(
  '/clubs/:id/join',
  requireAuth,
  requireVerified,
  joinClubController
);

export default router;