import { Router } from 'express';
import { ActivityQueries } from '../domain/queries';
import { authenticateToken } from '../auth/middleware';
import { logger } from '../utils/logger';

const router = Router();
const activityQueries = new ActivityQueries();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Vendor Management Overview
router.get('/overview', async (req, res) => {
  try {
    const { from, to, orgId } = req.query;
    
    const filters = {
      from: from as string,
      to: to as string,
      orgId: orgId as string
    };

    const overview = await activityQueries.getVendorManagementOverview(filters);
    
    return res.json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching vendor management overview:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch vendor management overview'
    });
  }
});

// Advanced Vendor Search
router.get('/search', async (req, res) => {
  try {
    const {
      search,
      risk_level,
      organization_id,
      review_status,
      has_contract,
      min_score,
      max_score,
      added_by,
      page = '1',
      limit = '50',
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const filters = {
      search: search as string,
      risk_level: risk_level as string,
      organization_id: organization_id as string,
      review_status: review_status as string,
      has_contract: has_contract === 'true',
      min_score: min_score ? parseInt(min_score as string) : undefined,
      max_score: max_score ? parseInt(max_score as string) : undefined,
      added_by: added_by as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort_by: sort_by as string,
      sort_order: sort_order as string
    };

    const results = await activityQueries.searchVendors(filters);
    
    return res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error searching vendors:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to search vendors'
    });
  }
});

// Get Vendor Details
router.get('/:vendorId/details', async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    const vendorDetails = await activityQueries.getVendorDetails(vendorId);
    
    if (!vendorDetails) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Vendor not found'
      });
    }
    
    return res.json({
      success: true,
      data: vendorDetails,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching vendor details:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch vendor details'
    });
  }
});

// Get Top Vendors by Risk
router.get('/top-risk', async (req, res) => {
  try {
    const { limit = '10' } = req.query;
    
    const topVendors = await (activityQueries as any).getTopVendorsByRisk(parseInt(limit as string));
    
    return res.json({
      success: true,
      data: topVendors,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching top vendors by risk:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch top vendors by risk'
    });
  }
});

// Get Vendors by Organization
router.get('/by-organization', async (req, res) => {
  try {
    const vendorsByOrg = await (activityQueries as any).getVendorsByOrganization();
    
    return res.json({
      success: true,
      data: vendorsByOrg,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching vendors by organization:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch vendors by organization'
    });
  }
});

// Get Contract Summary
router.get('/contracts/summary', async (req, res) => {
  try {
    const contractSummary = await (activityQueries as any).getVendorContractSummary();
    
    return res.json({
      success: true,
      data: contractSummary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching contract summary:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch contract summary'
    });
  }
});

// Get Security Trends
router.get('/security-trends', async (req, res) => {
  try {
    const { from, to } = req.query;
    
    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'from and to parameters are required'
      });
    }
    
    const trends = await (activityQueries as any).getVendorSecurityTrends(from as string, to as string);
    
    return res.json({
      success: true,
      data: trends,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching security trends:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch security trends'
    });
  }
});

// Get Recent Vendor Activities
router.get('/activities/recent', async (req, res) => {
  try {
    const { from, to, limit = '50' } = req.query;
    
    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'from and to parameters are required'
      });
    }
    
    const activities = await (activityQueries as any).getRecentVendorActivities(
      from as string, 
      to as string, 
      parseInt(limit as string)
    );
    
    return res.json({
      success: true,
      data: activities,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching recent vendor activities:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch recent vendor activities'
    });
  }
});

// Get Recent Vendors
router.get('/recent', async (req, res) => {
  try {
    const { limit = '20' } = req.query;
    
    const recentVendors = await (activityQueries as any).getRecentVendors(parseInt(limit as string));
    
    return res.json({
      success: true,
      data: recentVendors,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching recent vendors:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch recent vendors'
    });
  }
});

// Get Vendor Statistics
router.get('/stats', async (req, res) => {
  try {
    const { from, to, orgId } = req.query;
    
    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'from and to parameters are required'
      });
    }
    
    const stats = await (activityQueries as any).getVendorStats(
      from as string, 
      to as string, 
      orgId as string
    );
    
    return res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching vendor statistics:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch vendor statistics'
    });
  }
});

export default router;
