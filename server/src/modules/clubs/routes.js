// OWNER: Member 5
// Routes: GET /clubs, GET /clubs/:id, POST /clubs/:id/join, POST /clubs/:id/meetings, POST /clubs/:id/excerpts/:eid/approve
// This router is already mounted at /api in app.js - define FULL paths here, e.g. router.get('/books', ...).
// Pattern: model.js -> service.js (logic) -> controller.js (thin) -> routes.js, tests in *.test.js
import { Router } from 'express';

const router = Router();

export default router;
