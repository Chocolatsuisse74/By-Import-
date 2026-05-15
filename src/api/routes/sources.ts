import express, { Router, Request, Response } from 'express';
import { DataSource } from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const router: Router = express.Router();
const sourcesDB: Map<string, DataSource> = new Map();

router.get('/', (_req: Request, res: Response) => {
  const sources = Array.from(sourcesDB.values());
  res.json({ sources, count: sources.length });
});

router.get('/:id', (req: Request, res: Response) => {
  const source = sourcesDB.get(req.params.id);
  if (!source) {
    res.status(404).json({ error: 'Source not found' });
    return;
  }
  res.json(source);
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { name, type, configuration } = req.body;

    if (!name || !type) {
      res.status(400).json({ error: 'name and type are required' });
      return;
    }

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
    logger.error(error, 'Error creating data source');
    res
      .status(500)
      .json({
        error: error instanceof Error ? error.message : 'Internal server error',
      });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const source = sourcesDB.get(req.params.id);
    if (!source) {
      res.status(404).json({ error: 'Source not found' });
      return;
    }

    const updated = {
      ...source,
      ...req.body,
      updatedAt: new Date(),
    };
    sourcesDB.set(req.params.id, updated);
    logger.info({ sourceId: req.params.id }, 'Data source updated');
    res.json(updated);
  } catch (error) {
    logger.error(error, 'Error updating data source');
    res
      .status(500)
      .json({
        error: error instanceof Error ? error.message : 'Internal server error',
      });
  }
});

export default router;
