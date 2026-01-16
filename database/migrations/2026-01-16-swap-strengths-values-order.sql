-- Migration: Swap Strengths and Values Module Order
-- Date: 2026-01-16
-- Purpose: Change module order from Values->Strengths to Strengths->Values
-- Changes:
--   - Strengths is now module 1 (was 2)
--   - Values is now module 2 (was 1)
--   - Update CHECK constraint to include mission and career-options
--   - Update get_user_module_summary function with new order
--   - Update check_module_prerequisites function with new order

-- ============================================================================
-- Step 1: Update module_id CHECK constraint to include all 10 modules
-- ============================================================================

-- Drop existing constraint
ALTER TABLE public.module_progress
DROP CONSTRAINT IF EXISTS module_progress_module_id_check;

-- Add new constraint with all 10 modules
ALTER TABLE public.module_progress
ADD CONSTRAINT module_progress_module_id_check CHECK (
  module_id IN (
    'strengths',      -- 1: Part 1 - Self-Discovery (moved first)
    'values',         -- 2: Part 1 - Self-Discovery (moved second)
    'enneagram',      -- 3: Part 1 - Self-Discovery
    'life-themes',    -- 4: Part 1 - Self-Discovery
    'vision',         -- 5: Part 2 - Vision & Mission
    'mission',        -- 6: Part 2 - Mission Statement
    'career-options', -- 7: Part 2 - Career Options
    'swot',           -- 8: Part 3 - Strategic Analysis
    'goals',          -- 9: Part 4 - Goal Setting
    'errc'            -- 10: Part 4 - Action Optimization
  )
);

-- ============================================================================
-- Step 2: Update get_user_module_summary function with new order
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_module_summary(p_user_id UUID)
RETURNS TABLE (
  module_id TEXT,
  status TEXT,
  completion_percentage INTEGER,
  current_stage TEXT,
  completed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mp.module_id,
    mp.status,
    mp.completion_percentage,
    mp.current_stage,
    mp.completed_at
  FROM public.module_progress mp
  WHERE mp.user_id = p_user_id
  ORDER BY
    CASE mp.module_id
      WHEN 'strengths' THEN 1      -- Changed: was values
      WHEN 'values' THEN 2         -- Changed: was strengths
      WHEN 'enneagram' THEN 3
      WHEN 'life-themes' THEN 4
      WHEN 'vision' THEN 5
      WHEN 'mission' THEN 6        -- Added
      WHEN 'career-options' THEN 7 -- Added
      WHEN 'swot' THEN 8
      WHEN 'goals' THEN 9
      WHEN 'errc' THEN 10
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Step 3: Update check_module_prerequisites function with new order
-- ============================================================================

CREATE OR REPLACE FUNCTION check_module_prerequisites(
  p_user_id UUID,
  p_module_id TEXT
)
RETURNS TABLE (
  can_start BOOLEAN,
  missing_prerequisites TEXT[]
) AS $$
DECLARE
  v_module_index INTEGER;
  v_required_modules TEXT[];
  v_completed_modules TEXT[];
  v_missing TEXT[];
BEGIN
  -- Get module index (NEW ORDER: strengths first, values second)
  v_module_index := CASE p_module_id
    WHEN 'strengths' THEN 1      -- Changed: was values
    WHEN 'values' THEN 2         -- Changed: was strengths
    WHEN 'enneagram' THEN 3
    WHEN 'life-themes' THEN 4
    WHEN 'vision' THEN 5
    WHEN 'mission' THEN 6        -- Added
    WHEN 'career-options' THEN 7 -- Added
    WHEN 'swot' THEN 8
    WHEN 'goals' THEN 9
    WHEN 'errc' THEN 10
    ELSE 0
  END;

  -- First module has no prerequisites
  IF v_module_index <= 1 THEN
    RETURN QUERY SELECT TRUE, ARRAY[]::TEXT[];
    RETURN;
  END IF;

  -- Get required modules (all modules before this one)
  -- NEW ORDER: strengths, values, enneagram, life-themes, vision, mission, career-options, swot, goals, errc
  v_required_modules := CASE v_module_index
    WHEN 2 THEN ARRAY['strengths']
    WHEN 3 THEN ARRAY['strengths', 'values']
    WHEN 4 THEN ARRAY['strengths', 'values', 'enneagram']
    WHEN 5 THEN ARRAY['strengths', 'values', 'enneagram', 'life-themes']
    WHEN 6 THEN ARRAY['strengths', 'values', 'enneagram', 'life-themes', 'vision']
    WHEN 7 THEN ARRAY['strengths', 'values', 'enneagram', 'life-themes', 'vision', 'mission']
    WHEN 8 THEN ARRAY['strengths', 'values', 'enneagram', 'life-themes', 'vision', 'mission', 'career-options']
    WHEN 9 THEN ARRAY['strengths', 'values', 'enneagram', 'life-themes', 'vision', 'mission', 'career-options', 'swot']
    WHEN 10 THEN ARRAY['strengths', 'values', 'enneagram', 'life-themes', 'vision', 'mission', 'career-options', 'swot', 'goals']
    ELSE ARRAY[]::TEXT[]
  END;

  -- Get completed modules for user
  v_completed_modules := ARRAY(
    SELECT mp.module_id
    FROM public.module_progress mp
    WHERE mp.user_id = p_user_id AND mp.status = 'completed'
  );

  -- Find missing prerequisites
  v_missing := ARRAY(
    SELECT m FROM unnest(v_required_modules) AS m
    WHERE m != ALL(v_completed_modules)
  );

  RETURN QUERY SELECT
    array_length(v_missing, 1) IS NULL OR array_length(v_missing, 1) = 0,
    COALESCE(v_missing, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_module_prerequisites(UUID, TEXT) TO authenticated;

-- ============================================================================
-- Step 4: Update comments
-- ============================================================================

COMMENT ON COLUMN public.module_progress.module_id IS
  'Module identifier (linear order): strengths, values, enneagram, life-themes, vision, mission, career-options, swot, goals, errc';

COMMENT ON FUNCTION get_user_module_summary(UUID) IS
  'Get module progress summary for a user, ordered by module sequence (strengths first, values second)';

COMMENT ON FUNCTION check_module_prerequisites(UUID, TEXT) IS
  'Check if user can start a module based on linear progression (all previous modules must be completed). New order: strengths -> values -> ...';
