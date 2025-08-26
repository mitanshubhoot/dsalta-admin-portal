import { Router, Request, Response } from 'express';
import { Parser } from 'json2csv';
import Joi from 'joi';
import { ActivityQueries } from '../domain/queries';
import { ActivityFilters, ActivityAction, EntityType } from '../domain/activity';
import { AuthenticatedRequest } from '../auth/middleware';
import { logger } from '../utils/logger';

const router = Router();
const activityQueries = new ActivityQueries();

// Validation schemas
const getActivitiesSchema = Joi.object({
  q: Joi.string().max(255).optional(),
  user_id: Joi.string().uuid().optional(),
  tenant_id: Joi.string().uuid().optional(),
  entity_type: Joi.string().valid(...Object.values(EntityType)).optional(),
  action: Joi.string().valid(...Object.values(ActivityAction)).optional(),
  date_from: Joi.date().iso().optional(),
  date_to: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  sort_by: Joi.string().valid('created_at', 'action', 'entity_type').default('created_at'),
  sort_order: Joi.string().valid('asc', 'desc').default('desc')
});

/**
 * @swagger
 * /api/activities:
 *   get:
 *     summary: Get paginated activities with filtering and sorting
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Free text search across user email/name, entity name, action
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *       - in: query
 *         name: tenant_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by tenant/organization ID
 *       - in: query
 *         name: entity_type
 *         schema:
 *           type: string
 *           enum: [user, vendor, score, integration, organization, report, settings, security, general]
 *         description: Filter by entity type
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date filter
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date filter
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Items per page
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [created_at, action, entity_type]
 *           default: created_at
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Paginated activities list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ActivityLogWithDetails'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { error, value: filters } = getActivitiesSchema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        details: error.details
      });
    }

    const result = await activityQueries.getActivities(filters as ActivityFilters);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
  
  return; // Explicit return for TypeScript
});

/**
 * @swagger
 * /api/activities/{id}:
 *   get:
 *     summary: Get activity by ID
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Activity ID
 *     responses:
 *       200:
 *         description: Activity details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ActivityLogWithDetails'
 *       404:
 *         description: Activity not found
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate UUID format
    const uuidSchema = Joi.string().uuid().required();
    const { error } = uuidSchema.validate(id);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid activity ID format'
      });
    }

    const activity = await activityQueries.getActivityById(id);
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    logger.error('Error fetching activity by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
  
  return; // Explicit return for TypeScript
});

/**
 * @swagger
 * /api/activities/export/csv:
 *   get:
 *     summary: Export activities to CSV
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Free text search
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *       - in: query
 *         name: tenant_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by tenant ID
 *       - in: query
 *         name: entity_type
 *         schema:
 *           type: string
 *         description: Filter by entity type
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date filter
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date filter
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/export/csv', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { error, value: filters } = getActivitiesSchema.validate({
      ...req.query,
      limit: 10000, // Higher limit for export
      page: 1
    });
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        details: error.details
      });
    }

    const result = await activityQueries.getActivities(filters as ActivityFilters);
    
    // Prepare data for CSV export
    const csvData = result.data.map(activity => ({
      ID: activity.id,
      'Created At': activity.created_at,
      'User Email': activity.user_email || 'N/A',
      'User Name': activity.user_name || 'N/A',
      'Organization': activity.organization_name || 'N/A',
      Action: activity.action,
      'Entity Type': activity.entity_type,
      'Entity ID': activity.entity_id || 'N/A',
      'Entity Name': activity.entity_name || 'N/A',
      'IP Address': activity.ip || 'N/A',
      'User Agent': activity.user_agent || 'N/A',
      Metadata: activity.metadata ? JSON.stringify(activity.metadata) : 'N/A'
    }));

    const parser = new Parser();
    const csv = parser.parse(csvData);

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `activities-${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);

    logger.info(`CSV export completed by ${req.user?.email}, ${result.data.length} records`);
  } catch (error) {
    logger.error('Error exporting activities to CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Export failed'
    });
  }
  
  return; // Explicit return for TypeScript
});

export default router;
