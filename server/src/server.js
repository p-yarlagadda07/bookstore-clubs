import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';

async function main() {
  await connectDB();
  // Member 4: start the hold-expiry job here, e.g. startExpireHoldsJob();
  createApp().listen(env.PORT, () =>
    logger.info(`API running on http://localhost:${env.PORT}/api`),
  );
}

main().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});
