-- Migration: Update module_progress CHECK constraint to include new modules
-- Date: 2025-12-02
-- Purpose: Add 'life-themes', 'errc', and 'goals' to the allowed module_id values

-- ============================================================================
-- Step 1: Drop the existing CHECK constraint
-- ============================================================================
ALTER TABLE public.module_progress
DROP CONSTRAINT IF EXISTS module_progress_module_id_check;

-- ============================================================================
-- Step 2: Add new CHECK constraint with all modules
-- ============================================================================
ALTER TABLE public.module_progress
ADD CONSTRAINT module_progress_module_id_check CHECK (
  module_id IN (
    'values',
    'strengths',
    'vision',
    'swot',
    'dreams',
    'enneagram',
    'goals',
    'life-themes',
    'errc'
  )
);

-- ============================================================================
-- Step 3: Update the helper function to include new modules
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
      WHEN 'dreams' THEN 8
      WHEN 'errc' THEN 9
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Step 4: Update comments
-- ============================================================================
COMMENT ON COLUMN public.module_progress.module_id IS 'Module identifier: values, strengths, enneagram, life-themes, vision, swot, goals, dreams, errc';
