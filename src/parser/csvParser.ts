import csv from 'csv-parser';
import { Readable } from 'stream';
import { logger } from '../utils/logger.js';

export async function parseCSV(
  fileBuffer: Buffer
): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const results: Record<string, unknown>[] = [];
    const stream = Readable.from([fileBuffer]);
    let isResolved = false;

    const csvStream = stream
      .pipe(csv())
      .on('data', (data: Record<string, unknown>) => {
        results.push(data);
      })
      .on('end', () => {
        if (!isResolved) {
          isResolved = true;
          logger.info(`Parsed ${results.length} records from CSV`);
          resolve(results);
        }
      })
      .on('error', (error: Error) => {
        if (!isResolved) {
          isResolved = true;
          logger.error(error, 'Error parsing CSV');
          csvStream.destroy();
          reject(error);
        }
      });

    stream.on('error', (error: Error) => {
      if (!isResolved) {
        isResolved = true;
        logger.error(error, 'Error reading stream');
        csvStream.destroy();
        reject(error);
      }
    });
  });
}
