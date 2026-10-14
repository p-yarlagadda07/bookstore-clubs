import { Router } from 'express';
import mongoose from 'mongoose';

import auth from './modules/auth/routes.js';
import users from './modules/users/routes.js';
import audit from './modules/audit/routes.js';
import books from './modules/books/routes.js';
import inventory from './modules/inventory/routes.js';
import catalogSources from './modules/catalogSources/routes.js';
import reservations from './modules/reservations/routes.js';
import readingLists from './modules/readingLists/routes.js';
import clubs from './modules/clubs/routes.js';
import progress from './modules/progress/routes.js';
import conversations from './modules/conversations/routes.js';
import discovery from './ai/discovery/routes.js';
import rag from './ai/rag/routes.js';
import agent from './ai/agent/routes.js';
import alerts from './modules/alerts/routes.js';
import calendar from './modules/calendar/routes.js';
import shopFloor from './modules/shopFloor/routes.js';
import talkingPoints from './ai/talkingPoints/routes.js';
import preferences from './modules/preferences/routes.js';

const api = Router();

api.get('/health', (_req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.ok({ status: 'ok', db: states[mongoose.connection.readyState] ?? 'unknown' });
});

// discovery has to come before books, otherwise /books/discover matches /books/:id
for (const r of [
  auth,
  users,
  audit,
  discovery,
  books,
  inventory,
  catalogSources,
  reservations,
  readingLists,
  clubs,
  progress,
  conversations,
  rag,
  agent,
  alerts,
  calendar,
  shopFloor,
  talkingPoints,
  preferences,
]) {
  api.use(r);
}

export default api;
