-- Migration: Migrate existing Dreams data to Vision module
-- Date: 2026-01-06
-- Purpose: Move dreams data from standalone dreams_sessions table to vision_statements
-- This migration is part of the Major Rebase: Dreams → Vision integration

-- ============================================================================
-- Step 1: Check if dreams_sessions table exists and has data
-- ============================================================================

DO $$
DECLARE
  v_dreams_exists BOOLEAN;
  v_user_count INTEGER;
  v_migrated_count INTEGER := 0;
BEGIN
  -- Check if dreams_sessions table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'dreams_sessions'
  ) INTO v_dreams_exists;

  IF NOT v_dreams_exists THEN
    RAISE NOTICE 'dreams_sessions table does not exist. No migration needed.';
    RETURN;
  END IF;

  -- Count users with dreams data
  SELECT COUNT(DISTINCT user_id) INTO v_user_count
  FROM public.dreams_sessions
  WHERE dreams IS NOT NULL AND jsonb_array_length(dreams) > 0;

  RAISE NOTICE 'Found % users with dreams data to migrate', v_user_count;

  -- ============================================================================
  -- Step 2: Migrate dreams data to vision_statements
  -- ============================================================================

  -- For each user with dreams data, update their vision_statements
  -- If they don't have a vision_statements record, create one

  WITH dreams_data AS (
    SELECT DISTINCT ON (user_id)
      user_id,
      dreams,
      dreams_by_category,
      created_at,
      updated_at
    FROM public.dreams_sessions
    WHERE dreams IS NOT NULL AND jsonb_array_length(dreams) > 0
    ORDER BY user_id, updated_at DESC
  ),
  transformed_dreams AS (
    SELECT
      user_id,
      dreams,
      -- Transform dreams_by_category to dreams_by_life_stage format
      jsonb_build_object(
        'immediate', COALESCE(dreams_by_category->'bucket_list', '[]'::jsonb),
        '1-3years', COALESCE(dreams_by_category->'career', '[]'::jsonb),
        '5years', COALESCE(dreams_by_category->'learning', '[]'::jsonb),
        '10years+', COALESCE(dreams_by_category->'experience', '[]'::jsonb)
      ) AS dreams_by_life_stage
    FROM dreams_data
  )
  -- Insert or update vision_statements
  INSERT INTO public.vision_statements (
    user_id,
    dreams,
    dreams_by_life_stage,
    dreams_completed,
    current_step,
    created_at,
    updated_at
  )
  SELECT
    td.user_id,
    td.dreams,
    td.dreams_by_life_stage,
    TRUE, -- Mark dreams as completed if they had dreams data
    0, -- Start at step 0 (time-horizon)
    NOW(),
    NOW()
  FROM transformed_dreams td
  ON CONFLICT (user_id) DO UPDATE
  SET
    dreams = CASE
      WHEN COALESCE(jsonb_array_length(vision_statements.dreams), 0) = 0
      THEN EXCLUDED.dreams
      ELSE vision_statements.dreams
    END,
    dreams_by_life_stage = CASE
      WHEN COALESCE(vision_statements.dreams_by_life_stage, '{}'::jsonb) = '{}'::jsonb
      THEN EXCLUDED.dreams_by_life_stage
      ELSE vision_statements.dreams_by_life_stage
    END,
    dreams_completed = CASE
      WHEN COALESCE(jsonb_array_length(EXCLUDED.dreams), 0) > 0
      THEN TRUE
      ELSE vision_statements.dreams_completed
    END,
    updated_at = NOW();

  GET DIAGNOSTICS v_migrated_count = ROW_COUNT;
  RAISE NOTICE 'Migrated dreams data for % users', v_migrated_count;

  -- ============================================================================
  -- Step 3: Update module_progress for affected users
  -- ============================================================================

  -- Update users who had dreams progress to mark their vision dreams step
  UPDATE public.module_progress
  SET
    current_stage = COALESCE(current_stage, 'dreams-matrix'),
    updated_at = NOW()
  WHERE module_id = 'vision'
    AND user_id IN (
      SELECT DISTINCT user_id
      FROM public.dreams_sessions
      WHERE dreams IS NOT NULL AND jsonb_array_length(dreams) > 0
    );

  -- Remove 'dreams' from module_progress (dreams is now part of vision)
  -- This cleans up any existing progress records for standalone dreams module
  DELETE FROM public.module_progress WHERE module_id = 'dreams';

  RAISE NOTICE 'Migration complete. Cleaned up standalone dreams module progress records.';
END $$;

-- ============================================================================
-- Step 4: Archive dreams_sessions table (optional - keep for reference)
-- ============================================================================

-- Rename old table to archive (don't drop in case rollback needed)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'dreams_sessions'
  ) THEN
    -- Check if archive table doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'dreams_sessions_archive'
    ) THEN
      ALTER TABLE public.dreams_sessions RENAME TO dreams_sessions_archive;
      RAISE NOTICE 'Renamed dreams_sessions to dreams_sessions_archive for reference';
    ELSE
      RAISE NOTICE 'dreams_sessions_archive already exists. Skipping rename.';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- Step 5: Verify migration
-- ============================================================================

DO $$
DECLARE
  v_vision_with_dreams INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_vision_with_dreams
  FROM public.vision_statements
  WHERE dreams IS NOT NULL AND jsonb_array_length(dreams) > 0;

  RAISE NOTICE 'Verification: % users now have dreams in vision_statements', v_vision_with_dreams;
END $$;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.vision_statements IS
  'Vision statements with integrated Dreams (Step 4). Updated 2026-01-06 for Dreams → Vision migration.';
