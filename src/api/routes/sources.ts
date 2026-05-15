import express, { Router, Request, Response, NextFunction } from 'express';
import { DataSource } from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import {
  createDataSourceSchema,
  updateDataSourceSchema,
  dataSourceParamSchema,
  CreateDataSourceRequest,
  UpdateDataSourceRequest,
  DataSourceParams,
} from '../../config/schemas.js';
import { validateRequest } from '../../middleware/validation.js';

const router: Router = express.Router();
const sourcesDB: Map<string, DataSource> = new Map();

/**
 * GET /api/sources
 * List all data sources
 */
router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sources = Array.from(sourcesDB.values());
    res.json({ sources, count: sources.length });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sources/:id
 * Get a specific data source by ID
 */
router.get(
  '/:id',
  validateRequest(dataSourceParamSchema, 'params'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as DataSourceParams;
      const source = sourcesDB.get(id);

      if (!source) {
        res.status(404).json({ error: 'Source not found' });
        return;
      }

      res.json(source);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/sources
 * Create a new data source
 */
router.post(
  '/',
  validateRequest(createDataSourceSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, type, configuration } =
        req.body as CreateDataSourceRequest;

      const id = uuidv4();
      const source: DataSource = {
        id,
        name,
        type,
        configuration: configuration || {},
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      sourcesDB.set(id, source);
      logger.info({ sourceId: id }, 'Data source created');
      res.status(201).json(source);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/sources/:id
 * Update an existing data source
 */
router.put(
  '/:id',
  validateRequest(dataSourceParamSchema, 'params'),
  validateRequest(updateDataSourceSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as DataSourceParams;
      const updates = req.body as UpdateDataSourceRequest;

      const source = sourcesDB.get(id);
      if (!source) {
        res.status(404).json({ error: 'Source not found' });
        return;
      }

      // Only allow updating specific fields
      const updated: DataSource = {
        ...source,
        ...(updates.name && { name: updates.name }),
        ...(updates.type && { type: updates.type }),
        ...(updates.configuration && {
          configuration: updates.configuration,
        }),
        ...(updates.isActive !== undefined && { isActive: updates.isActive }),
        updatedAt: new Date(),
      };

      sourcesDB.set(id, updated);
      logger.info({ sourceId: id }, 'Data source updated');
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
