-- Migration: Add duration_months to goal_setting_sessions
-- Date: 2026-01-06
-- Purpose: Support selectable goal horizon (3/6/12 months)

ALTER TABLE public.goal_setting_sessions
ADD COLUMN IF NOT EXISTS duration_months INTEGER NOT NULL DEFAULT 6
CHECK (duration_months IN (3, 6, 12));

COMMENT ON COLUMN public.goal_setting_sessions.duration_months IS 'Goal horizon in months (3, 6, or 12).';
