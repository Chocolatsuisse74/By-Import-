import { Workbook } from 'exceljs';
import { logger } from '../utils/logger.js';

export async function parseExcel(
  fileBuffer: Buffer
): Promise<Record<string, unknown>[]> {
  try {
    const workbook = new Workbook();
    await workbook.xlsx.load(fileBuffer as any);

    const results: Record<string, unknown>[] = [];
    const worksheet = workbook.worksheets[0];

    if (!worksheet || !worksheet.rowCount) {
      logger.warn('No data found in Excel sheet');
      return [];
    }

    const headers = worksheet
      .getRow(1)
      .values as unknown as (string | null | undefined)[];

    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i).values as unknown[];
      const record: Record<string, unknown> = {};

      headers.forEach((header, index) => {
        if (header) {
          record[header] = row[index] ?? null;
        }
      });

      results.push(record);
    }

    logger.info(`Parsed ${results.length} records from Excel`);
    return results;
  } catch (error) {
    logger.error(error, 'Error parsing Excel');
    throw error;
  }
}
