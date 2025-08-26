-- Create database triggers to automatically capture activities from main Dsalta app

-- Function to get current user context from application
CREATE OR REPLACE FUNCTION admin_audit.get_current_user_context()
RETURNS TABLE(user_id TEXT, tenant_id TEXT, session_id TEXT, request_id TEXT) AS $$
BEGIN
    RETURN QUERY SELECT 
        current_setting('app.current_user_id', true)::TEXT as user_id,
        current_setting('app.current_tenant_id', true)::TEXT as tenant_id,
        current_setting('app.current_session_id', true)::TEXT as session_id,
        current_setting('app.current_request_id', true)::TEXT as request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically log user authentication activities
CREATE OR REPLACE FUNCTION admin_audit.auto_log_user_auth()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id TEXT;
    v_tenant_id TEXT;
    v_session_id TEXT;
    v_request_id TEXT;
BEGIN
    -- Get current context
    SELECT * INTO v_user_id, v_tenant_id, v_session_id, v_request_id 
    FROM admin_audit.get_current_user_context();
    
    -- Log the activity based on the operation
    IF TG_OP = 'INSERT' THEN
        PERFORM admin_audit.log_activity(
            v_user_id,
            v_tenant_id,
            'user.create'::admin_audit.activity_action,
            'user'::admin_audit.entity_type,
            NEW.id,
            jsonb_build_object(
                'email', NEW.email,
                'firstName', NEW."firstName",
                'lastName', NEW."lastName",
                'organizationId', NEW."organizationId"
            ),
            v_session_id,
            v_request_id
        );
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM admin_audit.log_activity(
            v_user_id,
            v_tenant_id,
            'user.update'::admin_audit.activity_action,
            'user'::admin_audit.entity_type,
            NEW.id,
            jsonb_build_object(
                'changed_fields', 'multiple',
                'old_values', to_jsonb(OLD),
                'new_values', to_jsonb(NEW)
            ),
            v_session_id,
            v_request_id
        );
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM admin_audit.log_activity(
            v_user_id,
            v_tenant_id,
            'user.delete'::admin_audit.activity_action,
            'user'::admin_audit.entity_type,
            OLD.id,
            jsonb_build_object(
                'deleted_user_email', OLD.email,
                'deleted_user_name', CONCAT(OLD."firstName", ' ', OLD."lastName")
            ),
            v_session_id,
            v_request_id
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically log vendor activities
CREATE OR REPLACE FUNCTION admin_audit.auto_log_vendor_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id TEXT;
    v_tenant_id TEXT;
    v_session_id TEXT;
    v_request_id TEXT;
BEGIN
    -- Get current context
    SELECT * INTO v_user_id, v_tenant_id, v_session_id, v_request_id 
    FROM admin_audit.get_current_user_context();
    
    -- Log the activity based on the operation
    IF TG_OP = 'INSERT' THEN
        PERFORM admin_audit.log_activity(
            v_user_id,
            v_tenant_id,
            'vendor.create'::admin_audit.activity_action,
            'vendor'::admin_audit.entity_type,
            NEW.id,
            jsonb_build_object(
                'vendor_name', NEW.name,
                'vendor_domain', NEW.domain,
                'tier', NEW.tier,
                'portfolio', NEW.portfolio
            ),
            v_session_id,
            v_request_id
        );
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM admin_audit.log_activity(
            v_user_id,
            v_tenant_id,
            'vendor.update'::admin_audit.activity_action,
            'vendor'::admin_audit.entity_type,
            NEW.id,
            jsonb_build_object(
                'vendor_name', NEW.name,
                'changed_fields', 'multiple',
                'old_values', to_jsonb(OLD),
                'new_values', to_jsonb(NEW)
            ),
            v_session_id,
            v_request_id
        );
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM admin_audit.log_activity(
            v_user_id,
            v_tenant_id,
            'vendor.delete'::admin_audit.activity_action,
            'vendor'::admin_audit.entity_type,
            OLD.id,
            jsonb_build_object(
                'deleted_vendor_name', OLD.name,
                'deleted_vendor_domain', OLD.domain
            ),
            v_session_id,
            v_request_id
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically log integration activities
CREATE OR REPLACE FUNCTION admin_audit.auto_log_integration_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id TEXT;
    v_tenant_id TEXT;
    v_session_id TEXT;
    v_request_id TEXT;
BEGIN
    -- Get current context
    SELECT * INTO v_user_id, v_tenant_id, v_session_id, v_request_id 
    FROM admin_audit.get_current_user_context();
    
    -- Log the activity based on the operation
    IF TG_OP = 'INSERT' THEN
        PERFORM admin_audit.log_activity(
            v_user_id,
            v_tenant_id,
            'integration.connect'::admin_audit.activity_action,
            'integration'::admin_audit.entity_type,
            NEW.id,
            jsonb_build_object(
                'integration_id', NEW."integrationId",
                'organization_id', NEW."organizationId",
                'connection_type', NEW."connectionType"
            ),
            v_session_id,
            v_request_id
        );
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM admin_audit.log_activity(
            v_user_id,
            v_tenant_id,
            'integration.update'::admin_audit.activity_action,
            'integration'::admin_audit.entity_type,
            NEW.id,
            jsonb_build_object(
                'integration_id', NEW."integrationId",
                'changed_fields', 'multiple',
                'old_values', to_jsonb(OLD),
                'new_values', to_jsonb(NEW)
            ),
            v_session_id,
            v_request_id
        );
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM admin_audit.log_activity(
            v_user_id,
            v_tenant_id,
            'integration.disconnect'::admin_audit.activity_action,
            'integration'::admin_audit.entity_type,
            OLD.id,
            jsonb_build_object(
                'disconnected_integration_id', OLD."integrationId",
                'organization_id', OLD."organizationId"
            ),
            v_session_id,
            v_request_id
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically log task activities
CREATE OR REPLACE FUNCTION admin_audit.auto_log_task_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id TEXT;
    v_tenant_id TEXT;
    v_session_id TEXT;
    v_request_id TEXT;
BEGIN
    -- Get current context
    SELECT * INTO v_user_id, v_tenant_id, v_session_id, v_request_id 
    FROM admin_audit.get_current_user_context();
    
    -- Log the activity based on the operation
    IF TG_OP = 'INSERT' THEN
        PERFORM admin_audit.log_activity(
            v_user_id,
            v_tenant_id,
            'task.create'::admin_audit.activity_action,
            'task'::admin_audit.entity_type,
            NEW.id,
            jsonb_build_object(
                'task_name', NEW.name,
                'task_type', NEW.type,
                'priority', NEW.priority,
                'status', NEW.status
            ),
            v_session_id,
            v_request_id
        );
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM admin_audit.log_activity(
            v_user_id,
            v_tenant_id,
            'task.update'::admin_audit.activity_action,
            'task'::admin_audit.entity_type,
            NEW.id,
            jsonb_build_object(
                'task_name', NEW.name,
                'changed_fields', 'multiple',
                'old_values', to_jsonb(OLD),
                'new_values', to_jsonb(NEW)
            ),
            v_session_id,
            v_request_id
        );
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM admin_audit.log_activity(
            v_user_id,
            v_tenant_id,
            'task.delete'::admin_audit.activity_action,
            'task'::admin_audit.entity_type,
            OLD.id,
            jsonb_build_object(
                'deleted_task_name', OLD.name,
                'deleted_task_type', OLD.type
            ),
            v_session_id,
            v_request_id
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically log test activities
CREATE OR REPLACE FUNCTION admin_audit.auto_log_test_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id TEXT;
    v_tenant_id TEXT;
    v_session_id TEXT;
    v_request_id TEXT;
BEGIN
    -- Get current context
    SELECT * INTO v_user_id, v_tenant_id, v_session_id, v_request_id 
    FROM admin_audit.get_current_user_context();
    
    -- Log the activity based on the operation
    IF TG_OP = 'INSERT' THEN
        PERFORM admin_audit.log_activity(
            v_user_id,
            v_tenant_id,
            'test.create'::admin_audit.activity_action,
            'test'::admin_audit.entity_type,
            NEW.id,
            jsonb_build_object(
                'test_name', NEW.name,
                'test_type', NEW.type,
                'integration_id', NEW."integrationId"
            ),
            v_session_id,
            v_request_id
        );
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM admin_audit.log_activity(
            v_user_id,
            v_tenant_id,
            'test.update'::admin_audit.activity_action,
            'test'::admin_audit.entity_type,
            NEW.id,
            jsonb_build_object(
                'test_name', NEW.name,
                'changed_fields', 'multiple',
                'old_values', to_jsonb(OLD),
                'new_values', to_jsonb(NEW)
            ),
            v_session_id,
            v_request_id
        );
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM admin_audit.log_activity(
            v_user_id,
            v_tenant_id,
            'test.delete'::admin_audit.activity_action,
            'test'::admin_audit.entity_type,
            OLD.id,
            jsonb_build_object(
                'deleted_test_name', OLD.name,
                'deleted_test_type', OLD.type
            ),
            v_session_id,
            v_request_id
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers on main Dsalta tables
-- Note: These triggers will only work when the application sets the user context

-- Trigger on users table
CREATE TRIGGER trigger_log_user_activities
    AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW EXECUTE FUNCTION admin_audit.auto_log_user_auth();

-- Trigger on VendorAPI table
CREATE TRIGGER trigger_log_vendor_activities
    AFTER INSERT OR UPDATE OR DELETE ON public."VendorAPI"
    FOR EACH ROW EXECUTE FUNCTION admin_audit.auto_log_vendor_activity();

-- Trigger on IntegrationConnection table
CREATE TRIGGER trigger_log_integration_activities
    AFTER INSERT OR UPDATE OR DELETE ON public."IntegrationConnection"
    FOR EACH ROW EXECUTE FUNCTION admin_audit.auto_log_integration_activity();

-- Trigger on Task table
CREATE TRIGGER trigger_log_task_activities
    AFTER INSERT OR UPDATE OR DELETE ON public."Task"
    FOR EACH ROW EXECUTE FUNCTION admin_audit.auto_log_task_activity();

-- Trigger on TestCase table
CREATE TRIGGER trigger_log_test_activities
    AFTER INSERT OR UPDATE OR DELETE ON public."TestCase"
    FOR EACH ROW EXECUTE FUNCTION admin_audit.auto_log_test_activity();

-- Create a function to manually log activities when context is not available
CREATE OR REPLACE FUNCTION admin_audit.log_activity_manual(
    p_user_id TEXT,
    p_tenant_id TEXT,
    p_action admin_audit.activity_action,
    p_entity_type admin_audit.entity_type,
    p_entity_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
BEGIN
    RETURN admin_audit.log_activity(
        p_user_id,
        p_tenant_id,
        p_action,
        p_entity_type,
        p_entity_id,
        p_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on all functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA admin_audit TO postgres;

-- Create a simple function to test the logging system
CREATE OR REPLACE FUNCTION admin_audit.test_logging()
RETURNS TEXT AS $$
DECLARE
    v_activity_id UUID;
BEGIN
    -- Test logging without context
    v_activity_id := admin_audit.log_activity_manual(
        'test-user-123',
        'test-tenant-456',
        'general.view'::admin_audit.activity_action,
        'general'::admin_audit.entity_type,
        NULL,
        jsonb_build_object('test', true, 'message', 'Testing activity logging system')
    );
    
    RETURN 'Test activity logged with ID: ' || v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on test function
GRANT EXECUTE ON FUNCTION admin_audit.test_logging() TO postgres;
