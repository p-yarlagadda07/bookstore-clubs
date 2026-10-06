// OWNER: Member 2
// Routes: GET/PATCH /users/me, PATCH /users/:id/staff-role
// This router is already mounted at /api in app.js - define FULL paths here, e.g. router.get('/books', ...).
// Pattern: model.js -> service.js (logic) -> controller.js (thin) -> routes.js, tests in *.test.js
import { Router } from 'express';

const router = Router();

export default router;
