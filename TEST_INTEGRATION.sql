-- ============================================================================
-- TEST INTEGRATION SCRIPT FOR ADMIN ACTIVITY PORTAL
-- ============================================================================
-- 
-- Run this script in your main Dsalta app's database to test activity logging
-- This will create test activities that should appear in your Admin Portal
--
-- ============================================================================

-- Test 1: Set user context and log a simple activity
SELECT admin_audit.set_current_user_context(
  'test-user-123',
  'test-org-456',
  'test-session-789',
  'test-request-abc'
);

-- Test 2: Log a user login activity
SELECT admin_audit.log_activity_auto(
  'user.login',
  'user',
  'test-user-123',
  '{"ip": "192.168.1.100", "user_agent": "Mozilla/5.0 (Test Browser)", "success": true}'
);

-- Test 3: Log a vendor creation activity
SELECT admin_audit.log_activity_auto(
  'vendor.create',
  'vendor',
  'test-vendor-001',
  '{"vendor_name": "Test Corp", "vendor_type": "technology", "risk_level": "medium"}'
);

-- Test 4: Log an integration connection
SELECT admin_audit.log_activity_auto(
  'integration.connect',
  'integration',
  'test-integration-001',
  '{"integration_name": "Test Service", "provider": "Test Provider", "status": "connected"}'
);

-- Test 5: Log a task creation
SELECT admin_audit.log_activity_auto(
  'task.create',
  'task',
  'test-task-001',
  '{"task_name": "Test Task", "priority": "high", "assigned_to": "test-user-123"}'
);

-- Test 6: Log a test execution
SELECT admin_audit.log_activity_auto(
  'test.execute',
  'test',
  'test-test-001',
  '{"test_name": "Security Scan", "test_type": "compliance", "result": "passed", "checks_passed": 15, "total_checks": 15}'
);

-- Test 7: Log a score calculation
SELECT admin_audit.log_activity_auto(
  'score.calculate',
  'score',
  'test-score-001',
  '{"entity_type": "vendor", "entity_id": "test-vendor-001", "old_score": 75, "new_score": 82, "change_reason": "Updated assessment"}'
);

-- Test 8: Log a report generation
SELECT admin_audit.log_activity_auto(
  'report.generate',
  'report',
  'test-report-001',
  '{"report_type": "compliance_summary", "format": "pdf", "pages": 25, "generated_by": "test-user-123"}'
);

-- Test 9: Log a general search activity
SELECT admin_audit.log_activity_auto(
  'general.search',
  'general',
  NULL,
  '{"search_query": "security compliance", "results_count": 42, "search_type": "global"}'
);

-- Test 10: Log a failed login attempt
SELECT admin_audit.log_activity_auto(
  'security.login_failed',
  'security',
  NULL,
  '{"attempt_email": "hacker@malicious.com", "ip": "192.168.1.200", "user_agent": "Suspicious Bot", "reason": "Invalid credentials"}'
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- 
-- After running the tests above, run these queries to verify activities were logged:
--

-- Check total activities
SELECT COUNT(*) as total_activities FROM admin_audit.activity_log;

-- Check activities by type
SELECT action, COUNT(*) as count 
FROM admin_audit.activity_log 
GROUP BY action 
ORDER BY count DESC;

-- Check recent activities
SELECT 
  action,
  entity_type,
  entity_id,
  metadata,
  created_at
FROM admin_audit.activity_log 
ORDER BY created_at DESC 
LIMIT 10;

-- Check activities by entity type
SELECT 
  entity_type,
  COUNT(*) as count
FROM admin_audit.activity_log 
GROUP BY entity_type 
ORDER BY count DESC;

-- ============================================================================
-- EXPECTED RESULTS
-- ============================================================================
--
-- After running this script, you should see:
-- - 10 new activities in your Admin Portal
-- - Activities appearing in real-time
-- - Dashboard statistics updated
-- - Recent activity feed populated
--
-- If you see these activities, your integration is working perfectly!
-- ============================================================================
