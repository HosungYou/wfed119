-- Migration: Create module_progress table for cross-module tracking
-- Date: 2025-11-25
-- Purpose: Track user progress across LifeCraft modules with dependency chain support
-- Dependencies: Values → Strengths → Vision → SWOT → Dreams

-- ============================================================================
-- Table: module_progress
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Module identification
  module_id TEXT NOT NULL CHECK (
    module_id IN ('values', 'strengths', 'vision', 'swot', 'dreams', 'enneagram')
  ),

  -- Progress tracking
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (
    status IN ('not_started', 'in_progress', 'completed')
  ),
  current_stage TEXT,
  completion_percentage INTEGER DEFAULT 0 CHECK (
    completion_percentage >= 0 AND completion_percentage <= 100
  ),

  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata for additional tracking info
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT module_progress_user_module_unique UNIQUE (user_id, module_id)
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_module_progress_user_id
  ON public.module_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_module_progress_module_id
  ON public.module_progress(module_id);

CREATE INDEX IF NOT EXISTS idx_module_progress_status
  ON public.module_progress(status);

CREATE INDEX IF NOT EXISTS idx_module_progress_user_status
  ON public.module_progress(user_id, status);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view their own module progress"
  ON public.module_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own progress records
CREATE POLICY "Users can create their own module progress"
  ON public.module_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update their own module progress"
  ON public.module_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own progress
CREATE POLICY "Users can delete their own module progress"
  ON public.module_progress FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Trigger for updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_module_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  -- Set started_at on first status change to in_progress
  IF NEW.status = 'in_progress' AND OLD.status = 'not_started' THEN
    NEW.started_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_module_progress_updated_at ON public.module_progress;
CREATE TRIGGER set_module_progress_updated_at
  BEFORE UPDATE ON public.module_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_module_progress_updated_at();

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE public.module_progress IS 'Tracks user progress across LifeCraft modules';
COMMENT ON COLUMN public.module_progress.module_id IS 'Module identifier: values, strengths, vision, swot, dreams, enneagram';
COMMENT ON COLUMN public.module_progress.status IS 'Progress status: not_started, in_progress, completed';
COMMENT ON COLUMN public.module_progress.current_stage IS 'Current stage within the module';
COMMENT ON COLUMN public.module_progress.completion_percentage IS 'Estimated completion percentage (0-100)';
COMMENT ON COLUMN public.module_progress.metadata IS 'Additional tracking data in JSON format';

-- ============================================================================
-- Helper Function: Get user module summary
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
      WHEN 'vision' THEN 3
      WHEN 'swot' THEN 4
      WHEN 'dreams' THEN 5
      WHEN 'enneagram' THEN 6
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_module_summary(UUID) TO authenticated;
