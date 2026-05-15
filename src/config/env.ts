import { z } from 'zod';
import { logger } from '../utils/logger.js';

/**
 * Environment variables schema with strict validation
 * Fails fast if required variables are missing
 */
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // Database Configuration
  DATABASE_URL: z.string().url().describe('PostgreSQL connection URL'),
  DATABASE_POOL_SIZE: z.coerce.number().int().positive().default(20),

  // File Upload Configuration
  MAX_FILE_SIZE: z.coerce
    .number()
    .int()
    .positive()
    .default(104857600), // 100MB
  UPLOAD_DIR: z.string().default('./uploads'),
  TEMP_DIR: z.string().default('./temp'),

  // Processing Configuration
  BATCH_SIZE: z.coerce.number().int().positive().default(1000),
  MAX_RETRIES: z.coerce.number().int().nonnegative().default(3),
  TIMEOUT_MS: z.coerce.number().int().positive().default(300000),

  // AI Configuration
  ANTHROPIC_API_KEY: z
    .string()
    .min(1)
    .describe('Anthropic API key for AI features'),
  ENABLE_AI_VALIDATION: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .default('true'),
  ENABLE_AI_TRANSFORMATION: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .default('true'),

  // Logging
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),

  // Feature Flags
  ENABLE_WEBHOOKS: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .default('true'),
  ENABLE_SCHEDULING: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .default('true'),
});

export type EnvConfig = z.infer<typeof envSchema>;

let cachedConfig: EnvConfig | null = null;

/**
 * Validate and return environment configuration
 * Throws error if validation fails
 */
export function getConfig(): EnvConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    cachedConfig = envSchema.parse(process.env);
    logger.info('Environment variables validated successfully');
    return cachedConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('\n');

      logger.error(
        `Environment validation failed:\n${missingVars}`,
        'Invalid environment configuration'
      );
      console.error(`\n❌ Configuration Error:\n${missingVars}\n`);
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Validate specific environment variables
 * Returns true if all specified vars are valid
 */
export function validateRequiredSecrets(
  secrets: (keyof EnvConfig)[]
): boolean {
  const config = getConfig();
  const missing: string[] = [];

  for (const secret of secrets) {
    const value = config[secret];
    if (!value || value === '') {
      missing.push(secret);
    }
  }

  if (missing.length > 0) {
    logger.error(
      { missing },
      'Required secrets are missing from environment'
    );
    return false;
  }

  return true;
}
