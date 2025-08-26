# 🔍 **Dsalta Database Activity Analysis**

## ✅ **Auto-Refresh Added:**
- **✅ Dashboard**: Refreshes every **10 seconds**
- **✅ Activities Page**: Refreshes every **15 seconds**

Your portal now shows real-time updates automatically!

---

## 📊 **Database Table Analysis (99 tables total)**

### **🔥 High-Priority Activity Tables** (Most active with real data):

| Table | Rows | Key Activity Types |
|-------|------|-------------------|
| **`users`** | 133 | Login, Registration, Profile Updates |
| **`VendorAPI`** | 210 | Security Scans, Score Updates |
| **`Task`** | 37,284 | Task Creation, Status Updates, Assignments |
| **`TestCase`** | 25 | Test Execution, Security Reviews |
| **`IntegrationConnection`** | 0* | Integration Connects, SSO Setup |
| **`Organization`** | 55 | Org Settings, Company Updates |
| **`Vendor`** | 33 | Vendor Management, Contracts |
| **`SecurityLog`** | 648 | Security Events, Access Logs |

*\*No current data but important for tracking*

---

## 🎯 **Complete Activity Tracking Strategy**

### **1. User Authentication & Management**
```sql
-- Users table tracking
'user.login'         -- When user logs in
'user.logout'        -- When user logs out  
'user.register'      -- New user registration
'user.profile_update' -- Profile changes
'user.password_change' -- Password updates
'user.email_verify'  -- Email verification
```

### **2. Vendor & Security Management**
```sql
-- VendorAPI table tracking  
'vendor.scan_start'   -- Security scan initiated
'vendor.scan_complete' -- Scan finished
'vendor.score_update' -- Risk score changed
'vendor.grade_change' -- Security grade updated

-- Vendor table tracking
'vendor.create'      -- New vendor added
'vendor.update'      -- Vendor details updated
'vendor.contract_sign' -- Contract signed
'vendor.review_start' -- Security review started
'vendor.archive'     -- Vendor archived
```

### **3. Task & Compliance Management**
```sql
-- Task table tracking (37K+ records!)
'task.create'        -- New compliance task
'task.assign'        -- Task assigned to user
'task.status_change' -- Status updated
'task.evidence_upload' -- Evidence provided
'task.complete'      -- Task completed
'task.overdue'       -- Task past due

-- TestCase table tracking
'test.create'        -- New test case
'test.execute'       -- Test run
'test.pass'          -- Test passed
'test.fail'          -- Test failed
'test.schedule'      -- Test scheduled
```

### **4. Integration & System Events**
```sql
-- IntegrationConnection table
'integration.connect'    -- New integration
'integration.test'       -- Integration tested  
'integration.disconnect' -- Integration removed
'integration.sso_enable' -- SSO activated

-- Organization table  
'org.settings_update'    -- Org settings changed
'org.profile_update'     -- Company profile updated
'org.member_invite'      -- User invited
'org.member_remove'      -- User removed
```

### **5. Document & Policy Management**
```sql
-- DocumentAuditResult table
'document.upload'        -- Document uploaded
'document.review'        -- Document reviewed
'document.approve'       -- Document approved
'document.audit'         -- Audit completed

-- PolicyApproval table  
'policy.create'          -- Policy created
'policy.approve'         -- Policy approved
'policy.reject'          -- Policy rejected
'policy.update'          -- Policy updated
```

---

## 🚀 **Implementation for Your Main Dsalta App**

### **Quick Integration (Copy this to your main app):**

```javascript
// utils/activityLogger.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function logActivity(userId, action, entityType, entityId, entityName, metadata = {}, req = null) {
  try {
    // Add contextual metadata
    const enrichedMetadata = {
      ...metadata,
      timestamp: new Date().toISOString(),
      user_agent_parsed: parseUserAgent(req?.headers['user-agent']),
      session_id: req?.sessionID,
      referrer: req?.headers.referer
    };

    await pool.query(`
      INSERT INTO public.activity_log (
        user_id, action, entity_type, entity_id, entity_name, 
        metadata, ip, user_agent, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `, [
      userId,
      action,
      entityType, 
      entityId,
      entityName,
      JSON.stringify(enrichedMetadata),
      getClientIP(req),
      req?.headers['user-agent']
    ]);
  } catch (error) {
    console.warn('Activity logging failed:', error);
  }
}

function getClientIP(req) {
  return req?.ip || 
         req?.connection?.remoteAddress || 
         req?.headers['x-forwarded-for']?.split(',')[0] ||
         'unknown';
}

function parseUserAgent(userAgent) {
  if (!userAgent) return { browser: 'Unknown', device: 'Unknown' };
  
  // Simple parsing - you can use a library like 'ua-parser-js'
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
  const browser = userAgent.includes('Chrome') ? 'Chrome' :
                  userAgent.includes('Firefox') ? 'Firefox' :
                  userAgent.includes('Safari') ? 'Safari' : 'Unknown';
  
  return {
    browser,
    device: isMobile ? 'Mobile' : 'Desktop',
    os: userAgent.includes('Windows') ? 'Windows' :
        userAgent.includes('Mac') ? 'macOS' : 
        userAgent.includes('Linux') ? 'Linux' : 'Unknown'
  };
}

module.exports = { logActivity };
```

### **Usage Examples for Your Main App:**

```javascript
const { logActivity } = require('./utils/activityLogger');

// 1. User Login (in your auth controller)
app.post('/auth/login', async (req, res) => {
  try {
    const user = await authenticateUser(req.body.email, req.body.password);
    
    // Update user's last login
    await db.query(
      'UPDATE public.users SET "lastLoginAt" = NOW() WHERE id = $1',
      [user.id]
    );
    
    // Log the activity
    await logActivity(
      user.id,
      'user.login',
      'user',
      user.id,
      `${user.firstName} ${user.lastName}`,
      { 
        login_method: 'password',
        success: true,
        auth_provider: user.authProvider
      },
      req
    );
    
    res.json({ success: true, user });
  } catch (error) {
    // Log failed login attempt
    await logActivity(
      null,
      'user.login_failed',
      'user',
      null,
      req.body.email,
      { 
        reason: error.message,
        success: false 
      },
      req
    );
    res.status(401).json({ error: 'Login failed' });
  }
});

// 2. Vendor Security Scan
app.post('/vendors/:id/scan', async (req, res) => {
  const vendor = await getVendor(req.params.id);
  
  await logActivity(
    req.user.id,
    'vendor.scan_start',
    'vendor',
    vendor.id,
    vendor.name,
    { 
      scan_type: 'security',
      initiated_by: req.user.email
    },
    req
  );
  
  // Start scan...
  const result = await startSecurityScan(vendor);
  
  await logActivity(
    req.user.id,
    'vendor.scan_complete',
    'vendor',
    vendor.id,
    vendor.name,
    { 
      scan_id: result.scanId,
      score: result.score,
      grade: result.grade,
      duration_ms: result.duration
    },
    req
  );
});

// 3. Task Management
app.put('/tasks/:id/status', async (req, res) => {
  const task = await getTask(req.params.id);
  const oldStatus = task.status;
  const newStatus = req.body.status;
  
  await updateTaskStatus(req.params.id, newStatus);
  
  await logActivity(
    req.user.id,
    'task.status_change',
    'task',
    task.id,
    task.name,
    { 
      old_status: oldStatus,
      new_status: newStatus,
      framework: task.frameworkId,
      points_earned: task.earned_points
    },
    req
  );
});

// 4. Integration Connection
app.post('/integrations/:id/connect', async (req, res) => {
  const integration = await getIntegration(req.params.id);
  
  await logActivity(
    req.user.id,
    'integration.connect',
    'integration',
    req.params.id,
    integration.name,
    { 
      integration_type: integration.type,
      sso_enabled: req.body.ssoEnabled
    },
    req
  );
});

// 5. Dashboard Page Views
app.get('/dashboard', async (req, res) => {
  const startTime = Date.now();
  
  // Render dashboard...
  
  await logActivity(
    req.user.id,
    'dashboard.view',
    'general',
    null,
    'Main Dashboard',
    { 
      page: 'dashboard',
      load_time_ms: Date.now() - startTime
    },
    req
  );
});
```

---

## 🎯 **Next Steps:**

1. **✅ Test Auto-Refresh**: Your portal now updates every 10-15 seconds automatically!

2. **🔧 Add Logging**: Copy the `activityLogger.js` to your main Dsalta app

3. **📝 Implement Gradually**: Start with login/logout, then add vendor/task activities

4. **🔍 Monitor**: Watch activities appear in real-time in your Admin Portal

5. **📊 Expand**: Add more activity types based on user behavior patterns

---

## 🎉 **Expected Results:**

With this implementation, your Admin Portal will show:

- **Real-time login activities** from different devices/browsers
- **Vendor security scan progress** and results  
- **Task completion patterns** and compliance status
- **Integration usage** and connection events
- **User behavior analytics** and page views
- **Security events** and access patterns

**Your portal will become a complete real-time monitoring dashboard for all Dsalta activities!** 🚀
