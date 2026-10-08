import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { randomUUID } from 'node:crypto';

import { logger } from './lib/logger.js';
import { responseHelpers } from './middleware/response.js';
import { applySecurity } from './middleware/security.js';
import { notFound, errorHandler } from './middleware/error.js';
import api from './routes.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(pinoHttp({ logger, genReqId: (req) => req.headers['x-request-id'] ?? randomUUID() }));
  app.use(express.json({ limit: '1mb' }));
  app.use(responseHelpers);

  applySecurity(app);

  app.use('/api', api);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
