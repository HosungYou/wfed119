-- ============================================================================
-- Admin User Management for WFED119 (Supabase)
-- ============================================================================
-- This script provides SQL commands for managing admin users in Supabase
-- Run these commands in Supabase SQL Editor
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROMOTE EXISTING USER TO ADMIN
-- ----------------------------------------------------------------------------
-- Use this to promote a user who has already logged in via Google OAuth
-- Replace 'user@example.com' with the actual user email

-- Promote to ADMIN
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'user@example.com';

-- Promote to SUPER_ADMIN (highest level)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"super_admin"'
)
WHERE email = 'user@example.com';

-- ----------------------------------------------------------------------------
-- 2. CHECK USER ROLES
-- ----------------------------------------------------------------------------
-- View all users with their current roles
SELECT
  id,
  email,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'role' as role,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- View only admin users
SELECT
  id,
  email,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'role' as role,
  last_sign_in_at
FROM auth.users
WHERE raw_user_meta_data->>'role' IN ('admin', 'super_admin')
ORDER BY created_at DESC;

-- ----------------------------------------------------------------------------
-- 3. DEMOTE USER (REMOVE ADMIN PRIVILEGES)
-- ----------------------------------------------------------------------------
-- Demote user back to regular USER role
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"user"'
)
WHERE email = 'user@example.com';

-- Completely remove role field (defaults to 'user')
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'role'
WHERE email = 'user@example.com';

-- ----------------------------------------------------------------------------
-- 4. BATCH PROMOTE MULTIPLE USERS
-- ----------------------------------------------------------------------------
-- Promote multiple users at once (modify the email list)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email IN (
  'admin1@example.com',
  'admin2@example.com',
  'collaborator@example.com'
);

-- ----------------------------------------------------------------------------
-- 5. SETUP ADMIN FROM ENVIRONMENT VARIABLE
-- ----------------------------------------------------------------------------
-- If you have ADMIN_EMAILS environment variable in Supabase dashboard,
-- you can use this function to auto-setup admins on first login

-- Create function to check and set admin role on login
CREATE OR REPLACE FUNCTION public.handle_admin_setup()
RETURNS TRIGGER AS $$
DECLARE
  admin_emails TEXT;
BEGIN
  -- Get admin emails from environment (set in Supabase dashboard)
  admin_emails := current_setting('app.admin_emails', true);

  IF admin_emails IS NOT NULL AND NEW.email = ANY(string_to_array(admin_emails, ',')) THEN
    NEW.raw_user_meta_data := jsonb_set(
      COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
      '{role}',
      '"admin"'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run on user creation
DROP TRIGGER IF EXISTS on_auth_user_created_admin_setup ON auth.users;
CREATE TRIGGER on_auth_user_created_admin_setup
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_admin_setup();

-- Note: To set admin emails in Supabase Dashboard:
-- Settings > Database > Configuration > Custom Postgres Config
-- Add: app.admin_emails = 'admin@example.com,owner@example.com'

-- ----------------------------------------------------------------------------
-- 6. AUDIT LOG FOR ADMIN ACTIONS
-- ----------------------------------------------------------------------------
-- View admin action history (if audit_logs table exists)
SELECT
  al.action,
  al.performed_by,
  u.email as admin_email,
  al.target_user_id,
  al.details,
  al.created_at
FROM audit_logs al
LEFT JOIN auth.users u ON u.id = al.performed_by
WHERE al.action LIKE '%ADMIN%'
ORDER BY al.created_at DESC
LIMIT 50;

-- ----------------------------------------------------------------------------
-- 7. USEFUL QUERIES
-- ----------------------------------------------------------------------------

-- Count users by role
SELECT
  COALESCE(raw_user_meta_data->>'role', 'user') as role,
  COUNT(*) as count
FROM auth.users
GROUP BY raw_user_meta_data->>'role';

-- Find users without a role set (defaults to 'user')
SELECT
  id,
  email,
  raw_user_meta_data->>'name' as name,
  created_at
FROM auth.users
WHERE raw_user_meta_data->>'role' IS NULL;

-- Recent admin logins
SELECT
  email,
  raw_user_meta_data->>'role' as role,
  last_sign_in_at,
  sign_in_count
FROM auth.users
WHERE raw_user_meta_data->>'role' IN ('admin', 'super_admin')
ORDER BY last_sign_in_at DESC;

-- ============================================================================
-- QUICK REFERENCE
-- ============================================================================
--
-- Common email addresses for this project:
-- - Project Owner: newhosung@gmail.com
-- - Add your collaborators here
--
-- Usage:
-- 1. Open Supabase Dashboard > SQL Editor
-- 2. Copy the relevant section above
-- 3. Replace 'user@example.com' with actual email
-- 4. Execute the query
--
-- ============================================================================