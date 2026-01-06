-- Migration: Update vision_statements table for Dreams integration
-- Date: 2026-01-06
-- Purpose: Add Dreams-related columns to vision_statements table
-- Dreams module is now Step 4 within Vision module

-- ============================================================================
-- Step 1: Add Dreams columns to vision_statements
-- ============================================================================

-- Dreams list (main collection of user dreams)
ALTER TABLE public.vision_statements
ADD COLUMN IF NOT EXISTS dreams JSONB DEFAULT '[]'::jsonb;
-- Structure: [{ id: string, dream: string, category: string, priority: number, createdAt: timestamp }]

-- Dreams categorized by life stage (for matrix view)
ALTER TABLE public.vision_statements
ADD COLUMN IF NOT EXISTS dreams_by_life_stage JSONB DEFAULT '{}'::jsonb;
-- Structure: { 'immediate': string[], '1-3years': string[], '5years': string[], '10years+': string[] }

-- Dreams categorized by wellbeing dimension
ALTER TABLE public.vision_statements
ADD COLUMN IF NOT EXISTS dreams_by_wellbeing JSONB DEFAULT '{}'::jsonb;
-- Structure: { 'physical': string[], 'emotional': string[], 'intellectual': string[], 'social': string[], 'spiritual': string[], 'occupational': string[], 'economic': string[] }

-- AI analysis of dreams
ALTER TABLE public.vision_statements
ADD COLUMN IF NOT EXISTS dreams_analysis TEXT;

-- Dreams completion flag (Step 4)
ALTER TABLE public.vision_statements
ADD COLUMN IF NOT EXISTS dreams_completed BOOLEAN DEFAULT FALSE;

-- Update current_step constraint to include step 4 (dreams)
-- First, drop the existing constraint
ALTER TABLE public.vision_statements
DROP CONSTRAINT IF EXISTS vision_statements_current_step_check;

-- Add new constraint with 5 steps (0-4)
-- 0: time-horizon, 1: future-imagery, 2: core-aspirations, 3: dreams-matrix, 4: vision-statement
ALTER TABLE public.vision_statements
ADD CONSTRAINT vision_statements_current_step_check
CHECK (current_step >= 0 AND current_step <= 5);

-- ============================================================================
-- Step 2: Migrate existing Dreams data (if dreams table exists)
-- ============================================================================

-- Check if dreams-related tables exist and migrate data
DO $$
BEGIN
  -- Check if there's a dreams_sessions or similar table
  -- If so, migrate data to vision_statements

  -- This is a placeholder - actual migration depends on existing dreams schema
  -- The migration should:
  -- 1. Find users with dreams data
  -- 2. Update their vision_statements with the dreams array
  -- 3. Categorize dreams by life stage and wellbeing

  RAISE NOTICE 'Dreams migration: Check for existing dreams data to migrate';
END $$;

-- ============================================================================
-- Step 3: Create helper functions for dreams management
-- ============================================================================

-- Function to add a dream to user's vision
CREATE OR REPLACE FUNCTION add_dream_to_vision(
  p_user_id UUID,
  p_dream TEXT,
  p_category TEXT DEFAULT 'general',
  p_life_stage TEXT DEFAULT '1-3years',
  p_wellbeing_dimension TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_dream_obj JSONB;
  v_new_dreams JSONB;
BEGIN
  -- Create dream object
  v_dream_obj := jsonb_build_object(
    'id', gen_random_uuid()::TEXT,
    'dream', p_dream,
    'category', p_category,
    'lifeStage', p_life_stage,
    'wellbeingDimension', p_wellbeing_dimension,
    'createdAt', NOW()
  );

  -- Add dream to dreams array
  UPDATE public.vision_statements
  SET
    dreams = COALESCE(dreams, '[]'::jsonb) || v_dream_obj,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING dreams INTO v_new_dreams;

  RETURN v_dream_obj;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION add_dream_to_vision(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Function to categorize dreams by life stage
CREATE OR REPLACE FUNCTION categorize_dreams_by_life_stage(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_dreams JSONB;
  v_categorized JSONB;
BEGIN
  SELECT dreams INTO v_dreams
  FROM public.vision_statements
  WHERE user_id = p_user_id;

  IF v_dreams IS NULL OR jsonb_array_length(v_dreams) = 0 THEN
    RETURN '{}'::jsonb;
  END IF;

  -- Categorize by life stage
  v_categorized := jsonb_build_object(
    'immediate', (
      SELECT jsonb_agg(d->>'dream')
      FROM jsonb_array_elements(v_dreams) d
      WHERE d->>'lifeStage' = 'immediate'
    ),
    '1-3years', (
      SELECT jsonb_agg(d->>'dream')
      FROM jsonb_array_elements(v_dreams) d
      WHERE d->>'lifeStage' = '1-3years'
    ),
    '5years', (
      SELECT jsonb_agg(d->>'dream')
      FROM jsonb_array_elements(v_dreams) d
      WHERE d->>'lifeStage' = '5years'
    ),
    '10years+', (
      SELECT jsonb_agg(d->>'dream')
      FROM jsonb_array_elements(v_dreams) d
      WHERE d->>'lifeStage' = '10years+'
    )
  );

  -- Update the table
  UPDATE public.vision_statements
  SET
    dreams_by_life_stage = v_categorized,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_categorized;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION categorize_dreams_by_life_stage(UUID) TO authenticated;

-- ============================================================================
-- Step 4: Update comments
-- ============================================================================

COMMENT ON COLUMN public.vision_statements.dreams IS
  'Array of user dreams with category, life stage, and wellbeing dimension';

COMMENT ON COLUMN public.vision_statements.dreams_by_life_stage IS
  'Dreams categorized by time horizon: immediate, 1-3years, 5years, 10years+';

COMMENT ON COLUMN public.vision_statements.dreams_by_wellbeing IS
  'Dreams categorized by wellbeing dimension (7 dimensions)';

COMMENT ON COLUMN public.vision_statements.dreams_analysis IS
  'AI-generated analysis of user dreams and their connection to values/strengths';

COMMENT ON COLUMN public.vision_statements.dreams_completed IS
  'Whether user has completed the Dreams step (Step 4 of Vision module)';
