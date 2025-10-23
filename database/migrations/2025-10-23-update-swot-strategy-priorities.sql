-- Migration: Update SWOT Analysis for Strategy Prioritization
-- Date: 2025-10-23
-- Purpose: Update strategy_priorities structure to support Impact/Feasibility scoring

-- ============================================================================
-- Update swot_analyses table
-- ============================================================================

-- Update current_stage constraint to include new stages
ALTER TABLE public.swot_analyses DROP CONSTRAINT IF EXISTS swot_analyses_current_stage_check;

ALTER TABLE public.swot_analyses ADD CONSTRAINT swot_analyses_current_stage_check CHECK (
  current_stage IN ('analysis', 'strategy', 'prioritization', 'reflection', 'completed')
);

-- Add comments for updated stages
COMMENT ON COLUMN public.swot_analyses.current_stage IS 'Current stage: analysis, strategy, prioritization, reflection, completed';

-- Update strategy_priorities structure
-- New format: [
--   {
--     "id": "SO1",
--     "category": "SO",
--     "strategy": "Strategy text...",
--     "impact": 8,
--     "feasibility": 7,
--     "priority_group": "우선 실행"
--   },
--   ...
-- ]

COMMENT ON COLUMN public.swot_analyses.strategy_priorities IS 'Array of strategies with impact (1-10) and feasibility (1-10) scores for prioritization';

-- Add reflection questions field for AI-assisted reflection
ALTER TABLE public.swot_analyses
ADD COLUMN IF NOT EXISTS reflection_questions JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.swot_analyses.reflection_questions IS 'AI-generated questions for reflection guidance';

-- ============================================================================
-- Helper view for strategy prioritization analysis
-- ============================================================================

CREATE OR REPLACE VIEW swot_strategy_priorities_view AS
SELECT
  sa.id AS swot_id,
  sa.user_id,
  jsonb_array_elements(sa.strategy_priorities) AS strategy,
  (jsonb_array_elements(sa.strategy_priorities)->>'impact')::int AS impact,
  (jsonb_array_elements(sa.strategy_priorities)->>'feasibility')::int AS feasibility,
  jsonb_array_elements(sa.strategy_priorities)->>'priority_group' AS priority_group,
  CASE
    WHEN (jsonb_array_elements(sa.strategy_priorities)->>'impact')::int >= 6
     AND (jsonb_array_elements(sa.strategy_priorities)->>'feasibility')::int >= 6
    THEN '우선 실행'
    WHEN (jsonb_array_elements(sa.strategy_priorities)->>'impact')::int < 6
     AND (jsonb_array_elements(sa.strategy_priorities)->>'feasibility')::int >= 6
    THEN '빠른 성과'
    WHEN (jsonb_array_elements(sa.strategy_priorities)->>'impact')::int >= 6
     AND (jsonb_array_elements(sa.strategy_priorities)->>'feasibility')::int < 6
    THEN '계획적 준비'
    ELSE '재검토'
  END AS calculated_priority_group
FROM public.swot_analyses sa
WHERE jsonb_array_length(sa.strategy_priorities) > 0;

COMMENT ON VIEW swot_strategy_priorities_view IS 'Helper view for analyzing strategy priorities with automatic grouping';
