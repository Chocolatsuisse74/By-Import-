import express, { Router, Request, Response } from 'express';
import { ImportJob } from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const router: Router = express.Router();
const jobsDB: Map<string, ImportJob> = new Map();

router.get('/', (_req: Request, res: Response) => {
  const jobs = Array.from(jobsDB.values());
  res.json({ jobs, count: jobs.length });
});

router.get('/:id', (req: Request, res: Response) => {
  const job = jobsDB.get(req.params.id);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  res.json(job);
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { sourceId, fileName, fileType, totalRecords } = req.body;

    if (!sourceId || !fileName || !fileType) {
      res
        .status(400)
        .json({
          error: 'sourceId, fileName, and fileType are required',
        });
      return;
    }

    const id = uuidv4();
    const job: ImportJob = {
      id,
      sourceId,
      fileName,
      fileType,
      status: 'pending',
      totalRecords: totalRecords || 0,
      processedRecords: 0,
      failedRecords: 0,
      startedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jobsDB.set(id, job);
    logger.info({ jobId: id }, 'Import job created');
    res.status(201).json(job);
  } catch (error) {
    logger.error(error, 'Error creating import job');
    res
      .status(500)
      .json({
        error: error instanceof Error ? error.message : 'Internal server error',
      });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const job = jobsDB.get(req.params.id);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const updated = {
      ...job,
      ...req.body,
      updatedAt: new Date(),
    };
    jobsDB.set(req.params.id, updated);
    logger.info({ jobId: req.params.id }, 'Import job updated');
    res.json(updated);
  } catch (error) {
    logger.error(error, 'Error updating import job');
    res
      .status(500)
      .json({
        error: error instanceof Error ? error.message : 'Internal server error',
      });
  }
});

export default router;
