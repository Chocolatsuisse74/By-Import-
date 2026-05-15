import express, { Router, Request, Response, NextFunction } from 'express';
import { ImportJob } from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import {
  createImportJobSchema,
  updateImportJobSchema,
  importJobParamSchema,
  CreateImportJobRequest,
  UpdateImportJobRequest,
  ImportJobParams,
} from '../../config/schemas.js';
import { validateRequest, errorHandler } from '../../middleware/validation.js';

const router: Router = express.Router();
const jobsDB: Map<string, ImportJob> = new Map();

/**
 * GET /api/imports
 * List all import jobs
 */
router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const jobs = Array.from(jobsDB.values());
    res.json({ jobs, count: jobs.length });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/imports/:id
 * Get a specific import job by ID
 */
router.get(
  '/:id',
  validateRequest(importJobParamSchema, 'params'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as ImportJobParams;
      const job = jobsDB.get(id);

      if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }

      res.json(job);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/imports
 * Create a new import job
 */
router.post(
  '/',
  validateRequest(createImportJobSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sourceId, fileName, fileType, totalRecords } =
        req.body as CreateImportJobRequest;

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
      next(error);
    }
  }
);

/**
 * PUT /api/imports/:id
 * Update an existing import job
 */
router.put(
  '/:id',
  validateRequest(importJobParamSchema, 'params'),
  validateRequest(updateImportJobSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as ImportJobParams;
      const updates = req.body as UpdateImportJobRequest;

      const job = jobsDB.get(id);
      if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }

      // Only allow updating specific fields
      const updated: ImportJob = {
        ...job,
        ...(updates.status && { status: updates.status }),
        ...(updates.processedRecords !== undefined && {
          processedRecords: updates.processedRecords,
        }),
        ...(updates.failedRecords !== undefined && {
          failedRecords: updates.failedRecords,
        }),
        ...(updates.errorMessage !== undefined && {
          errorMessage: updates.errorMessage,
        }),
        ...(updates.completedAt && { completedAt: updates.completedAt }),
        updatedAt: new Date(),
      };

      jobsDB.set(id, updated);
      logger.info({ jobId: id }, 'Import job updated');
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
