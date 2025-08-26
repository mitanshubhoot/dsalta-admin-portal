import { Router, Response } from 'express';
import Joi from 'joi';
import { ActivityQueries } from '../domain/queries';
import { AuthenticatedRequest } from '../auth/middleware';
import { logger } from '../utils/logger';

const router = Router();
const activityQueries = new ActivityQueries();

// Common validation schemas
const baseFilters = Joi.object({
  from: Joi.date().iso().required(),
  to: Joi.date().iso().required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  search: Joi.string().allow('').optional()
});

/**
 * @swagger
 * /api/activities-detailed/logins:
 *   get:
 *     summary: Get detailed login activities with filtering and pagination
 *     tags: [Activities Detail]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         required: true
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         required: true
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by user name or email
 *       - in: query
 *         name: success
 *         schema:
 *           type: boolean
 *         description: Filter by success/failure
 */
router.get('/logins', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schema = baseFilters.keys({
      success: Joi.boolean().optional()
    });

    const { error, value: filters } = schema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        details: error.details
      });
    }

    const result = await activityQueries.getDetailedLoginActivity(filters);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching detailed login activities:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
  
  return;
});

/**
 * @swagger
 * /api/activities-detailed/tasks:
 *   get:
 *     summary: Get detailed task activities with filtering and pagination
 *     tags: [Activities Detail]
 *     security:
 *       - bearerAuth: []
 */
router.get('/tasks', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schema = baseFilters.keys({
      status: Joi.string().optional(),
      framework: Joi.string().optional()
    });

    const { error, value: filters } = schema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        details: error.details
      });
    }

    const result = await activityQueries.getDetailedTaskActivity(filters);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching detailed task activities:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
  
  return;
});

/**
 * @swagger
 * /api/activities-detailed/documents:
 *   get:
 *     summary: Get detailed document activities with filtering and pagination
 *     tags: [Activities Detail]
 *     security:
 *       - bearerAuth: []
 */
router.get('/documents', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schema = baseFilters.keys({
      status: Joi.string().optional(),
      type: Joi.string().optional()
    });

    const { error, value: filters } = schema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        details: error.details
      });
    }

    const result = await activityQueries.getDetailedDocumentActivity(filters);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching detailed document activities:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
  
  return;
});

/**
 * @swagger
 * /api/activities-detailed/vendor-scans:
 *   get:
 *     summary: Get detailed vendor scan activities with filtering and pagination
 *     tags: [Activities Detail]
 *     security:
 *       - bearerAuth: []
 */
router.get('/vendor-scans', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schema = baseFilters.keys({
      grade: Joi.string().valid('A', 'B', 'C', 'D', 'F').optional(),
      minScore: Joi.number().min(0).optional()
    });

    const { error, value: filters } = schema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        details: error.details
      });
    }

    const result = await activityQueries.getDetailedVendorScanActivity(filters);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching detailed vendor scan activities:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
  
  return;
});

/**
 * @swagger
 * /api/activities-detailed/security-tests:
 *   get:
 *     summary: Get detailed security test activities with filtering and pagination
 *     tags: [Activities Detail]
 *     security:
 *       - bearerAuth: []
 */
router.get('/security-tests', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schema = baseFilters.keys({
      result: Joi.string().valid('PASS', 'FAIL', 'IN_PROGRESS', 'NOT_RUN').optional()
    });

    const { error, value: filters } = schema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        details: error.details
      });
    }

    const result = await activityQueries.getDetailedSecurityTestActivity(filters);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching detailed security test activities:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
  
  return;
});

/**
 * @swagger
 * /api/activities-detailed/audits:
 *   get:
 *     summary: Get detailed audit activities with filtering and pagination
 *     tags: [Activities Detail]
 *     security:
 *       - bearerAuth: []
 */
router.get('/audits', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schema = baseFilters.keys({
      grade: Joi.string().valid('A', 'B', 'C', 'D', 'F').optional(),
      minScore: Joi.number().min(0).optional()
    });

    const { error, value: filters } = schema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        details: error.details
      });
    }

    const result = await activityQueries.getDetailedAuditActivity(filters);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching detailed audit activities:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
  
  return;
});

export default router;
