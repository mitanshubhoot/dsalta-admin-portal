// ============================================================================
// ADMIN ACTIVITY PORTAL INTEGRATION FOR MAIN DSALTA APP
// ============================================================================
// 
// Copy this file into your main Dsalta app to enable real-time activity logging
// 
// Location: src/middleware/audit-logger.ts
// Usage: Apply to routes that need activity tracking
//
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import { db } from '../db/client'; // Adjust path to your database client

// Extend Express Request to include user and organization
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        organizationId: string;
      };
      organization?: {
        id: string;
        name: string;
      };
      sessionID?: string;
    }
  }
}

/**
 * Middleware to automatically log activities from your main Dsalta app
 * This will capture user actions and log them to the admin_audit schema
 */
export async function auditLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Set user context for this request (enables automatic logging)
  if (req.user && req.organization) {
    try {
      await db.query(
        'SELECT admin_audit.set_current_user_context($1, $2, $3, $4)',
        [
          req.user.id,
          req.organization.id,
          req.sessionID || null,
          req.headers['x-request-id'] || null
        ]
      );
    } catch (error) {
      console.warn('Failed to set user context for audit logging:', error);
    }
  }
  
  // Capture response details and log the activity
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // Log the activity asynchronously (won't slow down response)
    if (req.user && req.organization) {
      const action = getActionFromRoute(req.route?.path, req.method);
      const entityType = getEntityTypeFromRoute(req.route?.path);
      const entityId = req.params.id || null;
      
      // Don't await - log asynchronously to avoid blocking response
      db.query(
        'SELECT admin_audit.log_activity($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
        [
          req.user.id,
          req.organization.id,
          action,
          entityType,
          entityId,
          JSON.stringify({
            method: req.method,
            path: req.route?.path,
            status: res.statusCode,
            duration,
            ip: req.ip,
            user_agent: req.headers['user-agent'],
            success: res.statusCode < 400
          }),
          req.ip,
          req.headers['user-agent'],
          new Date(),
          req.sessionID || null,
          req.headers['x-request-id'] || null,
          res.statusCode,
          duration,
          res.statusCode >= 400 ? 'Request failed' : null // error_message
        ]
      ).catch(error => {
        console.warn('Failed to log activity:', error);
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}

/**
 * Determine the action type based on the route and HTTP method
 */
function getActionFromRoute(path: string | undefined, method: string): string {
  if (!path) return 'general.view';
  
  // Authentication actions
  if (path.includes('/auth/login')) return 'user.login';
  if (path.includes('/auth/logout')) return 'user.logout';
  if (path.includes('/auth/register')) return 'user.create';
  if (path.includes('/auth/password')) return 'user.password_reset';
  
  // Vendor actions
  if (path.includes('/vendors') && method === 'POST') return 'vendor.create';
  if (path.includes('/vendors') && method === 'PUT') return 'vendor.update';
  if (path.includes('/vendors') && method === 'DELETE') return 'vendor.delete';
  if (path.includes('/vendors') && method === 'GET') return 'vendor.view';
  
  // Integration actions
  if (path.includes('/integrations') && method === 'POST') return 'integration.connect';
  if (path.includes('/integrations') && method === 'PUT') return 'integration.update';
  if (path.includes('/integrations') && method === 'DELETE') return 'integration.disconnect';
  if (path.includes('/integrations') && method === 'GET') return 'integration.view';
  
  // Task actions
  if (path.includes('/tasks') && method === 'POST') return 'task.create';
  if (path.includes('/tasks') && method === 'PUT') return 'task.update';
  if (path.includes('/tasks') && method === 'DELETE') return 'task.delete';
  if (path.includes('/tasks') && method === 'GET') return 'task.view';
  
  // Test actions
  if (path.includes('/tests') && method === 'POST') return 'test.execute';
  if (path.includes('/tests') && method === 'PUT') return 'test.update';
  if (path.includes('/tests') && method === 'DELETE') return 'test.delete';
  if (path.includes('/tests') && method === 'GET') return 'test.view';
  
  // Score actions
  if (path.includes('/scores') && method === 'POST') return 'score.calculate';
  if (path.includes('/scores') && method === 'PUT') return 'score.update';
  if (path.includes('/scores') && method === 'GET') return 'score.view';
  
  // Report actions
  if (path.includes('/reports') && method === 'POST') return 'report.generate';
  if (path.includes('/reports') && method === 'GET') return 'report.view';
  if (path.includes('/reports') && method === 'PUT') return 'report.update';
  
  // User management
  if (path.includes('/users') && method === 'POST') return 'user.create';
  if (path.includes('/users') && method === 'PUT') return 'user.update';
  if (path.includes('/users') && method === 'DELETE') return 'user.delete';
  if (path.includes('/users') && method === 'GET') return 'user.view';
  
  // Organization actions
  if (path.includes('/organizations') && method === 'POST') return 'organization.create';
  if (path.includes('/organizations') && method === 'PUT') return 'organization.update';
  if (path.includes('/organizations') && method === 'GET') return 'organization.view';
  
  // Default actions based on method
  if (method === 'POST') return 'general.create';
  if (method === 'PUT') return 'general.update';
  if (method === 'DELETE') return 'general.delete';
  if (method === 'GET') return 'general.view';
  
  return 'general.view';
}

/**
 * Determine the entity type based on the route path
 */
function getEntityTypeFromRoute(path: string | undefined): string {
  if (!path) return 'general';
  
  if (path.includes('/vendors')) return 'vendor';
  if (path.includes('/integrations')) return 'integration';
  if (path.includes('/tasks')) return 'task';
  if (path.includes('/tests')) return 'test';
  if (path.includes('/scores')) return 'score';
  if (path.includes('/reports')) return 'report';
  if (path.includes('/users')) return 'user';
  if (path.includes('/organizations')) return 'organization';
  if (path.includes('/auth')) return 'user';
  
  return 'general';
}

/**
 * Manual logging function for complex operations that don't fit the middleware pattern
 * Use this for business logic that happens outside of standard CRUD operations
 */
export async function logActivityManually(
  userId: string,
  organizationId: string,
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, any>
) {
  try {
    await db.query(
      'SELECT admin_audit.log_activity_manual($1, $2, $3, $4, $5, $6)',
      [
        userId,
        organizationId,
        action,
        entityType,
        entityId || null,
        JSON.stringify(metadata || {})
      ]
    );
  } catch (error) {
    console.warn('Failed to manually log activity:', error);
  }
}

/**
 * Example usage in your route handlers:
 * 
 * // After creating a vendor
 * await logActivityManually(
 *   req.user.id,
 *   req.organization.id,
 *   'vendor.create',
 *   'vendor',
 *   vendor.id,
 *   {
 *     vendor_name: vendor.name,
 *     vendor_type: vendor.type,
 *     risk_score: vendor.riskScore
 *   }
 * );
 * 
 * // After running a compliance test
 * await logActivityManually(
 *   req.user.id,
 *   req.organization.id,
 *   'test.execute',
 *   'test',
 *   test.id,
 *   {
 *     test_name: test.name,
 *     test_type: 'compliance',
 *     result: testResult.status,
 *     passed_checks: testResult.passedChecks,
 *     total_checks: testResult.totalChecks
 *   }
 * );
 */

// ============================================================================
// INTEGRATION INSTRUCTIONS
// ============================================================================
//
// 1. Copy this file to: src/middleware/audit-logger.ts
//
// 2. Apply the middleware to your routes in app.ts or server.ts:
//
//    import { auditLogger } from './middleware/audit-logger';
//
//    // Apply to routes that need auditing
//    app.use('/api/vendors', authenticateToken, auditLogger, vendorRoutes);
//    app.use('/api/integrations', authenticateToken, auditLogger, integrationRoutes);
//    app.use('/api/tasks', authenticateToken, auditLogger, taskRoutes);
//    app.use('/api/tests', authenticateToken, auditLogger, testRoutes);
//    app.use('/api/auth', auditLogger, authRoutes);
//
// 3. For complex operations, use the manual logging function:
//
//    import { logActivityManually } from './middleware/audit-logger';
//
//    await logActivityManually(userId, orgId, 'custom.action', 'entity', id, metadata);
//
// 4. Restart your server and start using your app normally!
//
// ============================================================================
