-- Migration: Create Goal Setting Module Tables (OKR-based)
-- Date: 2025-12-02
-- Purpose: Implement OKR-based role-focused goal setting integrated with SWOT
-- Based on LifeCraft Chapter 10: 7 Principles of Goal Setting

-- ============================================================================
-- Table 1: goal_setting_sessions (Main Session)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.goal_setting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  swot_analysis_id UUID NOT NULL REFERENCES public.swot_analyses(id) ON DELETE RESTRICT,

  -- Session status
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Constraints: Only one in-progress session per user
  CONSTRAINT goal_sessions_user_unique UNIQUE (user_id)
);

-- ============================================================================
-- Table 2: goal_roles (5-7 Life Roles with Wellbeing as #1)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.goal_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.goal_setting_sessions(id) ON DELETE CASCADE,

  -- Role identification
  role_number INTEGER NOT NULL CHECK (role_number BETWEEN 1 AND 7),
  role_name TEXT NOT NULL,
  role_description TEXT, -- Responsibility description

  -- Allocation (all roles should sum to 100%)
  percentage_allocation INTEGER DEFAULT 0 CHECK (percentage_allocation >= 0 AND percentage_allocation <= 100),

  -- Wellbeing flag (Role #1 should always be Wellbeing)
  is_wellbeing BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT goal_roles_session_number_unique UNIQUE (session_id, role_number)
);

-- ============================================================================
-- Table 3: goal_objectives (OKR Objectives for each Role)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.goal_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.goal_roles(id) ON DELETE CASCADE,

  -- Objective details
  objective_text TEXT NOT NULL, -- Inspiring goal statement
  objective_number INTEGER NOT NULL DEFAULT 1 CHECK (objective_number BETWEEN 1 AND 3),

  -- SWOT Integration
  related_swot_strategies TEXT[], -- Which SWOT strategies this addresses

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT goal_objectives_role_number_unique UNIQUE (role_id, objective_number)
);

-- ============================================================================
-- Table 4: goal_key_results (OKR Key Results)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.goal_key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID NOT NULL REFERENCES public.goal_objectives(id) ON DELETE CASCADE,

  -- Key Result details
  key_result_number INTEGER NOT NULL CHECK (key_result_number BETWEEN 1 AND 3),
  key_result_text TEXT NOT NULL, -- Measurable outcome
  success_criteria TEXT, -- How to measure success

  -- Timeline
  deadline DATE,

  -- Progress tracking
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'blocked')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT goal_key_results_objective_number_unique UNIQUE (objective_id, key_result_number)
);

-- ============================================================================
-- Table 5: goal_action_plans (Initiatives for Key Results)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.goal_action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_result_id UUID NOT NULL REFERENCES public.goal_key_results(id) ON DELETE CASCADE,

  -- Action details
  action_number INTEGER NOT NULL,
  action_text TEXT NOT NULL,

  -- Timeline
  due_date DATE,

  -- Completion tracking
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT goal_action_plans_kr_number_unique UNIQUE (key_result_id, action_number)
);

-- ============================================================================
-- Table 6: goal_reflections (7 Principles of Goal Setting)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.goal_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.goal_setting_sessions(id) ON DELETE CASCADE,

  -- Reflection type (7 principles)
  reflection_type TEXT NOT NULL CHECK (reflection_type IN (
    'identity_alignment',    -- 1. 정체성 반영 (Reflect on Identity)
    'deliberation',          -- 2. 충분한 숙고 (Sufficient Deliberation)
    'incompleteness',        -- 3. 미완성 (Embrace Incompleteness)
    'diversity',             -- 4. 다양성 (Multiple Roles)
    'connectivity',          -- 5. 연계성 (Bigger Picture)
    'feasibility',           -- 6. 실현 가능성 (Feasibility)
    'execution_ease'         -- 7. 실행 용이성 (Ease of Execution)
  )),

  -- Reflection content
  reflection_text TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints: One reflection per type per session
  CONSTRAINT goal_reflections_session_type_unique UNIQUE (session_id, reflection_type)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- goal_setting_sessions indexes
CREATE INDEX IF NOT EXISTS idx_goal_sessions_user_id
  ON public.goal_setting_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_sessions_swot_id
  ON public.goal_setting_sessions(swot_analysis_id);
CREATE INDEX IF NOT EXISTS idx_goal_sessions_status
  ON public.goal_setting_sessions(status);

-- goal_roles indexes
CREATE INDEX IF NOT EXISTS idx_goal_roles_session_id
  ON public.goal_roles(session_id);
CREATE INDEX IF NOT EXISTS idx_goal_roles_role_number
  ON public.goal_roles(role_number);

-- goal_objectives indexes
CREATE INDEX IF NOT EXISTS idx_goal_objectives_role_id
  ON public.goal_objectives(role_id);

-- goal_key_results indexes
CREATE INDEX IF NOT EXISTS idx_goal_key_results_objective_id
  ON public.goal_key_results(objective_id);
CREATE INDEX IF NOT EXISTS idx_goal_key_results_status
  ON public.goal_key_results(status);
CREATE INDEX IF NOT EXISTS idx_goal_key_results_deadline
  ON public.goal_key_results(deadline);

-- goal_action_plans indexes
CREATE INDEX IF NOT EXISTS idx_goal_action_plans_kr_id
  ON public.goal_action_plans(key_result_id);
CREATE INDEX IF NOT EXISTS idx_goal_action_plans_due_date
  ON public.goal_action_plans(due_date);

-- goal_reflections indexes
CREATE INDEX IF NOT EXISTS idx_goal_reflections_session_id
  ON public.goal_reflections(session_id);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.goal_setting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_reflections ENABLE ROW LEVEL SECURITY;

-- goal_setting_sessions RLS policies
CREATE POLICY "Users can view their own goal sessions"
  ON public.goal_setting_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goal sessions"
  ON public.goal_setting_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goal sessions"
  ON public.goal_setting_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goal sessions"
  ON public.goal_setting_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- goal_roles RLS policies (access via session)
CREATE POLICY "Users can view roles via session"
  ON public.goal_roles FOR SELECT
  USING (
    session_id IN (SELECT id FROM public.goal_setting_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create roles via session"
  ON public.goal_roles FOR INSERT
  WITH CHECK (
    session_id IN (SELECT id FROM public.goal_setting_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update roles via session"
  ON public.goal_roles FOR UPDATE
  USING (
    session_id IN (SELECT id FROM public.goal_setting_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete roles via session"
  ON public.goal_roles FOR DELETE
  USING (
    session_id IN (SELECT id FROM public.goal_setting_sessions WHERE user_id = auth.uid())
  );

-- goal_objectives RLS policies (access via role -> session)
CREATE POLICY "Users can view objectives via role"
  ON public.goal_objectives FOR SELECT
  USING (
    role_id IN (
      SELECT r.id FROM public.goal_roles r
      JOIN public.goal_setting_sessions s ON r.session_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create objectives via role"
  ON public.goal_objectives FOR INSERT
  WITH CHECK (
    role_id IN (
      SELECT r.id FROM public.goal_roles r
      JOIN public.goal_setting_sessions s ON r.session_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update objectives via role"
  ON public.goal_objectives FOR UPDATE
  USING (
    role_id IN (
      SELECT r.id FROM public.goal_roles r
      JOIN public.goal_setting_sessions s ON r.session_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete objectives via role"
  ON public.goal_objectives FOR DELETE
  USING (
    role_id IN (
      SELECT r.id FROM public.goal_roles r
      JOIN public.goal_setting_sessions s ON r.session_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

-- goal_key_results RLS policies (access via objective -> role -> session)
CREATE POLICY "Users can view key results via objective"
  ON public.goal_key_results FOR SELECT
  USING (
    objective_id IN (
      SELECT o.id FROM public.goal_objectives o
      JOIN public.goal_roles r ON o.role_id = r.id
      JOIN public.goal_setting_sessions s ON r.session_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create key results via objective"
  ON public.goal_key_results FOR INSERT
  WITH CHECK (
    objective_id IN (
      SELECT o.id FROM public.goal_objectives o
      JOIN public.goal_roles r ON o.role_id = r.id
      JOIN public.goal_setting_sessions s ON r.session_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update key results via objective"
  ON public.goal_key_results FOR UPDATE
  USING (
    objective_id IN (
      SELECT o.id FROM public.goal_objectives o
      JOIN public.goal_roles r ON o.role_id = r.id
      JOIN public.goal_setting_sessions s ON r.session_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete key results via objective"
  ON public.goal_key_results FOR DELETE
  USING (
    objective_id IN (
      SELECT o.id FROM public.goal_objectives o
      JOIN public.goal_roles r ON o.role_id = r.id
      JOIN public.goal_setting_sessions s ON r.session_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

-- goal_action_plans RLS policies (access via key result -> objective -> role -> session)
CREATE POLICY "Users can view action plans via key result"
  ON public.goal_action_plans FOR SELECT
  USING (
    key_result_id IN (
      SELECT kr.id FROM public.goal_key_results kr
      JOIN public.goal_objectives o ON kr.objective_id = o.id
      JOIN public.goal_roles r ON o.role_id = r.id
      JOIN public.goal_setting_sessions s ON r.session_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create action plans via key result"
  ON public.goal_action_plans FOR INSERT
  WITH CHECK (
    key_result_id IN (
      SELECT kr.id FROM public.goal_key_results kr
      JOIN public.goal_objectives o ON kr.objective_id = o.id
      JOIN public.goal_roles r ON o.role_id = r.id
      JOIN public.goal_setting_sessions s ON r.session_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update action plans via key result"
  ON public.goal_action_plans FOR UPDATE
  USING (
    key_result_id IN (
      SELECT kr.id FROM public.goal_key_results kr
      JOIN public.goal_objectives o ON kr.objective_id = o.id
      JOIN public.goal_roles r ON o.role_id = r.id
      JOIN public.goal_setting_sessions s ON r.session_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete action plans via key result"
  ON public.goal_action_plans FOR DELETE
  USING (
    key_result_id IN (
      SELECT kr.id FROM public.goal_key_results kr
      JOIN public.goal_objectives o ON kr.objective_id = o.id
      JOIN public.goal_roles r ON o.role_id = r.id
      JOIN public.goal_setting_sessions s ON r.session_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

-- goal_reflections RLS policies (access via session)
CREATE POLICY "Users can view reflections via session"
  ON public.goal_reflections FOR SELECT
  USING (
    session_id IN (SELECT id FROM public.goal_setting_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create reflections via session"
  ON public.goal_reflections FOR INSERT
  WITH CHECK (
    session_id IN (SELECT id FROM public.goal_setting_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update reflections via session"
  ON public.goal_reflections FOR UPDATE
  USING (
    session_id IN (SELECT id FROM public.goal_setting_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete reflections via session"
  ON public.goal_reflections FOR DELETE
  USING (
    session_id IN (SELECT id FROM public.goal_setting_sessions WHERE user_id = auth.uid())
  );

-- ============================================================================
-- Triggers for updated_at timestamps
-- ============================================================================

-- Use existing update_swot_updated_at function or create generic one
CREATE OR REPLACE FUNCTION update_goal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at column
DROP TRIGGER IF EXISTS set_goal_sessions_updated_at ON public.goal_setting_sessions;
CREATE TRIGGER set_goal_sessions_updated_at
  BEFORE UPDATE ON public.goal_setting_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_updated_at();

DROP TRIGGER IF EXISTS set_goal_roles_updated_at ON public.goal_roles;
CREATE TRIGGER set_goal_roles_updated_at
  BEFORE UPDATE ON public.goal_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_updated_at();

DROP TRIGGER IF EXISTS set_goal_objectives_updated_at ON public.goal_objectives;
CREATE TRIGGER set_goal_objectives_updated_at
  BEFORE UPDATE ON public.goal_objectives
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_updated_at();

DROP TRIGGER IF EXISTS set_goal_key_results_updated_at ON public.goal_key_results;
CREATE TRIGGER set_goal_key_results_updated_at
  BEFORE UPDATE ON public.goal_key_results
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_updated_at();

DROP TRIGGER IF EXISTS set_goal_action_plans_updated_at ON public.goal_action_plans;
CREATE TRIGGER set_goal_action_plans_updated_at
  BEFORE UPDATE ON public.goal_action_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_updated_at();

-- ============================================================================
-- Table Comments (Documentation)
-- ============================================================================

COMMENT ON TABLE public.goal_setting_sessions IS 'Stores OKR-based goal setting sessions linked to SWOT analysis';
COMMENT ON COLUMN public.goal_setting_sessions.swot_analysis_id IS 'Required link to SWOT analysis for strategy integration';
COMMENT ON COLUMN public.goal_setting_sessions.status IS 'Session status: in_progress or completed';

COMMENT ON TABLE public.goal_roles IS 'Stores 5-7 life roles with percentage allocation (Wellbeing as #1)';
COMMENT ON COLUMN public.goal_roles.role_number IS 'Role number 1-7 (1 is always Wellbeing)';
COMMENT ON COLUMN public.goal_roles.role_name IS 'Name of the life role (e.g., Wellbeing, Career, Family)';
COMMENT ON COLUMN public.goal_roles.role_description IS 'Description of responsibilities for this role';
COMMENT ON COLUMN public.goal_roles.percentage_allocation IS 'Percentage of effort/time allocated (all roles sum to 100%)';
COMMENT ON COLUMN public.goal_roles.is_wellbeing IS 'True for Role #1 (Wellbeing wheel integration)';

COMMENT ON TABLE public.goal_objectives IS 'OKR Objectives - inspiring goal statements for each role';
COMMENT ON COLUMN public.goal_objectives.objective_text IS 'Inspiring, qualitative goal statement';
COMMENT ON COLUMN public.goal_objectives.related_swot_strategies IS 'Array of SWOT strategies this objective addresses';

COMMENT ON TABLE public.goal_key_results IS 'OKR Key Results - measurable outcomes for each objective';
COMMENT ON COLUMN public.goal_key_results.key_result_text IS 'Measurable, quantifiable outcome';
COMMENT ON COLUMN public.goal_key_results.success_criteria IS 'How to measure success';
COMMENT ON COLUMN public.goal_key_results.deadline IS 'Target completion date';
COMMENT ON COLUMN public.goal_key_results.status IS 'Status: not_started, in_progress, completed, blocked';
COMMENT ON COLUMN public.goal_key_results.progress_percentage IS 'Progress percentage 0-100';

COMMENT ON TABLE public.goal_action_plans IS 'Initiatives/action steps for each key result';
COMMENT ON COLUMN public.goal_action_plans.action_text IS 'Specific action step';
COMMENT ON COLUMN public.goal_action_plans.due_date IS 'Target date for this action';
COMMENT ON COLUMN public.goal_action_plans.is_completed IS 'Whether action is completed';

COMMENT ON TABLE public.goal_reflections IS 'Reflections based on 7 principles of goal setting';
COMMENT ON COLUMN public.goal_reflections.reflection_type IS 'One of 7 principles: identity_alignment, deliberation, incompleteness, diversity, connectivity, feasibility, execution_ease';
COMMENT ON COLUMN public.goal_reflections.reflection_text IS 'User reflection text for this principle';
