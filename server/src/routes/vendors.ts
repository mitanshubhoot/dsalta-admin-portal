import { Router, Response } from 'express';
import { ActivityQueries } from '../domain/queries';
import { AuthenticatedRequest } from '../auth/middleware';
import { logger } from '../utils/logger';

const router = Router();
const activityQueries = new ActivityQueries();

/**
 * @swagger
 * /api/vendors:
 *   get:
 *     summary: Get all vendors for filter dropdowns
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of vendors
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
 *                       domain:
 *                         type: string
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vendors = await activityQueries.getVendors();
    
    res.json({
      success: true,
      data: vendors
    });
  } catch (error) {
    logger.error('Error fetching vendors:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
