-- Migration: Create user_integrated_profiles table
-- Date: 2026-01-06
-- Purpose: Store aggregated data from all modules for cross-module insights and dashboard display

-- ============================================================================
-- Table: user_integrated_profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_integrated_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- ========================================
  -- Part 1: Self-Discovery Summary
  -- ========================================

  -- Values Module
  top_values JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ type: 'terminal'|'instrumental'|'work', name: string, description: string }]

  -- Strengths Module
  top_strengths JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ category: 'skills'|'attitudes'|'values', name: string, evidence: string }]

  -- Enneagram Module
  enneagram_type INTEGER CHECK (enneagram_type >= 1 AND enneagram_type <= 9),
  enneagram_wing INTEGER CHECK (enneagram_wing >= 1 AND enneagram_wing <= 9),
  enneagram_instinct TEXT CHECK (enneagram_instinct IN ('sp', 'so', 'sx')),
  enneagram_confidence TEXT CHECK (enneagram_confidence IN ('high', 'medium', 'low')),

  -- Life Themes Module
  life_themes JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ theme: string, description: string, rank: number, patterns: string[] }]

  -- ========================================
  -- Part 2: Vision & Mission Summary
  -- ========================================

  mission_statement TEXT,
  vision_statement TEXT,
  time_horizon TEXT CHECK (time_horizon IN ('3-year', '5-year', '10-year')),

  -- Integrated Dreams (from Vision module)
  dreams JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ dream: string, category: string, lifeStage: string, wellbeingDimension: string }]

  core_aspirations JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ aspiration: string, type: string }]

  -- ========================================
  -- Part 3: Strategic Analysis Summary
  -- ========================================

  swot_summary JSONB DEFAULT '{}'::jsonb,
  -- Structure: { strengths: string[], weaknesses: string[], opportunities: string[], threats: string[] }

  priority_strategies JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ strategy: string, type: 'SO'|'WO'|'ST'|'WT', impact: number, feasibility: number }]

  -- ========================================
  -- Part 4: Goals & Actions Summary
  -- ========================================

  life_roles JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ role: string, allocation: number, objectives: string[] }]

  key_objectives JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ objective: string, role: string, keyResults: string[] }]

  errc_actions JSONB DEFAULT '{}'::jsonb,
  -- Structure: { eliminate: string[], reduce: string[], raise: string[], create: string[] }

  wellbeing_scores JSONB DEFAULT '{}'::jsonb,
  -- Structure: { physical: number, emotional: number, intellectual: number, social: number, spiritual: number, occupational: number, economic: number }

  -- ========================================
  -- AI-Generated Insights
  -- ========================================

  ai_career_insights TEXT,
  ai_strength_patterns TEXT,
  ai_value_alignment TEXT,
  ai_recommended_actions JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ action: string, priority: 'high'|'medium'|'low', relatedModules: string[] }]

  ai_personality_summary TEXT,
  ai_growth_areas JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ area: string, suggestion: string }]

  -- ========================================
  -- Metadata
  -- ========================================

  last_ai_analysis_at TIMESTAMPTZ,
  modules_completed JSONB DEFAULT '[]'::jsonb,
  -- Structure: ['values', 'strengths', ...]

  profile_completeness INTEGER DEFAULT 0 CHECK (profile_completeness >= 0 AND profile_completeness <= 100),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- ========================================
  -- Constraints
  -- ========================================

  CONSTRAINT user_integrated_profiles_user_unique UNIQUE (user_id)
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_integrated_profiles_user_id
  ON public.user_integrated_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_integrated_profiles_completeness
  ON public.user_integrated_profiles(profile_completeness);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.user_integrated_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view their own integrated profile"
  ON public.user_integrated_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own profile
CREATE POLICY "Users can create their own integrated profile"
  ON public.user_integrated_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own integrated profile"
  ON public.user_integrated_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Trigger for updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_integrated_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_integrated_profiles_updated_at ON public.user_integrated_profiles;
CREATE TRIGGER set_user_integrated_profiles_updated_at
  BEFORE UPDATE ON public.user_integrated_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_integrated_profiles_updated_at();

-- ============================================================================
-- Function: Calculate profile completeness
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_profile_completeness(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_completed_count INTEGER;
  v_total_modules INTEGER := 8;
BEGIN
  SELECT COUNT(*)
  INTO v_completed_count
  FROM public.module_progress
  WHERE user_id = p_user_id AND status = 'completed';

  RETURN ROUND((v_completed_count::DECIMAL / v_total_modules) * 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function: Sync profile after module completion
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_integrated_profile_on_module_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Update or create integrated profile
    INSERT INTO public.user_integrated_profiles (user_id, modules_completed, profile_completeness)
    VALUES (
      NEW.user_id,
      jsonb_build_array(NEW.module_id),
      calculate_profile_completeness(NEW.user_id)
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
      modules_completed = (
        SELECT jsonb_agg(DISTINCT m)
        FROM jsonb_array_elements_text(
          COALESCE(user_integrated_profiles.modules_completed, '[]'::jsonb) || jsonb_build_array(NEW.module_id)
        ) AS m
      ),
      profile_completeness = calculate_profile_completeness(NEW.user_id),
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync profile on module completion
DROP TRIGGER IF EXISTS sync_profile_on_module_complete ON public.module_progress;
CREATE TRIGGER sync_profile_on_module_complete
  AFTER INSERT OR UPDATE ON public.module_progress
  FOR EACH ROW
  EXECUTE FUNCTION sync_integrated_profile_on_module_complete();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.user_integrated_profiles IS
  'Aggregated user profile data from all LifeCraft modules for cross-module insights';

COMMENT ON COLUMN public.user_integrated_profiles.top_values IS
  'Top 9 values from Values module (3 terminal, 3 instrumental, 3 work)';

COMMENT ON COLUMN public.user_integrated_profiles.top_strengths IS
  'Top strengths from Strengths module AI conversation';

COMMENT ON COLUMN public.user_integrated_profiles.life_themes IS
  'Discovered life themes from Career Construction Interview';

COMMENT ON COLUMN public.user_integrated_profiles.ai_career_insights IS
  'AI-generated career insights based on all completed modules';

COMMENT ON COLUMN public.user_integrated_profiles.profile_completeness IS
  'Percentage of modules completed (0-100)';
