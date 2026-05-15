import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validation.js';
import { getWebhookManager, WebhookEvent } from '../../webhooks/manager.js';
import { logger } from '../../utils/logger.js';

const router = Router();
const webhookManager = getWebhookManager();

// Validation schemas
const registerWebhookSchema = z.object({
  url: z
    .string()
    .url('Invalid webhook URL')
    .refine(
      (url) => url.startsWith('https://'),
      'Webhook URL must use HTTPS protocol for security'
    )
    .refine((url) => url.length <= 2048, 'Webhook URL is too long'),
  events: z
    .array(z.enum(['agent_message', 'lead_created', 'deal_closed']))
    .min(1, 'At least one event must be specified'),
});

const updateWebhookSchema = z.object({
  url: z
    .string()
    .url('Invalid webhook URL')
    .refine(
      (url) => url.startsWith('https://'),
      'Webhook URL must use HTTPS protocol for security'
    )
    .refine((url) => url.length <= 2048, 'Webhook URL is too long')
    .optional(),
  events: z
    .array(z.enum(['agent_message', 'lead_created', 'deal_closed']))
    .min(1, 'At least one event must be specified')
    .optional(),
  isActive: z.boolean().optional(),
});

const webhookIdParamSchema = z.object({
  id: z.string().uuid('Invalid webhook ID format'),
});

// Register a new webhook endpoint
router.post(
  '/',
  validateRequest(registerWebhookSchema, 'body'),
  (req: Request, res: Response) => {
    try {
      const { url, events } = req.body as z.infer<typeof registerWebhookSchema>;

      const endpoint = webhookManager.registerEndpoint(
        url,
        events as WebhookEvent[]
      );

      logger.info({ endpoint }, 'Webhook endpoint created');
      res.status(201).json({
        id: endpoint.id,
        url: endpoint.url,
        events: endpoint.events,
        isActive: endpoint.isActive,
        createdAt: endpoint.createdAt,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to register webhook');
      res.status(500).json({ error: 'Failed to register webhook' });
    }
  }
);

// Get all webhook endpoints
router.get('/', (_req: Request, res: Response) => {
  try {
    const endpoints = webhookManager.getEndpoints();
    res.json({
      endpoints: endpoints.map((ep) => ({
        id: ep.id,
        url: ep.url,
        events: ep.events,
        isActive: ep.isActive,
        createdAt: ep.createdAt,
        updatedAt: ep.updatedAt,
      })),
      total: endpoints.length,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch webhooks');
    res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
});

// Get webhook endpoint by ID
router.get(
  '/:id',
  validateRequest(webhookIdParamSchema, 'params'),
  (req: Request, res: Response) => {
    try {
      const { id } = req.params as z.infer<typeof webhookIdParamSchema>;
      const endpoints = webhookManager.getEndpoints();
      const endpoint = endpoints.find((ep) => ep.id === id);

      if (!endpoint) {
        return res.status(404).json({ error: 'Webhook not found' });
      }

      res.json({
        id: endpoint.id,
        url: endpoint.url,
        events: endpoint.events,
        isActive: endpoint.isActive,
        createdAt: endpoint.createdAt,
        updatedAt: endpoint.updatedAt,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to fetch webhook');
      res.status(500).json({ error: 'Failed to fetch webhook' });
    }
  }
);

// Update webhook endpoint
router.patch(
  '/:id',
  validateRequest(webhookIdParamSchema, 'params'),
  validateRequest(updateWebhookSchema, 'body'),
  (req: Request, res: Response) => {
    try {
      const { id } = req.params as z.infer<typeof webhookIdParamSchema>;
      const updates = req.body as z.infer<typeof updateWebhookSchema>;

      const endpoints = webhookManager.getEndpoints();
      const endpoint = endpoints.find((ep) => ep.id === id);

      if (!endpoint) {
        return res.status(404).json({ error: 'Webhook not found' });
      }

      // Update endpoint (in a real scenario, persist to database)
      if (updates.url) {
        endpoint.url = updates.url;
      }
      if (updates.events) {
        endpoint.events = updates.events as WebhookEvent[];
      }
      if (updates.isActive !== undefined) {
        endpoint.isActive = updates.isActive;
      }
      endpoint.updatedAt = new Date();

      logger.info({ id }, 'Webhook endpoint updated');
      res.json({
        id: endpoint.id,
        url: endpoint.url,
        events: endpoint.events,
        isActive: endpoint.isActive,
        updatedAt: endpoint.updatedAt,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to update webhook');
      res.status(500).json({ error: 'Failed to update webhook' });
    }
  }
);

// Delete webhook endpoint
router.delete(
  '/:id',
  validateRequest(webhookIdParamSchema, 'params'),
  (req: Request, res: Response) => {
    try {
      const { id } = req.params as z.infer<typeof webhookIdParamSchema>;

      if (!webhookManager.unregisterEndpoint(id)) {
        return res.status(404).json({ error: 'Webhook not found' });
      }

      logger.info({ id }, 'Webhook endpoint deleted');
      res.status(204).send();
    } catch (error) {
      logger.error({ error }, 'Failed to delete webhook');
      res.status(500).json({ error: 'Failed to delete webhook' });
    }
  }
);

// Test webhook delivery
router.post(
  '/:id/test',
  validateRequest(webhookIdParamSchema, 'params'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as z.infer<typeof webhookIdParamSchema>;
      const endpoints = webhookManager.getEndpoints();
      const endpoint = endpoints.find((ep) => ep.id === id);

      if (!endpoint) {
        return res.status(404).json({ error: 'Webhook not found' });
      }

      // Emit a test event
      const testEvent = endpoint.events[0];
      await webhookManager.emit(testEvent, {
        test: true,
        message: 'This is a test webhook delivery',
        timestamp: new Date().toISOString(),
      });

      logger.info({ id }, 'Test webhook sent');
      res.json({ message: 'Test webhook sent successfully' });
    } catch (error) {
      logger.error({ error }, 'Failed to send test webhook');
      res.status(500).json({ error: 'Failed to send test webhook' });
    }
  }
);

export default router;
