-- Migration: Create Career Options Exploration Module Tables
-- Date: 2026-01-06
-- Purpose: Implement Career Options module with Holland Code assessment and career exploration
-- Based on LifeCraft principles: Holland RIASEC model + strengths-based career matching

-- ============================================================================
-- Table 1: career_exploration_sessions (Main Session)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.career_exploration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session status
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  current_step INTEGER NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 4),

  -- Step 1: Holland Code (RIASEC)
  holland_responses JSONB DEFAULT '{}',
  -- Format: { R: [], I: [], A: [], S: [], E: [], C: [] } - arrays of question responses
  holland_code VARCHAR(6),
  -- Format: Primary 3-letter code like "RIA", "SEC", etc.
  holland_scores JSONB DEFAULT '{}',
  -- Format: { R: 0-100, I: 0-100, A: 0-100, S: 0-100, E: 0-100, C: 0-100 }

  -- Step 2: AI Career Suggestions
  suggested_careers JSONB DEFAULT '[]',
  -- Format: [{ title, description, matchScore, hollandFit, valuesFit, strengthsFit, salary, growth }]

  -- Step 3: Explored Careers (User's Research)
  explored_careers JSONB DEFAULT '[]',
  -- Format: [{ title, description, pros, cons, requirements, notes, interestLevel, userAdded }]

  -- Step 4: Career Comparison Matrix
  comparison_matrix JSONB DEFAULT '{}',
  -- Format: { criteria: [...], careers: [...], ratings: {...} }
  top_career_choices JSONB DEFAULT '[]',
  -- Format: [{ rank, title, reason }]

  -- Final Notes
  career_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Constraints: Only one active session per user
  CONSTRAINT career_exploration_sessions_user_unique UNIQUE (user_id)
);

-- ============================================================================
-- Table 2: holland_question_bank (Static Questions)
-- ============================================================================
-- Note: This is a reference table for Holland RIASEC questions
-- In practice, questions can be hardcoded in frontend for simplicity
CREATE TABLE IF NOT EXISTS public.holland_question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category CHAR(1) NOT NULL CHECK (category IN ('R', 'I', 'A', 'S', 'E', 'C')),
  question_text TEXT NOT NULL,
  question_text_ko TEXT,
  question_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- career_exploration_sessions indexes
CREATE INDEX IF NOT EXISTS idx_career_exploration_sessions_user_id
  ON public.career_exploration_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_career_exploration_sessions_status
  ON public.career_exploration_sessions(status);
CREATE INDEX IF NOT EXISTS idx_career_exploration_sessions_holland_code
  ON public.career_exploration_sessions(holland_code);

-- holland_question_bank indexes
CREATE INDEX IF NOT EXISTS idx_holland_question_bank_category
  ON public.holland_question_bank(category);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.career_exploration_sessions ENABLE ROW LEVEL SECURITY;

-- career_exploration_sessions RLS policies
CREATE POLICY "Users can view their own career exploration sessions"
  ON public.career_exploration_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own career exploration sessions"
  ON public.career_exploration_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own career exploration sessions"
  ON public.career_exploration_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own career exploration sessions"
  ON public.career_exploration_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- holland_question_bank is read-only for everyone
ALTER TABLE public.holland_question_bank ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read holland questions"
  ON public.holland_question_bank FOR SELECT
  USING (true);

-- ============================================================================
-- Triggers for updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_career_exploration_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_career_exploration_sessions_updated_at ON public.career_exploration_sessions;
CREATE TRIGGER set_career_exploration_sessions_updated_at
  BEFORE UPDATE ON public.career_exploration_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_career_exploration_sessions_updated_at();

-- ============================================================================
-- Table Comments (Documentation)
-- ============================================================================

COMMENT ON TABLE public.career_exploration_sessions IS 'Stores Career Exploration sessions with Holland Code assessment';
COMMENT ON COLUMN public.career_exploration_sessions.status IS 'Session status: in_progress or completed';
COMMENT ON COLUMN public.career_exploration_sessions.current_step IS 'Current step 1-4: holland_assessment, ai_suggestions, career_research, career_comparison';
COMMENT ON COLUMN public.career_exploration_sessions.holland_code IS 'Primary 3-letter Holland code (e.g., RIA, SEC)';
COMMENT ON COLUMN public.career_exploration_sessions.holland_scores IS 'JSONB with scores 0-100 for each RIASEC type';
COMMENT ON COLUMN public.career_exploration_sessions.suggested_careers IS 'AI-suggested careers based on profile';
COMMENT ON COLUMN public.career_exploration_sessions.explored_careers IS 'Careers user has researched in detail';
COMMENT ON COLUMN public.career_exploration_sessions.comparison_matrix IS 'Decision matrix comparing top career choices';
COMMENT ON COLUMN public.career_exploration_sessions.top_career_choices IS 'User ranked top career choices';

COMMENT ON TABLE public.holland_question_bank IS 'Reference table for Holland RIASEC assessment questions';

-- ============================================================================
-- Holland Code Reference (for documentation)
-- ============================================================================
-- R (Realistic): Hands-on, practical, working with tools/machines
-- I (Investigative): Analytical, intellectual, research-oriented
-- A (Artistic): Creative, original, expressive
-- S (Social): Helping, teaching, nurturing
-- E (Enterprising): Leading, persuading, managing
-- C (Conventional): Organizing, detail-oriented, structured

-- ============================================================================
-- Step Reference (for documentation)
-- ============================================================================
-- Step 1 (holland_assessment): Complete Holland RIASEC questionnaire
-- Step 2 (ai_suggestions): AI suggests careers based on Holland + values + strengths
-- Step 3 (career_research): User researches and explores 3-5 careers
-- Step 4 (career_comparison): Create decision matrix and rank top choices
