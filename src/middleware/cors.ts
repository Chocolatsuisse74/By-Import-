import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number;
  credentials: boolean;
}

const DEFAULT_CORS_CONFIG: CorsConfig = {
  allowedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Webhook-ID', 'X-Webhook-Event'],
  exposedHeaders: ['Content-Type', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge: 86400, // 24 hours
  credentials: true,
};

export class CorsManager {
  private config: CorsConfig;

  constructor(config: Partial<CorsConfig> = {}) {
    this.config = { ...DEFAULT_CORS_CONFIG, ...config };

    // Add environment-based origins if provided
    if (process.env.CORS_ORIGINS) {
      const envOrigins = process.env.CORS_ORIGINS.split(',').map((o) => o.trim());
      this.config.allowedOrigins = [
        ...new Set([...this.config.allowedOrigins, ...envOrigins]),
      ];
    }

    logger.debug({ origins: this.config.allowedOrigins }, 'CORS configured');
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const origin = req.headers.origin as string | undefined;

      if (!origin) {
        return next();
      }

      if (this.isOriginAllowed(origin)) {
        res.set('Access-Control-Allow-Origin', origin);
        res.set('Access-Control-Allow-Credentials', String(this.config.credentials));
        res.set('Access-Control-Allow-Methods', this.config.allowedMethods.join(', '));
        res.set('Access-Control-Allow-Headers', this.config.allowedHeaders.join(', '));
        res.set('Access-Control-Expose-Headers', this.config.exposedHeaders.join(', '));
        res.set('Access-Control-Max-Age', String(this.config.maxAge));

        if (req.method === 'OPTIONS') {
          return res.status(204).end();
        }
      } else {
        logger.warn({ origin }, 'CORS origin not allowed');
      }

      next();
    };
  }

  private isOriginAllowed(origin: string): boolean {
    return this.config.allowedOrigins.some((allowedOrigin) => {
      if (allowedOrigin === '*') {
        return true;
      }

      // Support wildcard subdomains
      if (allowedOrigin.startsWith('*.')) {
        const domain = allowedOrigin.slice(2);
        return origin.endsWith(domain) || origin === `https://${domain}` || origin === `http://${domain}`;
      }

      return origin === allowedOrigin;
    });
  }

  addOrigin(origin: string): void {
    if (!this.config.allowedOrigins.includes(origin)) {
      this.config.allowedOrigins.push(origin);
      logger.debug({ origin }, 'CORS origin added');
    }
  }

  removeOrigin(origin: string): void {
    const index = this.config.allowedOrigins.indexOf(origin);
    if (index > -1) {
      this.config.allowedOrigins.splice(index, 1);
      logger.debug({ origin }, 'CORS origin removed');
    }
  }

  getConfig(): CorsConfig {
    return { ...this.config };
  }
}

export function createCorsManager(config?: Partial<CorsConfig>): CorsManager {
  return new CorsManager(config);
}
