import { Router } from 'express';
import { generateToken } from '../../middleware/security.js';

const router = Router();

router.get('/auth/csrf', (req, res) => {
  res.ok({ token: generateToken(req, res) });
});

export default router;