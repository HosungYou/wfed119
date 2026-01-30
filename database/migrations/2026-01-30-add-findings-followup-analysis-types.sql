-- Migration: Add 'findings' and 'followup' to life_themes_analysis types
-- Date: 2026-01-30
-- Purpose: Allow new analysis types for the redesigned Life Themes workflow
-- Issue: INSERT was failing because 'findings' and 'followup' were not in the CHECK constraint

-- ============================================================================
-- Update CHECK constraint to include new analysis types
-- ============================================================================

-- First, drop the existing constraint
ALTER TABLE public.life_themes_analysis
DROP CONSTRAINT IF EXISTS life_themes_analysis_analysis_type_check;

-- Add the updated constraint with new types
ALTER TABLE public.life_themes_analysis
ADD CONSTRAINT life_themes_analysis_analysis_type_check
CHECK (analysis_type IN (
  'pattern_summary',    -- Summary of all patterns
  'theme_suggestion',   -- AI suggested themes
  'enneagram_insight',  -- Enneagram connection analysis
  'career_implication', -- Career/life direction insights
  'final_synthesis',    -- Final comprehensive analysis
  'findings',           -- NEW: Theme + story mapping from findings page
  'followup'            -- NEW: Follow-up reflection questions
));

-- ============================================================================
-- Update current_step constraint to include 'findings' and 'followup'
-- ============================================================================

-- First, drop the existing constraint
ALTER TABLE public.life_themes_sessions
DROP CONSTRAINT IF EXISTS life_themes_sessions_current_step_check;

-- Add the updated constraint with new steps
ALTER TABLE public.life_themes_sessions
ADD CONSTRAINT life_themes_sessions_current_step_check
CHECK (current_step IN (
  'role_models', 'media', 'hobbies', 'mottos', 'subjects', 'memories',
  'patterns', 'themes', 'results',
  'findings',   -- NEW: Findings page step
  'followup'    -- NEW: Follow-up page step
));

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON COLUMN public.life_themes_analysis.analysis_type IS
'Type of analysis: pattern_summary, theme_suggestion, enneagram_insight, career_implication, final_synthesis, findings, followup';
