import { Router, Response } from 'express';
import Joi from 'joi';
import { ActivityQueries } from '../domain/queries';
import { AuthenticatedRequest } from '../auth/middleware';
import { logger } from '../utils/logger';
import { db } from '../db/client';

const router = Router();
const activityQueries = new ActivityQueries();

/**
 * @swagger
 * /api/user-journey/{userEmail}:
 *   get:
 *     summary: Get comprehensive user journey analysis
 *     tags: [User Journey]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userEmail
 *         schema:
 *           type: string
 *           format: email
 *         required: true
 *         description: Email of the user to analyze
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for analysis (defaults to 90 days ago)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for analysis (defaults to now)
 *     responses:
 *       200:
 *         description: Comprehensive user journey data
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
 *                     userProfile:
 *                       type: object
 *                     loginSessions:
 *                       type: array
 *                     activityTimeline:
 *                       type: array
 *                     vendorJourney:
 *                       type: object
 *                     taskJourney:
 *                       type: object
 *                     documentJourney:
 *                       type: object
 *                     integrationJourney:
 *                       type: object
 *                     securityJourney:
 *                       type: object
 *                     featureUsage:
 *                       type: object
 *                     riskProfile:
 *                       type: object
 *       404:
 *         description: User not found
 *       400:
 *         description: Invalid parameters
 */
router.get('/:userEmail', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userEmail } = req.params;
    
    // Validate email format
    const emailSchema = Joi.string().email().required();
    const { error: emailError } = emailSchema.validate(userEmail);
    
    if (emailError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate query parameters
    const querySchema = Joi.object({
      from: Joi.date().iso().optional(),
      to: Joi.date().iso().optional()
    });

    const { error: queryError, value: queryParams } = querySchema.validate(req.query);
    
    if (queryError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        details: queryError.details
      });
    }

    // Get user journey data
    const dateRange = queryParams.from && queryParams.to ? {
      from: queryParams.from,
      to: queryParams.to
    } : undefined;

    const journeyData = await activityQueries.getUserJourney(userEmail, dateRange);
    
    if (!journeyData.userProfile) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: journeyData
    });
  } catch (error) {
    logger.error('Error fetching user journey:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
  
  return;
});

/**
 * @swagger
 * /api/user-journey/search/users:
 *   get:
 *     summary: Search for users to analyze
 *     tags: [User Journey]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for user name or email
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *     responses:
 *       200:
 *         description: List of users matching search criteria
 */
router.get('/search/users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schema = Joi.object({
      search: Joi.string().allow('').optional(),
      limit: Joi.number().integer().min(1).max(50).default(20)
    });

    const { error, value: params } = schema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        details: error.details
      });
    }

    // Search for users
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    
    if (params.search) {
      whereClause += ` AND (u.email ILIKE $1 OR u."firstName" ILIKE $1 OR u."lastName" ILIKE $1)`;
      queryParams.push(`%${params.search}%`);
    }
    
    queryParams.push(params.limit.toString());

    const query = `
      SELECT 
        u.id,
        u.email,
        u."firstName",
        u."lastName",
        u."createdAt",
        o.name as organization_name,
        'user' as role,
        -- Activity summary
        (SELECT COUNT(*) FROM public."SecurityLog" sl 
         WHERE sl.email = u.email AND sl.action = 'LOGIN_SUCCESS') as total_logins,
        (SELECT MAX(sl."createdAt") FROM public."SecurityLog" sl 
         WHERE sl.email = u.email AND sl.action = 'LOGIN_SUCCESS') as last_login,
        (SELECT COUNT(*) FROM public."Task" t WHERE t."ownerId" = u.id) as total_tasks,
        (SELECT COUNT(*) FROM public."Vendor" v WHERE v."ownerId" = u.id) as total_vendors
      FROM public.users u
      LEFT JOIN public."Organization" o ON u."currentOrganizationId" = o.id
      ${whereClause}
      ORDER BY u."createdAt" DESC
      LIMIT $${queryParams.length}
    `;

    const result = await db.query(query, queryParams);
    
    res.json({
      success: true,
      data: result.rows.map((user: any) => ({
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        organization_name: user.organization_name,
        role: user.role,
        created_at: user.createdAt,
        total_logins: parseInt(user.total_logins || 0),
        last_login: user.last_login,
        total_tasks: parseInt(user.total_tasks || 0),
        total_vendors: parseInt(user.total_vendors || 0)
      }))
    });
  } catch (error) {
    logger.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
  
  return;
});

export default router;
