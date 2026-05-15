import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export type WebhookEvent = 'agent_message' | 'lead_created' | 'deal_closed';

export interface WebhookPayload {
  id: string;
  event: WebhookEvent;
  timestamp: Date;
  data: Record<string, unknown>;
  attempt: number;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: WebhookEvent[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 60000,
};

export class WebhookManager {
  private endpoints: Map<string, WebhookEndpoint> = new Map();
  private retryConfig: RetryConfig;

  constructor(retryConfig: Partial<RetryConfig> = {}) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  registerEndpoint(url: string, events: WebhookEvent[]): WebhookEndpoint {
    const endpoint: WebhookEndpoint = {
      id: uuidv4(),
      url,
      events,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.endpoints.set(endpoint.id, endpoint);
    logger.info({ endpoint }, 'Webhook endpoint registered');
    return endpoint;
  }

  unregisterEndpoint(id: string): boolean {
    const deleted = this.endpoints.delete(id);
    if (deleted) {
      logger.info({ id }, 'Webhook endpoint unregistered');
    }
    return deleted;
  }

  getEndpoints(event?: WebhookEvent): WebhookEndpoint[] {
    const endpoints = Array.from(this.endpoints.values()).filter(
      (ep) => ep.isActive && (!event || ep.events.includes(event))
    );
    return endpoints;
  }

  async emit(event: WebhookEvent, data: Record<string, unknown>): Promise<void> {
    const endpoints = this.getEndpoints(event);

    if (endpoints.length === 0) {
      logger.debug({ event }, 'No webhook endpoints registered for event');
      return;
    }

    const payload: WebhookPayload = {
      id: uuidv4(),
      event,
      timestamp: new Date(),
      data,
      attempt: 1,
    };

    for (const endpoint of endpoints) {
      this.sendWithRetry(endpoint, payload).catch((err) => {
        logger.error(
          { err, endpointId: endpoint.id, payloadId: payload.id },
          'Failed to deliver webhook after all retries'
        );
      });
    }
  }

  private async sendWithRetry(
    endpoint: WebhookEndpoint,
    payload: WebhookPayload
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        await this.send(endpoint, { ...payload, attempt });
        logger.debug(
          { endpointId: endpoint.id, payloadId: payload.id, attempt },
          'Webhook delivered successfully'
        );
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        logger.warn(
          {
            err: lastError,
            endpointId: endpoint.id,
            payloadId: payload.id,
            attempt,
            nextRetryIn: this.getBackoffDelay(attempt),
          },
          'Webhook delivery failed, retrying...'
        );

        if (attempt < this.retryConfig.maxRetries) {
          const delayMs = this.getBackoffDelay(attempt);
          await this.delay(delayMs);
        }
      }
    }

    throw lastError || new Error('Failed to deliver webhook');
  }

  private async send(
    endpoint: WebhookEndpoint,
    payload: WebhookPayload
  ): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-ID': payload.id,
          'X-Webhook-Event': payload.event,
          'X-Webhook-Attempt': String(payload.attempt),
          'X-Webhook-Timestamp': payload.timestamp.toISOString(),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: ${response.statusText}`
        );
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private getBackoffDelay(attempt: number): number {
    const exponentialDelay =
      this.retryConfig.baseDelayMs * Math.pow(2, attempt - 1);
    const capped = Math.min(exponentialDelay, this.retryConfig.maxDelayMs);
    // Add jitter: ±20% of the delay
    const jitter = capped * 0.2;
    const randomJitter = (Math.random() - 0.5) * jitter * 2;
    return Math.max(100, capped + randomJitter);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Global singleton instance
let webhookManager: WebhookManager | null = null;

export function getWebhookManager(): WebhookManager {
  if (!webhookManager) {
    webhookManager = new WebhookManager({
      maxRetries: parseInt(process.env.WEBHOOK_MAX_RETRIES || '5', 10),
      baseDelayMs: parseInt(process.env.WEBHOOK_BASE_DELAY_MS || '1000', 10),
      maxDelayMs: parseInt(process.env.WEBHOOK_MAX_DELAY_MS || '60000', 10),
    });
  }
  return webhookManager;
}
