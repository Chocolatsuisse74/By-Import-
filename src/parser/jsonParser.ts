import { logger } from '../utils/logger.js';

export async function parseJSON(
  fileBuffer: Buffer
): Promise<Record<string, unknown>[]> {
  try {
    const content = fileBuffer.toString('utf-8');
    const data = JSON.parse(content);

    let results: Record<string, unknown>[] = [];

    if (Array.isArray(data)) {
      results = data;
    } else if (typeof data === 'object' && data !== null) {
      results = [data];
    } else {
      throw new Error('Invalid JSON structure');
    }

    logger.info(`Parsed ${results.length} records from JSON`);
    return results;
  } catch (error) {
    logger.error(error, 'Error parsing JSON');
    throw error;
  }
}
