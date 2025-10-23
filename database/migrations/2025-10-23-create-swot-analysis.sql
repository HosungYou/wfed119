-- Migration: Create SWOT Analysis, Goals, and ERRC tables
-- Date: 2025-10-23
-- Purpose: Store user SWOT analysis, strategic goals, and ERRC action plans

-- ============================================================================
-- Table 1: swot_analyses (Main SWOT Analysis)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.swot_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vision_statement_id UUID REFERENCES public.vision_statements(id) ON DELETE SET NULL,

  -- Vision/Goal for this SWOT
  vision_or_goal TEXT NOT NULL,

  -- SWOT Elements (each minimum 4 items)
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  opportunities JSONB DEFAULT '[]'::jsonb,
  threats JSONB DEFAULT '[]'::jsonb,

  -- Strategy Matrix (SO, WO, ST, WT combinations)
  so_strategies JSONB DEFAULT '[]'::jsonb,  -- Strengths-Opportunities
  wo_strategies JSONB DEFAULT '[]'::jsonb,  -- Weaknesses-Opportunities
  st_strategies JSONB DEFAULT '[]'::jsonb,  -- Strengths-Threats
  wt_strategies JSONB DEFAULT '[]'::jsonb,  -- Weaknesses-Threats

  -- Strategy Prioritization
  -- Format: { strategy_id: { impact: 'high'|'medium'|'low', difficulty: 'high'|'medium'|'low' } }
  strategy_priorities JSONB DEFAULT '{}'::jsonb,

  -- Reflection (200-300 words)
  reflection TEXT,

  -- Progress tracking
  current_stage TEXT NOT NULL DEFAULT 'discovery',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT swot_analyses_user_id_unique UNIQUE (user_id),
  CONSTRAINT swot_analyses_current_stage_check CHECK (
    current_stage IN ('discovery', 'strategy', 'goals', 'action', 'reflection', 'completed')
  )
);

-- ============================================================================
-- Table 2: swot_goals (Goal Setting - 7 goals)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.swot_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swot_analysis_id UUID NOT NULL REFERENCES public.swot_analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Goal identification
  goal_number INTEGER NOT NULL CHECK (goal_number >= 1 AND goal_number <= 7),
  role_responsibility TEXT NOT NULL,

  -- Goal details
  sub_goals JSONB DEFAULT '[]'::jsonb,  -- Array of sub-goal strings
  action_plan TEXT NOT NULL,
  criteria TEXT NOT NULL,  -- Success criteria (measurable)
  deadline DATE,

  -- Percentage allocation (should sum to ~100% across all goals)
  percentage_allocation INTEGER CHECK (percentage_allocation >= 0 AND percentage_allocation <= 100),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT swot_goals_user_goal_unique UNIQUE (swot_analysis_id, goal_number)
);

-- ============================================================================
-- Table 3: swot_errc (ERRC Action Planning)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.swot_errc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swot_analysis_id UUID NOT NULL REFERENCES public.swot_analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- ERRC Framework (Eliminate-Reduce-Reinforce-Create)
  eliminate JSONB DEFAULT '[]'::jsonb,    -- Array of items to eliminate
  reduce JSONB DEFAULT '[]'::jsonb,       -- Array of items to reduce
  reinforce JSONB DEFAULT '[]'::jsonb,    -- Array of items to reinforce
  create_new JSONB DEFAULT '[]'::jsonb,   -- Array of items to create

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT swot_errc_user_unique UNIQUE (swot_analysis_id)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- swot_analyses indexes
CREATE INDEX IF NOT EXISTS idx_swot_analyses_user_id
  ON public.swot_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_swot_analyses_completed
  ON public.swot_analyses(is_completed);
CREATE INDEX IF NOT EXISTS idx_swot_analyses_current_stage
  ON public.swot_analyses(current_stage);
CREATE INDEX IF NOT EXISTS idx_swot_analyses_vision_id
  ON public.swot_analyses(vision_statement_id);

-- swot_goals indexes
CREATE INDEX IF NOT EXISTS idx_swot_goals_swot_id
  ON public.swot_goals(swot_analysis_id);
CREATE INDEX IF NOT EXISTS idx_swot_goals_user_id
  ON public.swot_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_swot_goals_goal_number
  ON public.swot_goals(goal_number);

-- swot_errc indexes
CREATE INDEX IF NOT EXISTS idx_swot_errc_swot_id
  ON public.swot_errc(swot_analysis_id);
CREATE INDEX IF NOT EXISTS idx_swot_errc_user_id
  ON public.swot_errc(user_id);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.swot_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swot_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swot_errc ENABLE ROW LEVEL SECURITY;

-- swot_analyses RLS policies
CREATE POLICY "Users can view their own SWOT analyses"
  ON public.swot_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own SWOT analyses"
  ON public.swot_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own SWOT analyses"
  ON public.swot_analyses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own SWOT analyses"
  ON public.swot_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- swot_goals RLS policies
CREATE POLICY "Users can view their own SWOT goals"
  ON public.swot_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own SWOT goals"
  ON public.swot_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own SWOT goals"
  ON public.swot_goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own SWOT goals"
  ON public.swot_goals FOR DELETE
  USING (auth.uid() = user_id);

-- swot_errc RLS policies
CREATE POLICY "Users can view their own SWOT ERRC"
  ON public.swot_errc FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own SWOT ERRC"
  ON public.swot_errc FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own SWOT ERRC"
  ON public.swot_errc FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own SWOT ERRC"
  ON public.swot_errc FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Triggers for updated_at timestamps
-- ============================================================================

-- Create update trigger function if not exists
CREATE OR REPLACE FUNCTION update_swot_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS set_swot_analyses_updated_at ON public.swot_analyses;
CREATE TRIGGER set_swot_analyses_updated_at
  BEFORE UPDATE ON public.swot_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_swot_updated_at();

DROP TRIGGER IF EXISTS set_swot_goals_updated_at ON public.swot_goals;
CREATE TRIGGER set_swot_goals_updated_at
  BEFORE UPDATE ON public.swot_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_swot_updated_at();

DROP TRIGGER IF EXISTS set_swot_errc_updated_at ON public.swot_errc;
CREATE TRIGGER set_swot_errc_updated_at
  BEFORE UPDATE ON public.swot_errc
  FOR EACH ROW
  EXECUTE FUNCTION update_swot_updated_at();

-- ============================================================================
-- Table Comments (Documentation)
-- ============================================================================

COMMENT ON TABLE public.swot_analyses IS 'Stores user SWOT analysis with strategy development and prioritization';
COMMENT ON COLUMN public.swot_analyses.user_id IS 'Reference to authenticated user';
COMMENT ON COLUMN public.swot_analyses.vision_statement_id IS 'Optional reference to vision statement from Vision module';
COMMENT ON COLUMN public.swot_analyses.vision_or_goal IS 'User vision statement or important goal for this SWOT';
COMMENT ON COLUMN public.swot_analyses.strengths IS 'Array of internal positive factors (minimum 4)';
COMMENT ON COLUMN public.swot_analyses.weaknesses IS 'Array of internal negative factors (minimum 4)';
COMMENT ON COLUMN public.swot_analyses.opportunities IS 'Array of external positive factors (minimum 4)';
COMMENT ON COLUMN public.swot_analyses.threats IS 'Array of external negative factors (minimum 4)';
COMMENT ON COLUMN public.swot_analyses.so_strategies IS 'Strategies using Strengths to leverage Opportunities';
COMMENT ON COLUMN public.swot_analyses.wo_strategies IS 'Strategies overcoming Weaknesses by using Opportunities';
COMMENT ON COLUMN public.swot_analyses.st_strategies IS 'Strategies using Strengths to avoid Threats';
COMMENT ON COLUMN public.swot_analyses.wt_strategies IS 'Strategies minimizing Weaknesses to avoid Threats';
COMMENT ON COLUMN public.swot_analyses.strategy_priorities IS 'Impact vs Difficulty matrix for strategy prioritization';
COMMENT ON COLUMN public.swot_analyses.reflection IS 'Final reflection essay (200-300 words)';
COMMENT ON COLUMN public.swot_analyses.current_stage IS 'Current stage: discovery, strategy, goals, action, reflection, completed';

COMMENT ON TABLE public.swot_goals IS 'Stores 7 SMART goals based on SWOT strategies';
COMMENT ON COLUMN public.swot_goals.goal_number IS 'Goal number 1-7';
COMMENT ON COLUMN public.swot_goals.role_responsibility IS 'Life role or responsibility area';
COMMENT ON COLUMN public.swot_goals.sub_goals IS 'Array of sub-goals for this goal';
COMMENT ON COLUMN public.swot_goals.action_plan IS 'Specific action plan to achieve goal';
COMMENT ON COLUMN public.swot_goals.criteria IS 'Success criteria (Measurable, SMART)';
COMMENT ON COLUMN public.swot_goals.deadline IS 'Target completion date (6-12 months)';
COMMENT ON COLUMN public.swot_goals.percentage_allocation IS 'Percentage of effort allocation';

COMMENT ON TABLE public.swot_errc IS 'Stores ERRC (Eliminate-Reduce-Reinforce-Create) action plan';
COMMENT ON COLUMN public.swot_errc.eliminate IS 'Array of daily habits/activities to eliminate';
COMMENT ON COLUMN public.swot_errc.reduce IS 'Array of daily habits/activities to reduce';
COMMENT ON COLUMN public.swot_errc.reinforce IS 'Array of daily habits/activities to reinforce';
COMMENT ON COLUMN public.swot_errc.create_new IS 'Array of new daily habits/activities to create';
