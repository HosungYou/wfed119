-- Migration: Create Extended ERRC Action Plan Module Tables
-- Date: 2025-12-02
-- Purpose: Implement standalone ERRC Action Plan module with wellbeing assessment
-- Based on LifeCraft Chapter 11: ERRC Framework (Eliminate-Reduce-Raise-Create)

-- ============================================================================
-- ENUM Types for ERRC Categories and Status
-- ============================================================================

-- ERRC Category Enum
DO $$ BEGIN
  CREATE TYPE errc_category AS ENUM ('eliminate', 'reduce', 'raise', 'create');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Action Step Status Enum
DO $$ BEGIN
  CREATE TYPE errc_step_status AS ENUM ('not_started', 'in_progress', 'completed', 'skipped');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- Table 1: errc_sessions (Main Session with Wellbeing Assessment)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.errc_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Optional link to SWOT analysis
  swot_analysis_id UUID REFERENCES public.swot_analyses(id) ON DELETE SET NULL,

  -- Session status
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  current_step TEXT NOT NULL DEFAULT 'wellbeing_before' CHECK (current_step IN (
    'wellbeing_before', 'canvas', 'actions', 'progress', 'journal', 'wellbeing_after', 'results'
  )),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Constraints: Only one active session per user
  CONSTRAINT errc_sessions_user_unique UNIQUE (user_id)
);

-- ============================================================================
-- Table 2: errc_wellbeing_assessments (Before/After Wellbeing Wheel)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.errc_wellbeing_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.errc_sessions(id) ON DELETE CASCADE,

  -- Assessment type (before starting ERRC, after completing)
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('before', 'after')),

  -- Wellbeing dimensions (1-10 scale)
  physical_wellbeing INTEGER NOT NULL CHECK (physical_wellbeing BETWEEN 1 AND 10),
  emotional_wellbeing INTEGER NOT NULL CHECK (emotional_wellbeing BETWEEN 1 AND 10),
  intellectual_wellbeing INTEGER NOT NULL CHECK (intellectual_wellbeing BETWEEN 1 AND 10),
  social_wellbeing INTEGER NOT NULL CHECK (social_wellbeing BETWEEN 1 AND 10),
  spiritual_wellbeing INTEGER NOT NULL CHECK (spiritual_wellbeing BETWEEN 1 AND 10),
  occupational_wellbeing INTEGER NOT NULL CHECK (occupational_wellbeing BETWEEN 1 AND 10),

  -- Optional notes for each dimension
  notes JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints: One assessment per type per session
  CONSTRAINT errc_wellbeing_session_type_unique UNIQUE (session_id, assessment_type)
);

-- ============================================================================
-- Table 3: errc_items (Individual ERRC Items)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.errc_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.errc_sessions(id) ON DELETE CASCADE,

  -- ERRC Category
  category errc_category NOT NULL,

  -- Item details
  item_text TEXT NOT NULL,
  description TEXT,

  -- Priority within category (for ordering)
  priority INTEGER NOT NULL DEFAULT 1 CHECK (priority > 0),

  -- Related wellbeing dimensions (array of dimension names)
  related_wellbeing TEXT[] DEFAULT '{}',

  -- Progress tracking
  is_active BOOLEAN NOT NULL DEFAULT true,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints: Unique priority within category per session
  CONSTRAINT errc_items_session_category_priority_unique UNIQUE (session_id, category, priority)
);

-- ============================================================================
-- Table 4: errc_action_steps (Action Steps for Each Item)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.errc_action_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  errc_item_id UUID NOT NULL REFERENCES public.errc_items(id) ON DELETE CASCADE,

  -- Step details
  step_number INTEGER NOT NULL CHECK (step_number > 0),
  step_text TEXT NOT NULL,

  -- Timeline
  due_date DATE,

  -- Status tracking
  status errc_step_status NOT NULL DEFAULT 'not_started',
  completed_at TIMESTAMPTZ,

  -- Notes/Reflection on this step
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints: Unique step number per item
  CONSTRAINT errc_steps_item_number_unique UNIQUE (errc_item_id, step_number)
);

-- ============================================================================
-- Table 5: errc_reflections (Reflection Journal Entries)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.errc_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.errc_sessions(id) ON DELETE CASCADE,

  -- Reflection type
  reflection_type TEXT NOT NULL CHECK (reflection_type IN (
    'weekly_check_in',     -- Weekly progress check
    'milestone',           -- When completing a major item
    'challenge',           -- Documenting challenges faced
    'insight',             -- New insights discovered
    'final_reflection'     -- End of ERRC session reflection
  )),

  -- Reflection content
  title TEXT,
  content TEXT NOT NULL,

  -- Optional: Link to specific ERRC item
  related_item_id UUID REFERENCES public.errc_items(id) ON DELETE SET NULL,

  -- Mood/Energy level at time of reflection (1-10)
  mood_level INTEGER CHECK (mood_level BETWEEN 1 AND 10),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- errc_sessions indexes
CREATE INDEX IF NOT EXISTS idx_errc_sessions_user_id
  ON public.errc_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_errc_sessions_status
  ON public.errc_sessions(status);
CREATE INDEX IF NOT EXISTS idx_errc_sessions_swot_id
  ON public.errc_sessions(swot_analysis_id);

-- errc_wellbeing_assessments indexes
CREATE INDEX IF NOT EXISTS idx_errc_wellbeing_session_id
  ON public.errc_wellbeing_assessments(session_id);
CREATE INDEX IF NOT EXISTS idx_errc_wellbeing_type
  ON public.errc_wellbeing_assessments(assessment_type);

-- errc_items indexes
CREATE INDEX IF NOT EXISTS idx_errc_items_session_id
  ON public.errc_items(session_id);
CREATE INDEX IF NOT EXISTS idx_errc_items_category
  ON public.errc_items(category);
CREATE INDEX IF NOT EXISTS idx_errc_items_is_active
  ON public.errc_items(is_active);

-- errc_action_steps indexes
CREATE INDEX IF NOT EXISTS idx_errc_steps_item_id
  ON public.errc_action_steps(errc_item_id);
CREATE INDEX IF NOT EXISTS idx_errc_steps_status
  ON public.errc_action_steps(status);
CREATE INDEX IF NOT EXISTS idx_errc_steps_due_date
  ON public.errc_action_steps(due_date);

-- errc_reflections indexes
CREATE INDEX IF NOT EXISTS idx_errc_reflections_session_id
  ON public.errc_reflections(session_id);
CREATE INDEX IF NOT EXISTS idx_errc_reflections_type
  ON public.errc_reflections(reflection_type);
CREATE INDEX IF NOT EXISTS idx_errc_reflections_item_id
  ON public.errc_reflections(related_item_id);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.errc_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.errc_wellbeing_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.errc_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.errc_action_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.errc_reflections ENABLE ROW LEVEL SECURITY;

-- errc_sessions RLS policies
CREATE POLICY "Users can view their own ERRC sessions"
  ON public.errc_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ERRC sessions"
  ON public.errc_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ERRC sessions"
  ON public.errc_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ERRC sessions"
  ON public.errc_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- errc_wellbeing_assessments RLS policies (access via session)
CREATE POLICY "Users can view wellbeing via session"
  ON public.errc_wellbeing_assessments FOR SELECT
  USING (
    session_id IN (SELECT id FROM public.errc_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create wellbeing via session"
  ON public.errc_wellbeing_assessments FOR INSERT
  WITH CHECK (
    session_id IN (SELECT id FROM public.errc_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update wellbeing via session"
  ON public.errc_wellbeing_assessments FOR UPDATE
  USING (
    session_id IN (SELECT id FROM public.errc_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete wellbeing via session"
  ON public.errc_wellbeing_assessments FOR DELETE
  USING (
    session_id IN (SELECT id FROM public.errc_sessions WHERE user_id = auth.uid())
  );

-- errc_items RLS policies (access via session)
CREATE POLICY "Users can view items via session"
  ON public.errc_items FOR SELECT
  USING (
    session_id IN (SELECT id FROM public.errc_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create items via session"
  ON public.errc_items FOR INSERT
  WITH CHECK (
    session_id IN (SELECT id FROM public.errc_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update items via session"
  ON public.errc_items FOR UPDATE
  USING (
    session_id IN (SELECT id FROM public.errc_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete items via session"
  ON public.errc_items FOR DELETE
  USING (
    session_id IN (SELECT id FROM public.errc_sessions WHERE user_id = auth.uid())
  );

-- errc_action_steps RLS policies (access via item -> session)
CREATE POLICY "Users can view steps via item"
  ON public.errc_action_steps FOR SELECT
  USING (
    errc_item_id IN (
      SELECT i.id FROM public.errc_items i
      JOIN public.errc_sessions s ON i.session_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create steps via item"
  ON public.errc_action_steps FOR INSERT
  WITH CHECK (
    errc_item_id IN (
      SELECT i.id FROM public.errc_items i
      JOIN public.errc_sessions s ON i.session_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update steps via item"
  ON public.errc_action_steps FOR UPDATE
  USING (
    errc_item_id IN (
      SELECT i.id FROM public.errc_items i
      JOIN public.errc_sessions s ON i.session_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete steps via item"
  ON public.errc_action_steps FOR DELETE
  USING (
    errc_item_id IN (
      SELECT i.id FROM public.errc_items i
      JOIN public.errc_sessions s ON i.session_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

-- errc_reflections RLS policies (access via session)
CREATE POLICY "Users can view reflections via session"
  ON public.errc_reflections FOR SELECT
  USING (
    session_id IN (SELECT id FROM public.errc_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create reflections via session"
  ON public.errc_reflections FOR INSERT
  WITH CHECK (
    session_id IN (SELECT id FROM public.errc_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update reflections via session"
  ON public.errc_reflections FOR UPDATE
  USING (
    session_id IN (SELECT id FROM public.errc_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete reflections via session"
  ON public.errc_reflections FOR DELETE
  USING (
    session_id IN (SELECT id FROM public.errc_sessions WHERE user_id = auth.uid())
  );

-- ============================================================================
-- Triggers for updated_at timestamps
-- ============================================================================

-- Create update trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_errc_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at column
DROP TRIGGER IF EXISTS set_errc_sessions_updated_at ON public.errc_sessions;
CREATE TRIGGER set_errc_sessions_updated_at
  BEFORE UPDATE ON public.errc_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_errc_updated_at();

DROP TRIGGER IF EXISTS set_errc_wellbeing_updated_at ON public.errc_wellbeing_assessments;
CREATE TRIGGER set_errc_wellbeing_updated_at
  BEFORE UPDATE ON public.errc_wellbeing_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_errc_updated_at();

DROP TRIGGER IF EXISTS set_errc_items_updated_at ON public.errc_items;
CREATE TRIGGER set_errc_items_updated_at
  BEFORE UPDATE ON public.errc_items
  FOR EACH ROW
  EXECUTE FUNCTION update_errc_updated_at();

DROP TRIGGER IF EXISTS set_errc_steps_updated_at ON public.errc_action_steps;
CREATE TRIGGER set_errc_steps_updated_at
  BEFORE UPDATE ON public.errc_action_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_errc_updated_at();

DROP TRIGGER IF EXISTS set_errc_reflections_updated_at ON public.errc_reflections;
CREATE TRIGGER set_errc_reflections_updated_at
  BEFORE UPDATE ON public.errc_reflections
  FOR EACH ROW
  EXECUTE FUNCTION update_errc_updated_at();

-- ============================================================================
-- Compatibility View (for existing swot_errc data)
-- ============================================================================

-- Create view to maintain backwards compatibility with existing swot_errc data
CREATE OR REPLACE VIEW public.v_errc_legacy_items AS
SELECT
  e.id,
  e.swot_analysis_id,
  s.user_id,
  jsonb_agg(CASE WHEN i.category = 'eliminate' THEN i.item_text END) FILTER (WHERE i.category = 'eliminate') as eliminate,
  jsonb_agg(CASE WHEN i.category = 'reduce' THEN i.item_text END) FILTER (WHERE i.category = 'reduce') as reduce,
  jsonb_agg(CASE WHEN i.category = 'raise' THEN i.item_text END) FILTER (WHERE i.category = 'raise') as reinforce,
  jsonb_agg(CASE WHEN i.category = 'create' THEN i.item_text END) FILTER (WHERE i.category = 'create') as create_new,
  e.created_at,
  e.updated_at
FROM public.errc_sessions e
JOIN public.errc_sessions s ON e.id = s.id
LEFT JOIN public.errc_items i ON i.session_id = e.id
GROUP BY e.id, e.swot_analysis_id, s.user_id, e.created_at, e.updated_at;

-- ============================================================================
-- Table Comments (Documentation)
-- ============================================================================

COMMENT ON TABLE public.errc_sessions IS 'Stores ERRC Action Plan sessions with status tracking';
COMMENT ON COLUMN public.errc_sessions.swot_analysis_id IS 'Optional link to SWOT analysis for integration';
COMMENT ON COLUMN public.errc_sessions.status IS 'Session status: in_progress or completed';
COMMENT ON COLUMN public.errc_sessions.current_step IS 'Current step in ERRC workflow';

COMMENT ON TABLE public.errc_wellbeing_assessments IS 'Before/After wellbeing wheel assessments';
COMMENT ON COLUMN public.errc_wellbeing_assessments.assessment_type IS 'before: initial assessment, after: post-ERRC assessment';
COMMENT ON COLUMN public.errc_wellbeing_assessments.physical_wellbeing IS 'Physical health and energy (1-10)';
COMMENT ON COLUMN public.errc_wellbeing_assessments.emotional_wellbeing IS 'Emotional balance and resilience (1-10)';
COMMENT ON COLUMN public.errc_wellbeing_assessments.intellectual_wellbeing IS 'Mental stimulation and growth (1-10)';
COMMENT ON COLUMN public.errc_wellbeing_assessments.social_wellbeing IS 'Relationships and community (1-10)';
COMMENT ON COLUMN public.errc_wellbeing_assessments.spiritual_wellbeing IS 'Purpose and meaning (1-10)';
COMMENT ON COLUMN public.errc_wellbeing_assessments.occupational_wellbeing IS 'Work satisfaction and career (1-10)';

COMMENT ON TABLE public.errc_items IS 'Individual ERRC items in four categories';
COMMENT ON COLUMN public.errc_items.category IS 'ERRC category: eliminate, reduce, raise, create';
COMMENT ON COLUMN public.errc_items.item_text IS 'The habit, activity, or behavior';
COMMENT ON COLUMN public.errc_items.priority IS 'Priority order within category (1 = highest)';
COMMENT ON COLUMN public.errc_items.related_wellbeing IS 'Wellbeing dimensions this item affects';
COMMENT ON COLUMN public.errc_items.progress_percentage IS 'Overall progress for this item (0-100)';

COMMENT ON TABLE public.errc_action_steps IS 'Specific action steps for each ERRC item';
COMMENT ON COLUMN public.errc_action_steps.step_number IS 'Order of this step (1, 2, 3...)';
COMMENT ON COLUMN public.errc_action_steps.step_text IS 'Description of the action step';
COMMENT ON COLUMN public.errc_action_steps.status IS 'Step status: not_started, in_progress, completed, skipped';

COMMENT ON TABLE public.errc_reflections IS 'Reflection journal entries during ERRC journey';
COMMENT ON COLUMN public.errc_reflections.reflection_type IS 'Type: weekly_check_in, milestone, challenge, insight, final_reflection';
COMMENT ON COLUMN public.errc_reflections.related_item_id IS 'Optional link to specific ERRC item';
COMMENT ON COLUMN public.errc_reflections.mood_level IS 'Mood at time of reflection (1-10)';
COMMENT ON COLUMN public.errc_reflections.energy_level IS 'Energy at time of reflection (1-10)';
