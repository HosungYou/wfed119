-- WFED119 Database Initialization Script
-- Creates initial database structure and configuration

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create initial database user roles
DO $$
BEGIN
    -- Create application roles
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'wfed119_app') THEN
        CREATE ROLE wfed119_app LOGIN PASSWORD 'app_user_password';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'wfed119_readonly') THEN
        CREATE ROLE wfed119_readonly LOGIN PASSWORD 'readonly_password';
    END IF;
    
    -- Create student and educator roles for RLS
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'student_role') THEN
        CREATE ROLE student_role;
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'educator_role') THEN
        CREATE ROLE educator_role;
    END IF;
END
$$;

-- Grant basic permissions
GRANT CONNECT ON DATABASE wfed119 TO wfed119_app;
GRANT CONNECT ON DATABASE wfed119 TO wfed119_readonly;

-- Create schema for application data
CREATE SCHEMA IF NOT EXISTS wfed119_data;
GRANT USAGE ON SCHEMA wfed119_data TO wfed119_app;
GRANT USAGE ON SCHEMA wfed119_data TO wfed119_readonly;

-- Set default search path
ALTER DATABASE wfed119 SET search_path TO wfed119_data, public;

-- Create initial audit log table
CREATE TABLE IF NOT EXISTS wfed119_data.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(64) NOT NULL,
    operation VARCHAR(10) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create function for audit logging
CREATE OR REPLACE FUNCTION wfed119_data.audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO wfed119_data.audit_log (table_name, operation, old_values, user_id)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), current_setting('app.current_user_id', true)::UUID);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO wfed119_data.audit_log (table_name, operation, old_values, new_values, user_id)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW), current_setting('app.current_user_id', true)::UUID);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO wfed119_data.audit_log (table_name, operation, new_values, user_id)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(NEW), current_setting('app.current_user_id', true)::UUID);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION wfed119_data.audit_trigger_func() IS 'Audit trigger function for tracking data changes';

-- Message confirming successful initialization
DO $$
BEGIN
    RAISE NOTICE 'WFED119 database initialized successfully!';
    RAISE NOTICE 'Available services:';
    RAISE NOTICE '  - PostgreSQL: localhost:5432';
    RAISE NOTICE '  - Qdrant: localhost:6333 (Web UI: localhost:6334)';
    RAISE NOTICE '  - Redis: localhost:6379';
    RAISE NOTICE '  - pgAdmin: localhost:8080 (if using --profile admin)';
END
$$;