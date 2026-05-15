import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitStore {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private ipStore: Map<string, RateLimitStore> = new Map();
  private userStore: Map<string, RateLimitStore> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }) {
    this.windowMs = config.windowMs;
    this.maxRequests = config.maxRequests;

    // Cleanup old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const clientIp = this.getClientIp(req);
      const userId = this.getUserId(req);

      const ipAllowed = this.checkLimit(clientIp, this.ipStore);
      const userAllowed = userId ? this.checkLimit(userId, this.userStore) : true;

      if (!ipAllowed) {
        logger.warn({ ip: clientIp }, 'Rate limit exceeded for IP');
        res.status(429).json({
          error: 'Too many requests',
          retryAfter: this.getRetryAfter(clientIp, this.ipStore),
        });
        return;
      }

      if (!userAllowed) {
        logger.warn({ userId }, 'Rate limit exceeded for user');
        res.status(429).json({
          error: 'Too many requests',
          retryAfter: this.getRetryAfter(userId || '', this.userStore),
        });
        return;
      }

      res.set('RateLimit-Limit', this.maxRequests.toString());
      res.set('RateLimit-Remaining', this.getRemaining(clientIp, this.ipStore).toString());
      res.set('RateLimit-Reset', this.getReset(clientIp, this.ipStore).toString());

      next();
    };
  }

  private checkLimit(key: string, store: Map<string, RateLimitStore>): boolean {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetTime < now) {
      store.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded)) {
      return forwarded[0].trim();
    }
    return req.ip || '';
  }

  private getUserId(req: Request): string | null {
    // Extract user ID from request (e.g., from JWT token, session, etc.)
    const reqWithUser = req as unknown as Record<string, unknown>;
    const userId = (reqWithUser.userId as string | undefined) || (reqWithUser.user as Record<string, unknown> | undefined)?.id;
    return typeof userId === 'string' ? userId : null;
  }

  private getRemaining(key: string, store: Map<string, RateLimitStore>): number {
    const entry = store.get(key);
    if (!entry || entry.resetTime < Date.now()) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  private getReset(key: string, store: Map<string, RateLimitStore>): number {
    const entry = store.get(key);
    if (!entry) {
      return Math.ceil(Date.now() / 1000) + Math.ceil(this.windowMs / 1000);
    }
    return Math.ceil(entry.resetTime / 1000);
  }

  private getRetryAfter(key: string, store: Map<string, RateLimitStore>): number {
    const entry = store.get(key);
    if (!entry) return 0;
    return Math.max(0, Math.ceil((entry.resetTime - Date.now()) / 1000));
  }

  private cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.ipStore.entries()) {
      if (entry.resetTime < now) {
        this.ipStore.delete(key);
      }
    }

    for (const [key, entry] of this.userStore.entries()) {
      if (entry.resetTime < now) {
        this.userStore.delete(key);
      }
    }
  }
}

export function createRateLimiter(config?: RateLimitConfig): RateLimiter {
  return new RateLimiter(config);
}
