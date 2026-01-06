-- Migration: Update module_progress for Major Rebase
-- Date: 2026-01-06
-- Purpose: Update module_progress to support 8-module linear progression
-- Changes:
--   - Remove 'dreams' as standalone module (integrated into Vision)
--   - Add 'life-themes', 'goals', 'errc' modules
--   - Update module ordering for linear progression

-- ============================================================================
-- Step 1: Delete 'dreams' module progress records FIRST (before constraint)
-- ============================================================================

-- IMPORTANT: Must delete 'dreams' rows BEFORE adding the new constraint
-- Otherwise the constraint will fail with "violated by some row" error

-- Delete 'dreams' module_progress records
DELETE FROM public.module_progress WHERE module_id = 'dreams';

-- Verify deletion
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.module_progress WHERE module_id = 'dreams';
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Failed to delete dreams records. % records remaining.', v_count;
  END IF;
  RAISE NOTICE 'Successfully deleted all dreams module_progress records.';
END $$;

-- ============================================================================
-- Step 2: Update module_id CHECK constraint
-- ============================================================================

-- Drop existing constraint
ALTER TABLE public.module_progress
DROP CONSTRAINT IF EXISTS module_progress_module_id_check;

-- Add new constraint with 8 modules (linear order)
ALTER TABLE public.module_progress
ADD CONSTRAINT module_progress_module_id_check CHECK (
  module_id IN (
    'values',       -- 1: Part 1 - Self-Discovery
    'strengths',    -- 2: Part 1 - Self-Discovery
    'enneagram',    -- 3: Part 1 - Self-Discovery
    'life-themes',  -- 4: Part 1 - Self-Discovery
    'vision',       -- 5: Part 2 - Vision & Mission (includes Dreams)
    'swot',         -- 6: Part 3 - Strategic Analysis
    'goals',        -- 7: Part 4 - Goal Setting
    'errc'          -- 8: Part 4 - Action Optimization
  )
);

-- ============================================================================
-- Step 3: Update helper function with new module ordering
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
      WHEN 'values' THEN 1
      WHEN 'strengths' THEN 2
      WHEN 'enneagram' THEN 3
      WHEN 'life-themes' THEN 4
      WHEN 'vision' THEN 5
      WHEN 'swot' THEN 6
      WHEN 'goals' THEN 7
      WHEN 'errc' THEN 8
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Step 4: Create function to check linear progression prerequisites
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
  -- Get module index
  v_module_index := CASE p_module_id
    WHEN 'values' THEN 1
    WHEN 'strengths' THEN 2
    WHEN 'enneagram' THEN 3
    WHEN 'life-themes' THEN 4
    WHEN 'vision' THEN 5
    WHEN 'swot' THEN 6
    WHEN 'goals' THEN 7
    WHEN 'errc' THEN 8
    ELSE 0
  END;

  -- First module has no prerequisites
  IF v_module_index <= 1 THEN
    RETURN QUERY SELECT TRUE, ARRAY[]::TEXT[];
    RETURN;
  END IF;

  -- Get required modules (all modules before this one)
  -- Use simple CASE-based approach instead of WITH ORDINALITY for compatibility
  v_required_modules := CASE v_module_index
    WHEN 2 THEN ARRAY['values']
    WHEN 3 THEN ARRAY['values', 'strengths']
    WHEN 4 THEN ARRAY['values', 'strengths', 'enneagram']
    WHEN 5 THEN ARRAY['values', 'strengths', 'enneagram', 'life-themes']
    WHEN 6 THEN ARRAY['values', 'strengths', 'enneagram', 'life-themes', 'vision']
    WHEN 7 THEN ARRAY['values', 'strengths', 'enneagram', 'life-themes', 'vision', 'swot']
    WHEN 8 THEN ARRAY['values', 'strengths', 'enneagram', 'life-themes', 'vision', 'swot', 'goals']
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
-- Step 5: Update comments
-- ============================================================================

COMMENT ON COLUMN public.module_progress.module_id IS
  'Module identifier (linear order): values, strengths, enneagram, life-themes, vision, swot, goals, errc';

COMMENT ON FUNCTION check_module_prerequisites(UUID, TEXT) IS
  'Check if user can start a module based on linear progression (all previous modules must be completed)';
