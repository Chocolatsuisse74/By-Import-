import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../utils/logger.js';
import { getConfig } from '../config/env.js';

/**
 * Generic request validation middleware
 * Validates request body, params, or query against Zod schemas
 */
export function validateRequest(
  schema: ZodSchema,
  dataType: 'body' | 'params' | 'query' = 'body'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[dataType];
      const validated = schema.parse(data);

      // Replace with validated data to prevent injection
      req[dataType] = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const config = getConfig();
        const errors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        // Log full details server-side
        logger.warn(
          { errors, path: req.path, method: req.method },
          'Validation error'
        );

        // Return generic message in production
        const message =
          config.NODE_ENV === 'production'
            ? 'Invalid request data'
            : errors;

        res.status(400).json({
          error: 'Validation failed',
          message,
          ...(config.NODE_ENV !== 'production' && {
            details: errors,
          }),
        });
        return;
      }

      next(error);
    }
  };
}

/**
 * Error handling middleware
 * Sanitizes error responses based on environment
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const config = getConfig();

  // Log full error server-side
  if (err instanceof Error) {
    logger.error(
      {
        message: err.message,
        stack: err.stack,
        name: err.name,
      },
      'Unhandled error'
    );
  } else {
    logger.error(err, 'Unhandled error (non-Error object)');
  }

  // Send safe response to client
  if (config.NODE_ENV === 'production') {
    res.status(500).json({
      error: 'Internal server error',
      // Do not expose any details in production
    });
  } else {
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : String(err),
      ...(config.NODE_ENV === 'development' && {
        stack: err instanceof Error ? err.stack : undefined,
      }),
    });
  }
}

/**
 * Input sanitization middleware
 * Removes potentially dangerous characters from inputs
 */
export function sanitizeInputs(req: Request, _res: Response, next: NextFunction) {
  const sanitize = (obj: unknown): unknown => {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      // Remove null bytes and control characters
      return obj
        .split('')
        .filter((char) => {
          const code = char.charCodeAt(0);
          return code !== 0 && code >= 32 && code !== 127;
        })
        .join('')
        .trim();
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    if (typeof obj === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize keys and values
        const sanitizedKey = String(key)
          .replace(/[^\w.-]/g, '')
          .substring(0, 100);
        sanitized[sanitizedKey] = sanitize(value);
      }
      return sanitized;
    }

    return obj;
  };

  req.body = sanitize(req.body);
  req.params = sanitize(req.params) as Record<string, string>;
  req.query = sanitize(req.query) as Record<string, string | string[]>;

  next();
}

/**
 * Request size limit middleware
 * Prevents denial of service attacks
 */
export function requestSizeLimit(maxSizeInMB: number = 10) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(
      req.headers['content-length'] || '0',
      10
    );
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    if (contentLength > maxSizeInBytes) {
      logger.warn(
        {
          contentLength,
          maxSizeInBytes,
          path: req.path,
        },
        'Request exceeds size limit'
      );

      res.status(413).json({
        error: 'Payload too large',
        message: `Request size exceeds ${maxSizeInMB}MB limit`,
      });
      return;
    }

    next();
  };
}

/**
 * Rate limiting tracking (simple in-memory implementation)
 * For production, use external service like Redis
 */
const requestCounts = new Map<string, number[]>();
const WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 100;

export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const identifier = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  if (!requestCounts.has(identifier)) {
    requestCounts.set(identifier, []);
  }

  const timestamps = requestCounts.get(identifier) || [];
  const recentRequests = timestamps.filter((t) => now - t < WINDOW_MS);

  if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
    logger.warn(
      { identifier, count: recentRequests.length },
      'Rate limit exceeded'
    );

    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(WINDOW_MS / 1000),
    });
    return;
  }

  recentRequests.push(now);
  requestCounts.set(identifier, recentRequests);

  // Cleanup old entries periodically
  if (requestCounts.size > 10000) {
    for (const [key, times] of requestCounts.entries()) {
      const validTimes = times.filter((t) => now - t < WINDOW_MS);
      if (validTimes.length === 0) {
        requestCounts.delete(key);
      } else {
        requestCounts.set(key, validTimes);
      }
    }
  }

  next();
}

/**
 * Request validation for dangerous content types
 * Prevents certain file types from being uploaded
 */
export function validateContentType(
  allowedTypes: string[] = ['application/json', 'multipart/form-data']
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.get('content-type') || '';

    const allowed = allowedTypes.some((type) =>
      contentType.startsWith(type)
    );

    if (!allowed && req.method !== 'GET') {
      logger.warn(
        { contentType, path: req.path },
        'Unsupported content type'
      );
      res.status(415).json({
        error: 'Unsupported Media Type',
        message: `Content-Type must be one of: ${allowedTypes.join(', ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * CSRF protection middleware
 * Validates X-Requested-With header or CSRF token for state-changing requests
 */
const csrfTokens = new Map<string, { token: string; timestamp: number }>();
const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export function generateCSRFToken(identifier: string): string {
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  csrfTokens.set(identifier, {
    token,
    timestamp: Date.now(),
  });
  return token;
}

export function csrfProtectionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const config = getConfig();

  // Skip CSRF protection for GET, HEAD, OPTIONS, development mode
  if (
    ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ||
    config.NODE_ENV === 'development'
  ) {
    return next();
  }

  // Check for CSRF token from header or body
  const token =
    req.get('x-csrf-token') ||
    (req.body && req.body.csrfToken);

  const identifier = req.ip || 'unknown';
  const tokenData = csrfTokens.get(identifier);

  if (
    !token ||
    !tokenData ||
    tokenData.token !== token ||
    Date.now() - tokenData.timestamp > CSRF_TOKEN_EXPIRY
  ) {
    logger.warn(
      { identifier, hasToken: !!token, path: req.path },
      'CSRF validation failed'
    );

    res.status(403).json({
      error: 'Forbidden',
      message: 'CSRF validation failed',
    });
    return;
  }

  // Token is valid, cleanup used token
  csrfTokens.delete(identifier);

  next();
}
