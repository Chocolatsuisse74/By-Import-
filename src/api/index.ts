import express from 'express';
import importsRouter from './routes/imports.js';
import sourcesRouter from './routes/sources.js';
import webhooksRouter from './routes/webhooks.js';
import { logger } from '../utils/logger.js';
import {
  errorHandler,
  sanitizeInputs,
  requestSizeLimit,
  rateLimitMiddleware,
} from '../middleware/validation.js';
import { getConfig } from '../config/env.js';
import { createCorsManager } from '../middleware/cors.js';
import { getHealthChecker } from '../middleware/healthCheck.js';
import { getMetricsCollector } from '../middleware/metrics.js';

export function createApp(dbPool?: any) {
  const app = express();
  const config = getConfig();

  // Initialize advanced middleware
  const corsManager = createCorsManager();
  const metricsCollector = getMetricsCollector();
  const healthChecker = getHealthChecker(dbPool);

  // CORS Configuration
  app.use(corsManager.middleware());

  // Security Middleware
  app.use(requestSizeLimit(10)); // 10MB max request size
  app.use(rateLimitMiddleware);
  app.use(express.json({ limit: '10mb' }));
  app.use(sanitizeInputs);

  // Metrics Collection
  app.use(metricsCollector.requestMiddleware());

  // Security Headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  // Advanced Health Check
  app.get('/health', healthChecker.middleware());

  // Prometheus Metrics Endpoint
  app.get('/metrics', metricsCollector.exportMetrics());

  // API Routes
  app.use('/api/imports', importsRouter);
  app.use('/api/sources', sourcesRouter);
  app.use('/api/webhooks', webhooksRouter);

  // 404 Handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Global Error Handler (must be last)
  app.use(errorHandler);

  return app;
}

export async function startServer(port: number = 3000) {
  const app = createApp();
  await new Promise<void>((resolve) => {
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      resolve();
    });
  });
}
