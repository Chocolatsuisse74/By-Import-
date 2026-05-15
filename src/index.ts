import 'dotenv/config';
import { startServer } from './api/index.js';
import { logger } from './utils/logger.js';
import { getConfig, validateRequiredSecrets } from './config/env.js';

async function main() {
  try {
    // Validate environment variables at startup
    const config = getConfig();

    // Validate critical secrets
    const hasRequiredSecrets = validateRequiredSecrets([
      'DATABASE_URL',
      'ANTHROPIC_API_KEY',
    ]);

    if (!hasRequiredSecrets) {
      logger.fatal('Critical secrets are missing. Cannot start server.');
      process.exit(1);
    }

    logger.info(
      { env: config.NODE_ENV, port: config.PORT },
      'Starting By-Import'
    );
    await startServer(config.PORT);
    logger.info('Server started successfully');
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

main();
