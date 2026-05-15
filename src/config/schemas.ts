import { z } from 'zod';

/**
 * Reusable validation schemas for API requests
 * Ensures type safety and input sanitization across all endpoints
 */

// Import Job Schemas
export const createImportJobSchema = z.object({
  sourceId: z.string().uuid('Invalid sourceId format'),
  fileName: z
    .string()
    .min(1, 'fileName is required')
    .max(255, 'fileName is too long')
    .regex(
      /^[a-zA-Z0-9._\-()[\] ]+$/,
      'fileName contains invalid characters'
    ),
  fileType: z
    .enum(['csv', 'excel', 'json', 'xml'])
    .describe('Supported file formats'),
  totalRecords: z.coerce.number().int().nonnegative().optional().default(0),
});

export const updateImportJobSchema = z.object({
  status: z
    .enum(['pending', 'processing', 'completed', 'failed'])
    .optional(),
  processedRecords: z.coerce.number().int().nonnegative().optional(),
  failedRecords: z.coerce.number().int().nonnegative().optional(),
  errorMessage: z.string().max(1000).optional(),
  completedAt: z.coerce.date().optional(),
});

export const importJobParamSchema = z.object({
  id: z.string().uuid('Invalid job ID format'),
});

// Data Source Schemas
export const createDataSourceSchema = z.object({
  name: z
    .string()
    .min(1, 'name is required')
    .max(255, 'name is too long')
    .regex(
      /^[a-zA-Z0-9._\-()[\] ]+$/,
      'name contains invalid characters'
    ),
  type: z
    .enum(['csv', 'database', 'api', 'excel'])
    .describe('Data source type'),
  configuration: z
    .record(z.unknown())
    .optional()
    .default({})
    .refine(
      (config) => Object.keys(config).length <= 50,
      'configuration has too many properties'
    ),
});

export const updateDataSourceSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-zA-Z0-9._\-()[\] ]+$/)
    .optional(),
  type: z.enum(['csv', 'database', 'api', 'excel']).optional(),
  configuration: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

export const dataSourceParamSchema = z.object({
  id: z.string().uuid('Invalid source ID format'),
});

// Type exports for runtime validation
export type CreateImportJobRequest = z.infer<typeof createImportJobSchema>;
export type UpdateImportJobRequest = z.infer<typeof updateImportJobSchema>;
export type ImportJobParams = z.infer<typeof importJobParamSchema>;

export type CreateDataSourceRequest = z.infer<typeof createDataSourceSchema>;
export type UpdateDataSourceRequest = z.infer<typeof updateDataSourceSchema>;
export type DataSourceParams = z.infer<typeof dataSourceParamSchema>;
