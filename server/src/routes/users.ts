import { Router, Response } from 'express';
import { ActivityQueries } from '../domain/queries';
import { AuthenticatedRequest } from '../auth/middleware';
import { logger } from '../utils/logger';

const router = Router();
const activityQueries = new ActivityQueries();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users for filter dropdowns
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
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
 *                     properties:
 *                       id:
 *                         type: string
 *                       email:
 *                         type: string
 *                       name:
 *                         type: string
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await activityQueries.getUsers();
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/users/organizations:
 *   get:
 *     summary: Get all organizations for filter dropdowns
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of organizations
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
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 */
router.get('/organizations', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizations = await activityQueries.getOrganizations();
    
    res.json({
      success: true,
      data: organizations
    });
  } catch (error) {
    logger.error('Error fetching organizations:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
