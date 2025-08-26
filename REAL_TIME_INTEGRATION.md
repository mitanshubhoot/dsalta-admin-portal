# 🚀 Real-Time Activity Tracking Integration

## ✅ **What's Working Now:**

Your Admin Portal now shows **real-time activities** from a dedicated `activity_log` table. Here's what you'll see:

### **📊 New Activity Types:**
- **User Login**: `"Mehmet Kule logged into the system from Desktop using Chrome"`
- **Vendor Search**: `"User searched vendors for 'security' (25 results)"`
- **Dashboard View**: `"User viewed Main Dashboard (45 seconds)"`
- **Integration Actions**: `"Connected integration: GCP Cloud"`
- **Task Management**: `"Created task: Security Assessment"`

---

## 🎯 **To Track ALL Activities from Your Main Dsalta App:**

### **Option 1: Simple Database Logging (5 minutes)**

Add this function to your main Dsalta app and call it whenever you want to log an activity:

```javascript
// Add to your main Dsalta app (e.g., utils/activityLogger.js)
const { Pool } = require('pg');

// Use your existing database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function logActivity(userId, action, entityType, entityId, entityName, metadata = {}, req = null) {
  try {
    await pool.query(`
      INSERT INTO public.activity_log (
        user_id, action, entity_type, entity_id, entity_name, metadata, ip, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      userId,
      action,
      entityType, 
      entityId,
      entityName,
      JSON.stringify(metadata),
      req?.ip || req?.connection?.remoteAddress,
      req?.headers['user-agent']
    ]);
  } catch (error) {
    console.warn('Failed to log activity:', error);
  }
}

module.exports = { logActivity };
```

### **Usage Examples:**

```javascript
const { logActivity } = require('./utils/activityLogger');

// When user logs in
app.post('/auth/login', async (req, res) => {
  // ... your login logic ...
  
  await logActivity(
    user.id,
    'user.login',
    'user',
    user.id,
    `${user.firstName} ${user.lastName}`,
    { 
      browser: getBrowser(req.headers['user-agent']),
      device: getDevice(req.headers['user-agent']),
      success: true 
    },
    req
  );
});

// When user searches vendors
app.get('/vendors/search', async (req, res) => {
  const { q } = req.query;
  const results = await searchVendors(q);
  
  await logActivity(
    req.user.id,
    'vendor.search',
    'vendor',
    null,
    'Vendor Search',
    { 
      search_term: q,
      results_count: results.length 
    },
    req
  );
});

// When user views dashboard
app.get('/dashboard', async (req, res) => {
  await logActivity(
    req.user.id,
    'dashboard.view',
    'general',
    null,
    'Main Dashboard',
    { page: 'dashboard' },
    req
  );
});

// When user connects integration
app.post('/integrations/:id/connect', async (req, res) => {
  await logActivity(
    req.user.id,
    'integration.connect',
    'integration',
    req.params.id,
    integration.name,
    { integration_type: integration.type },
    req
  );
});
```

---

## 🔄 **Option 2: Automatic Middleware (10 minutes)**

Add this middleware to automatically log all API calls:

```javascript
// middleware/activityLogger.js
const { logActivity } = require('../utils/activityLogger');

function activityLoggerMiddleware(req, res, next) {
  // Skip logging for health checks, assets, etc.
  if (req.path.includes('/health') || req.path.includes('/assets')) {
    return next();
  }

  const originalSend = res.send;
  res.send = function(data) {
    // Log activity after response is sent
    if (req.user && res.statusCode < 400) {
      const action = getActionFromRoute(req.path, req.method);
      const entityType = getEntityFromRoute(req.path);
      
      logActivity(
        req.user.id,
        action,
        entityType,
        req.params.id,
        getEntityName(req, res),
        {
          method: req.method,
          path: req.path,
          status: res.statusCode
        },
        req
      ).catch(console.error);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}

function getActionFromRoute(path, method) {
  if (path.includes('/login')) return 'user.login';
  if (path.includes('/vendors') && method === 'POST') return 'vendor.create';
  if (path.includes('/vendors') && method === 'GET') return 'vendor.search';
  if (path.includes('/dashboard')) return 'dashboard.view';
  if (path.includes('/integrations') && method === 'POST') return 'integration.connect';
  
  // Default mapping
  return `${getEntityFromRoute(path)}.${method.toLowerCase()}`;
}

function getEntityFromRoute(path) {
  if (path.includes('/vendors')) return 'vendor';
  if (path.includes('/users')) return 'user';
  if (path.includes('/integrations')) return 'integration';
  if (path.includes('/tasks')) return 'task';
  if (path.includes('/tests')) return 'test';
  return 'general';
}

module.exports = activityLoggerMiddleware;
```

Apply to your app:
```javascript
// app.js
const activityLoggerMiddleware = require('./middleware/activityLogger');

app.use(activityLoggerMiddleware);
```

---

## 🎯 **Next Steps:**

1. **Test the Portal**: Refresh `http://localhost:3000/activities` - you should see the sample activities
2. **Add Logging**: Choose Option 1 or 2 above and add to your main Dsalta app
3. **Test Real Activities**: Use your main Dsalta app and watch activities appear in real-time!

## 📋 **Common Activity Types to Track:**

```javascript
// Authentication
'user.login', 'user.logout', 'user.register'

// Vendor Management  
'vendor.create', 'vendor.update', 'vendor.delete', 'vendor.search', 'vendor.view'

// Integrations
'integration.connect', 'integration.test', 'integration.disconnect'

// Tasks & Tests
'task.create', 'task.assign', 'task.complete'
'test.execute', 'test.schedule', 'test.view'

// Reports & Dashboard
'report.generate', 'report.export', 'dashboard.view'

// Compliance & Security
'compliance.scan', 'security.review', 'audit.start'
```

---

## ✅ **Benefits:**

- **Real-time Monitoring**: See what users are doing instantly
- **Detailed Context**: Rich metadata about each action  
- **User Behavior**: Track login patterns, feature usage
- **Security Auditing**: Monitor suspicious activities
- **Performance Insights**: See what features are used most

Your Admin Portal will now show **every activity** happening in your Dsalta app! 🎉
