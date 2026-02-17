-- Mission Module Redesign v3.5.0 - Part B Based Restructure
-- Date: 2026-02-17
-- Changes: Remove Life Roles columns, add Mission Component columns, change step range 1-5 -> 1-4

-- ============================================================================
-- Step 1: Drop old Life Roles columns (moved to separate life-roles module)
-- ============================================================================
ALTER TABLE public.mission_sessions DROP COLUMN IF EXISTS life_roles;
ALTER TABLE public.mission_sessions DROP COLUMN IF EXISTS wellbeing_reflections;
ALTER TABLE public.mission_sessions DROP COLUMN IF EXISTS role_commitments;
ALTER TABLE public.mission_sessions DROP COLUMN IF EXISTS wellbeing_commitments;

-- ============================================================================
-- Step 2: Add new Mission Components columns
-- ============================================================================
ALTER TABLE public.mission_sessions ADD COLUMN IF NOT EXISTS top3_mission_values jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.mission_sessions ADD COLUMN IF NOT EXISTS selected_targets jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.mission_sessions ADD COLUMN IF NOT EXISTS selected_verbs jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.mission_sessions ADD COLUMN IF NOT EXISTS custom_targets jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.mission_sessions ADD COLUMN IF NOT EXISTS custom_verbs jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.mission_sessions ADD COLUMN IF NOT EXISTS round1_data jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.mission_sessions ADD COLUMN IF NOT EXISTS round2_data jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.mission_sessions ADD COLUMN IF NOT EXISTS round3_data jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.mission_sessions ADD COLUMN IF NOT EXISTS reflections jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.mission_sessions ADD COLUMN IF NOT EXISTS ai_insights jsonb DEFAULT '{}'::jsonb;

-- ============================================================================
-- Step 3: Update step constraint from 1-5 to 1-4
-- ============================================================================
ALTER TABLE public.mission_sessions DROP CONSTRAINT IF EXISTS mission_sessions_current_step_check;
ALTER TABLE public.mission_sessions ADD CONSTRAINT mission_sessions_current_step_check
  CHECK (current_step BETWEEN 1 AND 4);

-- ============================================================================
-- Step 4: Migrate existing sessions
-- ============================================================================
-- Reset any sessions at step 5 to step 4
UPDATE public.mission_sessions SET current_step = 4 WHERE current_step = 5;
-- Reset any invalid steps for non-completed sessions
UPDATE public.mission_sessions SET current_step = 1 WHERE current_step > 4 AND status != 'completed';
