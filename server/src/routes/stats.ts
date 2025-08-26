import { Router, Response } from 'express';
import Joi from 'joi';
import { ActivityQueries } from '../domain/queries';
import { AuthenticatedRequest } from '../auth/middleware';
import { logger } from '../utils/logger';

const router = Router();
const activityQueries = new ActivityQueries();

const statsSchema = Joi.object({
  date_from: Joi.date().iso().optional(),
  date_to: Joi.date().iso().optional(),
  tenant_id: Joi.string().uuid().optional()
});

/**
 * @swagger
 * /api/stats/overview:
 *   get:
 *     summary: Get activity statistics and overview
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for statistics
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for statistics
 *       - in: query
 *         name: tenant_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by organization/tenant
 *     responses:
 *       200:
 *         description: Activity statistics
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
 *                     total_activities:
 *                       type: integer
 *                     actions_by_type:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                     entities_by_type:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                     top_users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           user_id:
 *                             type: string
 *                           user_email:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     top_entities:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           entity_type:
 *                             type: string
 *                           entity_id:
 *                             type: string
 *                           entity_name:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     time_series:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           count:
 *                             type: integer
 */
router.get('/overview', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { error, value: filters } = statsSchema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        details: error.details
      });
    }

    const stats = await activityQueries.getActivityStats(filters);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
  
  return; // Explicit return for TypeScript
});

/**
 * @swagger
 * /api/stats/summary:
 *   get:
 *     summary: Get quick summary statistics
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary statistics
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
 *                     activities_today:
 *                       type: integer
 *                     activities_this_week:
 *                       type: integer
 *                     activities_this_month:
 *                       type: integer
 *                     total_activities:
 *                       type: integer
 *                     active_users_today:
 *                       type: integer
 *                     most_common_action:
 *                       type: string
 *                     most_active_entity_type:
 *                       type: string
 */
router.get('/summary', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get different time period stats in parallel
    const [
      todayStats,
      weekStats,
      monthStats,
      totalStats
    ] = await Promise.all([
      activityQueries.getActivityStats({ date_from: today }),
      activityQueries.getActivityStats({ date_from: thisWeek }),
      activityQueries.getActivityStats({ date_from: thisMonth }),
      activityQueries.getActivityStats()
    ]);

    // Calculate summary metrics
    const summary = {
      activities_today: todayStats.total_activities,
      activities_this_week: weekStats.total_activities,
      activities_this_month: monthStats.total_activities,
      total_activities: totalStats.total_activities,
      active_users_today: todayStats.top_users.length,
      most_common_action: Object.keys(totalStats.actions_by_type)
        .reduce((a, b) => totalStats.actions_by_type[a] > totalStats.actions_by_type[b] ? a : b, ''),
      most_active_entity_type: Object.keys(totalStats.entities_by_type)
        .reduce((a, b) => totalStats.entities_by_type[a] > totalStats.entities_by_type[b] ? a : b, '')
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Error fetching summary stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/stats/dashboard:
 *   get:
 *     summary: Get comprehensive dashboard KPIs with delta comparisons
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for KPIs (defaults to 7 days ago)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for KPIs (defaults to now)
 *       - in: query
 *         name: orgId
 *         schema:
 *           type: string
 *         description: Filter by organization ID
 *     responses:
 *       200:
 *         description: Comprehensive dashboard KPIs
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
 *                     logins:
 *                       type: object
 *                     activeUsers:
 *                       type: object
 *                     tasks:
 *                       type: object
 *                     documents:
 *                       type: object
 *                     vendors:
 *                       type: object
 *                     securityTests:
 *                       type: object
 *                     audits:
 *                       type: object
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Default to last 7 days if no date range provided
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const from = (req.query.from as string) || sevenDaysAgo.toISOString();
    const to = (req.query.to as string) || now.toISOString();
    const orgId = req.query.orgId as string;

    const kpis = await activityQueries.getDashboardKPIs({ from, to, orgId });
    
    res.json({
      success: true,
      data: kpis
    });
  } catch (error) {
    logger.error('Error fetching dashboard KPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
  
  return; // Explicit return for TypeScript
});

/**
 * @swagger
 * /api/stats/timeseries:
 *   get:
 *     summary: Get time-series data for charts
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         required: true
 *         description: Start date for time series
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         required: true
 *         description: End date for time series
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [logins, tasks, documents, vendor_scans, security_tests, audits]
 *         required: true
 *         description: Data source for time series
 *       - in: query
 *         name: granularity
 *         schema:
 *           type: string
 *           enum: [hour, day]
 *         description: Time granularity (defaults to day)
 *       - in: query
 *         name: orgId
 *         schema:
 *           type: string
 *         description: Filter by organization ID
 *     responses:
 *       200:
 *         description: Time-series data points
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/timeseries', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { from, to, source, granularity = 'day', orgId } = req.query;

    if (!from || !to || !source) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: from, to, source'
      });
    }

    if (!['logins', 'tasks', 'documents', 'vendor_scans', 'security_tests', 'audits'].includes(source as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid source. Must be one of: logins, tasks, documents, vendor_scans, security_tests, audits'
      });
    }

    if (!['hour', 'day'].includes(granularity as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid granularity. Must be hour or day'
      });
    }

    const timeSeries = await activityQueries.getTimeSeries({
      from: from as string,
      to: to as string,
      source: source as string,
      granularity: granularity as 'hour' | 'day',
      orgId: orgId as string
    });
    
    res.json({
      success: true,
      data: timeSeries
    });
  } catch (error) {
    logger.error('Error fetching time series:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
  
  return; // Explicit return for TypeScript
});

/**
 * @swagger
 * /api/stats/toplists:
 *   get:
 *     summary: Get top lists for dashboard (most active users, vendors, etc.)
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for top lists (defaults to 7 days ago)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for top lists (defaults to now)
 *       - in: query
 *         name: orgId
 *         schema:
 *           type: string
 *         description: Filter by organization ID
 *     responses:
 *       200:
 *         description: Top lists data
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
 *                     mostActiveUsers:
 *                       type: array
 *                     mostTouchedVendors:
 *                       type: array
 *                     taskStatusBreakdown:
 *                       type: array
 *                     documentStateBreakdown:
 *                       type: array
 */
router.get('/toplists', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Default to last 7 days if no date range provided
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const from = (req.query.from as string) || sevenDaysAgo.toISOString();
    const to = (req.query.to as string) || now.toISOString();
    const orgId = req.query.orgId as string;

    const topLists = await activityQueries.getTopLists({ from, to, orgId });
    
    res.json({
      success: true,
      data: topLists
    });
  } catch (error) {
    logger.error('Error fetching top lists:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
  
  return; // Explicit return for TypeScript
});

export default router;
