import 'dotenv/config';
import { startServer } from './api/index.js';
import { logger } from './utils/logger.js';

const port = parseInt(process.env.PORT || '3000', 10);

async function main() {
  try {
    logger.info(`Starting By-Import on port ${port}...`);
    await startServer(port);
    logger.info('Server started successfully');
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

main();
