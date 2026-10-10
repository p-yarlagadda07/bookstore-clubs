import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { startExpireJob } from './jobs/expireHolds.js';

async function main() {
  await connectDB();
  createApp().listen(env.PORT, () =>
    logger.info(`API running on http://localhost:${env.PORT}/api`),
  );
  startExpireJob();
}

main().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});
