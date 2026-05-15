import { readFileSync } from 'fs';
import { join } from 'path';
import pg from 'pg';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    logger.info('Starting database migration...');

    const schema = readFileSync(join(process.cwd(), 'src/db/schema.sql'), 'utf-8');
    await pool.query(schema);

    logger.info('Database migration completed successfully');
  } catch (error) {
    logger.error(error, 'Migration failed');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
