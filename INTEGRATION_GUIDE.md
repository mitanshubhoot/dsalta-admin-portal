# Admin Activity Portal - Real-Time Integration Guide

## 🎯 **What This Portal Does**

The Admin Activity Portal automatically captures and displays **real-time activities** from your main Dsalta application, including:
- User logins/logouts
- Vendor creation/updates
- Integration connections
- Task management
- Test executions
- Score calculations
- Report generation
- And much more!

## 🔗 **How to Integrate with Your Main Dsalta App**

### **Step 1: Add Database Functions to Main App**

Add these functions to your main Dsalta app's database layer:

```sql
-- Call this function before any user operation to set context
SELECT admin_audit.set_current_user_context(
  'user-123',           -- Current user ID
  'org-456',            -- Current tenant/organization ID
  'session-789',        -- Session ID (optional)
  'request-abc'         -- Request ID (optional)
);

-- Call this function after operations to log activities
SELECT admin_audit.log_activity_auto(
  'user.login',         -- Action type
  'user',               -- Entity type
  'user-123',           -- Entity ID (optional)
  '{"ip": "192.168.1.1", "user_agent": "Mozilla/5.0..."}' -- Metadata
);
```

### **Step 2: Add Logging to Your Express/Node.js Routes**

Add this middleware to your main Dsalta app:

```typescript
// middleware/audit-logger.ts
import { Request, Response, NextFunction } from 'express';
import { db } from '../db/client';

export async function auditLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Set user context for this request
  if (req.user && req.organization) {
    await db.query(
      'SELECT admin_audit.set_current_user_context($1, $2, $3, $4)',
      [
        req.user.id,
        req.organization.id,
        req.sessionID || null,
        req.headers['x-request-id'] || null
      ]
    );
  }
  
  // Capture response details
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // Log the activity
    if (req.user && req.organization) {
      const action = getActionFromRoute(req.route?.path, req.method);
      const entityType = getEntityTypeFromRoute(req.route?.path);
      const entityId = req.params.id || null;
      
      db.query(
        'SELECT admin_audit.log_activity($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
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
            user_agent: req.headers['user-agent']
          }),
          req.ip,
          req.headers['user-agent'],
          new Date(),
          req.sessionID || null,
          req.headers['x-request-id'] || null,
          res.statusCode,
          duration,
          null // error_message
        ]
      ).catch(console.error);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}

function getActionFromRoute(path: string, method: string): string {
  if (path.includes('/auth/login')) return 'user.login';
  if (path.includes('/auth/logout')) return 'user.logout';
  if (path.includes('/vendors') && method === 'POST') return 'vendor.create';
  if (path.includes('/vendors') && method === 'PUT') return 'vendor.update';
  if (path.includes('/integrations') && method === 'POST') return 'integration.connect';
  if (path.includes('/tasks') && method === 'POST') return 'task.create';
  if (path.includes('/tests') && method === 'POST') return 'test.execute';
  return 'general.view';
}

function getEntityTypeFromRoute(path: string): string {
  if (path.includes('/vendors')) return 'vendor';
  if (path.includes('/integrations')) return 'integration';
  if (path.includes('/tasks')) return 'task';
  if (path.includes('/tests')) return 'test';
  if (path.includes('/users')) return 'user';
  return 'general';
}
```

### **Step 3: Apply Middleware to Your Routes**

```typescript
// app.ts or server.ts
import { auditLogger } from './middleware/audit-logger';

// Apply to all routes that need auditing
app.use('/api/vendors', authenticateToken, auditLogger, vendorRoutes);
app.use('/api/integrations', authenticateToken, auditLogger, integrationRoutes);
app.use('/api/tasks', authenticateToken, auditLogger, taskRoutes);
app.use('/api/tests', authenticateToken, auditLogger, testRoutes);
app.use('/api/auth', auditLogger, authRoutes);
```

### **Step 4: Manual Logging for Complex Operations**

For complex operations that don't fit the middleware pattern:

```typescript
// After successful vendor creation
await db.query(
  'SELECT admin_audit.log_activity_manual($1, $2, $3, $4, $5, $6)',
  [
    req.user.id,
    req.organization.id,
    'vendor.create',
    'vendor',
    vendor.id,
    JSON.stringify({
      vendor_name: vendor.name,
      vendor_type: vendor.type,
      created_by: req.user.email
    })
  ]
);

// After integration test execution
await db.query(
  'SELECT admin_audit.log_activity_manual($1, $2, $3, $4, $5, $6)',
  [
    req.user.id,
    req.organization.id,
    'test.execute',
    'test',
    test.id,
    JSON.stringify({
      test_name: test.name,
      test_result: result.status,
      execution_time: result.duration,
      passed_checks: result.passedChecks,
      total_checks: result.totalChecks
    })
  ]
);
```

## 🎯 **What Activities Will Be Captured**

### **User Management:**
- Login/logout attempts
- Password changes
- Profile updates
- Role changes

### **Vendor Management:**
- Vendor creation/updates
- Score calculations
- Tier changes
- Portfolio updates

### **Integration Management:**
- Connection/disconnection
- Credential updates
- Test executions
- Test results

### **Task Management:**
- Task creation/assignment
- Status updates
- Completion
- Time tracking

### **Compliance & Security:**
- Failed login attempts
- Access violations
- Permission changes
- Audit log access

## 🚀 **Quick Start Integration**

### **Option 1: Automatic (Recommended)**
Add the `auditLogger` middleware to your existing routes - it will automatically capture most activities.

### **Option 2: Manual**
Call the logging functions manually after important operations for complete control.

### **Option 3: Hybrid**
Use middleware for common operations and manual logging for complex business logic.

## 🔍 **Testing the Integration**

1. **Add the middleware** to your main Dsalta app
2. **Perform actions** (login, create vendor, etc.)
3. **Check Admin Portal** - activities should appear in real-time!
4. **Monitor the logs** for any errors

## 📊 **Expected Results**

After integration, your Admin Portal will show:
- **Real-time activity feed** from your main app
- **Accurate statistics** reflecting actual usage
- **Complete audit trail** for compliance
- **Live monitoring** of your entire platform

## 🎉 **Benefits**

- **Zero fake data** - everything is real-time
- **Automatic capture** - no manual logging needed
- **Complete visibility** - see everything happening in your app
- **Compliance ready** - full audit trail for regulations
- **Performance insights** - track user behavior and system usage

**Start using your Dsalta app normally - every action will be automatically tracked and visible in the portal!**

## 🔧 **Troubleshooting**

### **Activities Not Appearing?**
1. Check if middleware is applied to correct routes
2. Verify database connection to admin_audit schema
3. Check server logs for SQL errors
4. Ensure user context is being set

### **Performance Issues?**
1. Logging is asynchronous - won't slow down your app
2. Database triggers are lightweight
3. Consider batching for high-volume operations

### **Need Custom Actions?**
1. Add new action types to the `activity_action` enum
2. Create custom logging functions
3. Extend the middleware for specific use cases

**Your Admin Portal is now a real-time monitoring powerhouse!** 🚀
