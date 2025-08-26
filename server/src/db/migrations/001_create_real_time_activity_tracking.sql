-- Create admin_audit schema for real-time activity logging
CREATE SCHEMA IF NOT EXISTS admin_audit;

-- Create activity_action enum with comprehensive coverage
CREATE TYPE admin_audit.activity_action AS ENUM (
    -- User Management
    'user.login',
    'user.logout', 
    'user.create',
    'user.update',
    'user.delete',
    'user.password_reset',
    'user.email_verification',
    
    -- Vendor Management
    'vendor.create',
    'vendor.update',
    'vendor.delete',
    'vendor.view',
    'vendor.score_update',
    'vendor.tier_change',
    'vendor.portfolio_update',
    
    -- Integration Management
    'integration.connect',
    'integration.disconnect',
    'integration.update',
    'integration.test',
    'integration.test_result',
    'integration.credential_update',
    
    -- Task & Test Management
    'task.create',
    'task.update',
    'task.delete',
    'task.assign',
    'task.complete',
    'test.create',
    'test.update',
    'test.execute',
    'test.result',
    
    -- Score & Assessment
    'score.view',
    'score.update',
    'score.calculate',
    'score.export',
    
    -- Report & Analytics
    'report.generate',
    'report.export',
    'report.view',
    'report.schedule',
    
    -- Organization & Settings
    'organization.create',
    'organization.update',
    'organization.settings_update',
    'organization.member_add',
    'organization.member_remove',
    'organization.member_role_change',
    
    -- Security & Compliance
    'security.login_failed',
    'security.access_denied',
    'security.permission_change',
    'security.audit_log',
    'compliance.check',
    'compliance.violation',
    
    -- General Activities
    'general.view',
    'general.search',
    'general.export',
    'general.import',
    'general.sync'
);

-- Create entity_type enum
CREATE TYPE admin_audit.entity_type AS ENUM (
    'user',
    'vendor',
    'integration',
    'task',
    'test',
    'score',
    'report',
    'organization',
    'settings',
    'security',
    'compliance',
    'general'
);

-- Create activity_log table with enhanced structure
CREATE TABLE admin_audit.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    tenant_id TEXT,
    action admin_audit.activity_action NOT NULL,
    entity_type admin_audit.entity_type NOT NULL,
    entity_id TEXT,
    metadata JSONB,
    ip INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Enhanced fields for better tracking
    session_id TEXT,
    request_id TEXT,
    response_status INTEGER,
    duration_ms INTEGER,
    error_message TEXT
);

-- Create comprehensive indexes for performance
CREATE INDEX idx_activity_log_created_at ON admin_audit.activity_log(created_at DESC);
CREATE INDEX idx_activity_log_user_id ON admin_audit.activity_log(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_activity_log_tenant_id ON admin_audit.activity_log(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_activity_log_action ON admin_audit.activity_log(action);
CREATE INDEX idx_activity_log_entity_type ON admin_audit.activity_log(entity_type);
CREATE INDEX idx_activity_log_entity_id ON admin_audit.activity_log(entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX idx_activity_log_composite ON admin_audit.activity_log(tenant_id, created_at DESC, action);
CREATE INDEX idx_activity_log_session ON admin_audit.activity_log(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_activity_log_request ON admin_audit.activity_log(request_id) WHERE request_id IS NOT NULL;

-- Create view that joins with user and organization details
CREATE VIEW admin_audit.activity_log_detailed AS
SELECT 
    al.*,
    u.email as user_email,
    CONCAT(u."firstName", ' ', u."lastName") as user_name,
    o.name as organization_name,
    CASE 
        WHEN al.entity_type = 'vendor' THEN v.name
        WHEN al.entity_type = 'integration' THEN ic.id::text
        WHEN al.entity_type = 'task' THEN t.name
        WHEN al.entity_type = 'test' THEN tc.name
        ELSE al.entity_id
    END as entity_name
FROM admin_audit.activity_log al
LEFT JOIN public.users u ON al.user_id = u.id
LEFT JOIN public."Organization" o ON al.tenant_id = o.id
LEFT JOIN public."VendorAPI" v ON al.entity_type = 'vendor' AND al.entity_id = v.id
LEFT JOIN public."IntegrationConnection" ic ON al.entity_type = 'integration' AND al.entity_id = ic.id
LEFT JOIN public."Task" t ON al.entity_type = 'task' AND al.entity_id = t.id
LEFT JOIN public."TestCase" tc ON al.entity_type = 'test' AND al.entity_id = tc.id;

-- Create function to log activities with enhanced context
CREATE OR REPLACE FUNCTION admin_audit.log_activity(
    p_user_id TEXT,
    p_tenant_id TEXT,
    p_action admin_audit.activity_action,
    p_entity_type admin_audit.entity_type,
    p_entity_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}',
    p_session_id TEXT DEFAULT NULL,
    p_request_id TEXT DEFAULT NULL,
    p_response_status INTEGER DEFAULT NULL,
    p_duration_ms INTEGER DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_activity_id UUID;
    v_client_ip INET;
    v_user_agent TEXT;
BEGIN
    -- Get client IP and user agent from current session
    v_client_ip := COALESCE(
        inet_client_addr(),
        inet_in('127.0.0.1')
    );
    
    v_user_agent := COALESCE(
        current_setting('app.current_user_agent', true),
        current_setting('app.user_agent', true),
        'Unknown'
    );
    
    -- Insert the activity
    INSERT INTO admin_audit.activity_log (
        user_id, tenant_id, action, entity_type, entity_id,
        metadata, ip, user_agent, created_at,
        session_id, request_id, response_status, duration_ms, error_message
    ) VALUES (
        p_user_id, p_tenant_id, p_action, p_entity_type, p_entity_id,
        p_metadata, v_client_ip, v_user_agent, NOW(),
        p_session_id, p_request_id, p_response_status, p_duration_ms, p_error_message
    ) RETURNING id INTO v_activity_id;
    
    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log user authentication activities
CREATE OR REPLACE FUNCTION admin_audit.log_user_auth(
    p_user_id TEXT,
    p_tenant_id TEXT,
    p_action admin_audit.activity_action,
    p_success BOOLEAN DEFAULT true,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
BEGIN
    RETURN admin_audit.log_activity(
        p_user_id,
        p_tenant_id,
        p_action,
        'user'::admin_audit.entity_type,
        p_user_id,
        p_metadata || jsonb_build_object('success', p_success)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log integration activities
CREATE OR REPLACE FUNCTION admin_audit.log_integration_activity(
    p_user_id TEXT,
    p_tenant_id TEXT,
    p_action admin_audit.activity_action,
    p_integration_id TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
BEGIN
    RETURN admin_audit.log_activity(
        p_user_id,
        p_tenant_id,
        p_action,
        'integration'::admin_audit.entity_type,
        p_integration_id,
        p_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log vendor activities
CREATE OR REPLACE FUNCTION admin_audit.log_vendor_activity(
    p_user_id TEXT,
    p_tenant_id TEXT,
    p_action admin_audit.activity_action,
    p_vendor_id TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
BEGIN
    RETURN admin_audit.log_activity(
        p_user_id,
        p_tenant_id,
        p_action,
        'vendor'::admin_audit.entity_type,
        p_vendor_id,
        p_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log task activities
CREATE OR REPLACE FUNCTION admin_audit.log_task_activity(
    p_user_id TEXT,
    p_tenant_id TEXT,
    p_action admin_audit.activity_action,
    p_task_id TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
BEGIN
    RETURN admin_audit.log_activity(
        p_user_id,
        p_tenant_id,
        p_action,
        'task'::admin_audit.entity_type,
        p_task_id,
        p_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log test activities
CREATE OR REPLACE FUNCTION admin_audit.log_test_activity(
    p_user_id TEXT,
    p_tenant_id TEXT,
    p_action admin_audit.activity_action,
    p_test_id TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
BEGIN
    RETURN admin_audit.log_activity(
        p_user_id,
        p_tenant_id,
        p_action,
        'test'::admin_audit.entity_type,
        p_test_id,
        p_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log score activities
CREATE OR REPLACE FUNCTION admin_audit.log_score_activity(
    p_user_id TEXT,
    p_tenant_id TEXT,
    p_action admin_audit.activity_action,
    p_score_id TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
BEGIN
    RETURN admin_audit.log_activity(
        p_user_id,
        p_tenant_id,
        p_action,
        'score'::admin_audit.entity_type,
        p_score_id,
        p_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log report activities
CREATE OR REPLACE FUNCTION admin_audit.log_report_activity(
    p_user_id TEXT,
    p_tenant_id TEXT,
    p_action admin_audit.activity_action,
    p_report_id TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
BEGIN
    RETURN admin_audit.log_activity(
        p_user_id,
        p_tenant_id,
        p_action,
        'report'::admin_audit.entity_type,
        p_report_id,
        p_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log general activities
CREATE OR REPLACE FUNCTION admin_audit.log_general_activity(
    p_user_id TEXT,
    p_tenant_id TEXT,
    p_action admin_audit.activity_action,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
BEGIN
    RETURN admin_audit.log_activity(
        p_user_id,
        p_tenant_id,
        p_action,
        'general'::admin_audit.entity_type,
        NULL,
        p_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to the admin portal user
GRANT USAGE ON SCHEMA admin_audit TO postgres;
GRANT SELECT, INSERT ON admin_audit.activity_log TO postgres;
GRANT SELECT ON admin_audit.activity_log_detailed TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA admin_audit TO postgres;

-- Create a function to get current user context (to be called from your main app)
CREATE OR REPLACE FUNCTION admin_audit.set_current_user_context(
    p_user_id TEXT,
    p_tenant_id TEXT,
    p_session_id TEXT DEFAULT NULL,
    p_request_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Set session variables for the current transaction
    PERFORM set_config('app.current_user_id', p_user_id, false);
    PERFORM set_config('app.current_tenant_id', p_tenant_id, false);
    PERFORM set_config('app.current_session_id', COALESCE(p_session_id, gen_random_uuid()::text), false);
    PERFORM set_config('app.current_request_id', COALESCE(p_request_id, gen_random_uuid()::text), false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to log activities with automatic context
CREATE OR REPLACE FUNCTION admin_audit.log_activity_auto(
    p_action admin_audit.activity_action,
    p_entity_type admin_audit.entity_type,
    p_entity_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_user_id TEXT;
    v_tenant_id TEXT;
    v_session_id TEXT;
    v_request_id TEXT;
BEGIN
    -- Get current context from session variables
    v_user_id := current_setting('app.current_user_id', true);
    v_tenant_id := current_setting('app.current_tenant_id', true);
    v_session_id := current_setting('app.current_session_id', true);
    v_request_id := current_setting('app.current_request_id', true);
    
    -- Log the activity
    RETURN admin_audit.log_activity(
        v_user_id,
        v_tenant_id,
        p_action,
        p_entity_type,
        p_entity_id,
        p_metadata,
        v_session_id,
        v_request_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migration record will be inserted automatically by the migration runner
