import { Request, Response } from 'express';
import { Pool } from 'pg';
import { logger } from '../utils/logger.js';

export interface ServiceStatus {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  error?: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  services: ServiceStatus[];
}

export class HealthChecker {
  private dbPool: Pool | null = null;
  private serviceChecks: Map<string, () => Promise<ServiceStatus>> = new Map();

  constructor(dbPool?: Pool) {
    this.dbPool = dbPool || null;
    this.registerDefaultChecks();
  }

  private registerDefaultChecks(): void {
    // Database health check
    if (this.dbPool) {
      const dbPool = this.dbPool;
      this.registerCheck('database', async () => {
        const startTime = Date.now();
        try {
          const client = await dbPool.connect();
          await client.query('SELECT 1');
          client.release();

          return {
            name: 'database',
            status: 'healthy',
            responseTime: Date.now() - startTime,
          };
        } catch (error) {
          const responseTime = Date.now() - startTime;
          logger.error({ error }, 'Database health check failed');
          return {
            name: 'database',
            status: 'unhealthy',
            responseTime,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      });
    }

    // Memory health check
    this.registerCheck('memory', async () => {
      const startTime = Date.now();
      const memUsage = process.memoryUsage();
      const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

      let status: 'healthy' | 'degraded' = 'healthy';
      if (heapUsedPercent > 90) {
        status = 'degraded';
      }

      return {
        name: 'memory',
        status,
        responseTime: Date.now() - startTime,
      };
    });
  }

  registerCheck(
    name: string,
    checkFn: () => Promise<ServiceStatus>
  ): void {
    this.serviceChecks.set(name, checkFn);
    logger.debug({ name }, 'Health check registered');
  }

  async getHealthStatus(): Promise<HealthCheckResponse> {
    const startTime = Date.now();
    const serviceStatuses: ServiceStatus[] = [];

    // Run all health checks in parallel
    const checkPromises = Array.from(this.serviceChecks.values()).map((checkFn) =>
      checkFn().catch((err) => ({
        name: 'unknown',
        status: 'unhealthy' as const,
        responseTime: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err),
      }))
    );

    const results = await Promise.all(checkPromises);
    serviceStatuses.push(...results);

    // Determine overall status
    const overallStatus =
      serviceStatuses.every((s) => s.status === 'healthy') &&
      serviceStatuses.length > 0
        ? 'healthy'
        : serviceStatuses.some((s) => s.status === 'unhealthy')
          ? 'unhealthy'
          : 'degraded';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: serviceStatuses,
    };
  }

  middleware() {
    return async (_req: Request, res: Response) => {
      const health = await this.getHealthStatus();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    };
  }
}

let healthChecker: HealthChecker | null = null;

export function getHealthChecker(dbPool?: Pool): HealthChecker {
  if (!healthChecker) {
    healthChecker = new HealthChecker(dbPool);
  }
  return healthChecker;
}
