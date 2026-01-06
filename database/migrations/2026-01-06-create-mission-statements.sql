-- Migration: Create Mission Statement Module Tables
-- Date: 2026-01-06
-- Purpose: Implement Mission Statement module for crafting personal mission statements
-- Based on LifeCraft principles: combining values, vision, and purpose

-- ============================================================================
-- Table 1: mission_sessions (Main Session)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.mission_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session status
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  current_step INTEGER NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 4),

  -- Step 1: Values Review
  values_used JSONB DEFAULT '[]',
  -- Format: [{ type: 'terminal'|'instrumental'|'work', name: string, relevance: string }]

  -- Step 2: Purpose Questions (Five Whys approach)
  purpose_answers JSONB DEFAULT '{}',
  -- Format: {
  --   whatDoYouDo: string,
  --   forWhom: string,
  --   howDoYouDoIt: string,
  --   whatImpact: string,
  --   whyDoesItMatter: string
  -- }

  -- Step 3: Mission Drafts
  draft_versions JSONB DEFAULT '[]',
  -- Format: [{ version: number, text: string, createdAt: string, aiGenerated: boolean }]

  -- Step 4: Final Statement
  final_statement TEXT,

  -- AI conversation history for context
  ai_conversation JSONB DEFAULT '[]',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Constraints: Only one active session per user
  CONSTRAINT mission_sessions_user_unique UNIQUE (user_id)
);

-- ============================================================================
-- Table 2: mission_feedback (AI Feedback & Refinements)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.mission_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.mission_sessions(id) ON DELETE CASCADE,

  -- Feedback type
  feedback_type TEXT NOT NULL CHECK (feedback_type IN (
    'values_alignment',    -- How well mission aligns with values
    'clarity_check',       -- Is the statement clear and concise?
    'impact_analysis',     -- Does it describe meaningful impact?
    'actionability',       -- Is it actionable and specific?
    'draft_suggestion',    -- AI-suggested draft improvement
    'final_review'         -- Final comprehensive review
  )),

  -- Draft version this feedback refers to
  draft_version INTEGER,

  -- Feedback content
  feedback_text TEXT NOT NULL,
  suggestions TEXT[],
  score DECIMAL(3,2) CHECK (score BETWEEN 0 AND 1),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- mission_sessions indexes
CREATE INDEX IF NOT EXISTS idx_mission_sessions_user_id
  ON public.mission_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mission_sessions_status
  ON public.mission_sessions(status);

-- mission_feedback indexes
CREATE INDEX IF NOT EXISTS idx_mission_feedback_session_id
  ON public.mission_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_mission_feedback_type
  ON public.mission_feedback(feedback_type);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.mission_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_feedback ENABLE ROW LEVEL SECURITY;

-- mission_sessions RLS policies
CREATE POLICY "Users can view their own mission sessions"
  ON public.mission_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mission sessions"
  ON public.mission_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mission sessions"
  ON public.mission_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mission sessions"
  ON public.mission_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- mission_feedback RLS policies (access via session)
CREATE POLICY "Users can view feedback via session"
  ON public.mission_feedback FOR SELECT
  USING (
    session_id IN (SELECT id FROM public.mission_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create feedback via session"
  ON public.mission_feedback FOR INSERT
  WITH CHECK (
    session_id IN (SELECT id FROM public.mission_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update feedback via session"
  ON public.mission_feedback FOR UPDATE
  USING (
    session_id IN (SELECT id FROM public.mission_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete feedback via session"
  ON public.mission_feedback FOR DELETE
  USING (
    session_id IN (SELECT id FROM public.mission_sessions WHERE user_id = auth.uid())
  );

-- ============================================================================
-- Triggers for updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_mission_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_mission_sessions_updated_at ON public.mission_sessions;
CREATE TRIGGER set_mission_sessions_updated_at
  BEFORE UPDATE ON public.mission_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_mission_sessions_updated_at();

-- ============================================================================
-- Table Comments (Documentation)
-- ============================================================================

COMMENT ON TABLE public.mission_sessions IS 'Stores Mission Statement crafting sessions';
COMMENT ON COLUMN public.mission_sessions.status IS 'Session status: in_progress or completed';
COMMENT ON COLUMN public.mission_sessions.current_step IS 'Current step 1-4: values_review, purpose_questions, mission_draft, mission_refinement';
COMMENT ON COLUMN public.mission_sessions.values_used IS 'JSONB array of values selected from Values module';
COMMENT ON COLUMN public.mission_sessions.purpose_answers IS 'JSONB object containing answers to purpose questions';
COMMENT ON COLUMN public.mission_sessions.draft_versions IS 'JSONB array of mission statement draft versions';
COMMENT ON COLUMN public.mission_sessions.final_statement IS 'The finalized mission statement';

COMMENT ON TABLE public.mission_feedback IS 'Stores AI feedback on mission statement drafts';
COMMENT ON COLUMN public.mission_feedback.feedback_type IS 'Type of feedback: values_alignment, clarity_check, impact_analysis, actionability, draft_suggestion, final_review';
COMMENT ON COLUMN public.mission_feedback.score IS 'Score between 0-1 for quantitative feedback';

-- ============================================================================
-- Step Reference (for documentation)
-- ============================================================================
-- Step 1 (values_review): Review and select key values from Values module
-- Step 2 (purpose_questions): Answer 5 purpose questions (What, For Whom, How, Impact, Why)
-- Step 3 (mission_draft): AI helps draft mission statement based on values + purpose
-- Step 4 (mission_refinement): Refine and finalize the mission statement
