#!/usr/bin/env tsx

/**
 * Secret Validation Script
 * Validates that all required secrets are set before deployment
 * Run this in CI/CD pipeline before building/deploying
 *
 * Usage:
 *   npm run validate-secrets
 *   npx tsx scripts/validate-secrets.ts
 */

import { getConfig, validateRequiredSecrets } from '../src/config/env.js';

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

function validateSecrets(): ValidationResult {
  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: [],
  };

  try {
    const config = getConfig();

    // Check production environment requirements
    if (config.NODE_ENV === 'production') {
      // Critical secrets must exist
      const criticalSecrets: (keyof typeof config)[] = [
        'DATABASE_URL',
        'ANTHROPIC_API_KEY',
      ];

      const allValid = validateRequiredSecrets(criticalSecrets);
      if (!allValid) {
        result.passed = false;
        result.errors.push(
          'Missing critical secrets required for production deployment'
        );
      }

      // Validate URL formats
      try {
        new URL(config.DATABASE_URL);
      } catch {
        result.passed = false;
        result.errors.push(
          'DATABASE_URL is not a valid URL format: ' + config.DATABASE_URL
        );
      }

      // API key format validation
      if (!config.ANTHROPIC_API_KEY.startsWith('sk-')) {
        result.warnings.push(
          'ANTHROPIC_API_KEY does not match expected format (should start with "sk-")'
        );
      }

      // Check for weak passwords in DATABASE_URL
      if (config.DATABASE_URL.includes('password') ||
          config.DATABASE_URL.includes('123456') ||
          config.DATABASE_URL.includes('default')) {
        result.warnings.push(
          'DATABASE_URL appears to contain weak/default credentials'
        );
      }

      // Validate configuration values
      if (config.MAX_FILE_SIZE < 1024 * 1024) {
        // Less than 1MB
        result.warnings.push('MAX_FILE_SIZE is very small (< 1MB)');
      }

      if (config.MAX_FILE_SIZE > 5 * 1024 * 1024 * 1024) {
        // More than 5GB
        result.warnings.push('MAX_FILE_SIZE is very large (> 5GB)');
      }

      if (config.LOG_LEVEL === 'debug' || config.LOG_LEVEL === 'trace') {
        result.warnings.push(
          `LOG_LEVEL is set to '${config.LOG_LEVEL}' in production. This may expose sensitive data.`
        );
      }
    }

    // Development/Test environment checks
    if (
      config.NODE_ENV === 'development' ||
      config.NODE_ENV === 'test'
    ) {
      if (
        config.DATABASE_URL.includes('localhost') ||
        config.DATABASE_URL.includes('127.0.0.1')
      ) {
        console.log('ℹ  Using local database for development');
      }
    }

    // General validation
    if (!config.PORT || config.PORT < 1 || config.PORT > 65535) {
      result.errors.push(`PORT is invalid: ${config.PORT}`);
      result.passed = false;
    }

    if (config.BATCH_SIZE < 1) {
      result.errors.push('BATCH_SIZE must be positive');
      result.passed = false;
    }

    if (config.TIMEOUT_MS < 1000) {
      result.warnings.push('TIMEOUT_MS is less than 1 second. This may be too short.');
    }

    // Check file permissions for upload/temp directories
    if (config.NODE_ENV === 'production') {
      console.log(`\nℹ  Verify directory permissions in production:`);
      console.log(`   UPLOAD_DIR: ${config.UPLOAD_DIR} (should be 700)`);
      console.log(`   TEMP_DIR: ${config.TEMP_DIR} (should be 700)`);
    }
  } catch (error) {
    result.passed = false;
    result.errors.push(
      `Configuration validation failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return result;
}

function printResults(result: ValidationResult): void {
  console.log('\n================== Secret Validation Report ==================\n');

  if (result.errors.length > 0) {
    console.log('❌ ERRORS:');
    result.errors.forEach((error) => {
      console.log(`   - ${error}`);
    });
    console.log();
  }

  if (result.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    result.warnings.forEach((warning) => {
      console.log(`   - ${warning}`);
    });
    console.log();
  }

  if (result.passed && result.errors.length === 0) {
    console.log('✅ All secret validations passed!');
    console.log();
  } else if (!result.passed) {
    console.log('❌ Validation FAILED - deployment should not proceed');
    console.log();
  }

  console.log('===========================================================\n');
}

// Run validation
const result = validateSecrets();
printResults(result);

// Exit with appropriate code
process.exit(result.passed ? 0 : 1);
