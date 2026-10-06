// OWNER: Member 2
// Routes: POST /auth/signup, GET /auth/verify, POST /auth/login, POST /auth/logout, POST /auth/forgot, POST /auth/reset, GET /auth/me, GET /auth/csrf
// This router is already mounted at /api in app.js - define FULL paths here, e.g. router.get('/books', ...).
// Pattern: model.js -> service.js (logic) -> controller.js (thin) -> routes.js, tests in *.test.js
import { Router } from 'express';

const router = Router();

export default router;
