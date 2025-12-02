-- Migration: Create Life Themes Discovery Module Tables
-- Date: 2025-12-02
-- Purpose: Implement Life Themes discovery through 6 reflective questions
-- Based on LifeCraft Chapter 3: Career Construction Interview (Mark Savickas)

-- ============================================================================
-- Table 1: life_themes_sessions (Main Session)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.life_themes_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session status
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  current_step TEXT NOT NULL DEFAULT 'role_models' CHECK (current_step IN (
    'role_models', 'media', 'hobbies', 'mottos', 'subjects', 'memories',
    'patterns', 'themes', 'results'
  )),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Constraints: Only one active session per user
  CONSTRAINT life_themes_sessions_user_unique UNIQUE (user_id)
);

-- ============================================================================
-- Table 2: life_themes_responses (Answers to 6 Questions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.life_themes_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.life_themes_sessions(id) ON DELETE CASCADE,

  -- Question identification (1-6)
  question_number INTEGER NOT NULL CHECK (question_number BETWEEN 1 AND 6),

  -- Response data stored as JSONB for flexibility
  -- Each question has different structure:
  -- Q1 (role_models): [{ name, description, similarities, differences }]
  -- Q2 (media): [{ name, type, reasons }]
  -- Q3 (hobbies): [{ hobby, enjoyment_reasons }]
  -- Q4 (mottos): [{ motto, meaning }]
  -- Q5 (subjects): { liked: [{ subject, reasons }], disliked: [{ subject, reasons }] }
  -- Q6 (memories): [{ title, content, feelings, age_range }]
  response_data JSONB NOT NULL,

  -- Common themes/patterns identified in this question
  identified_patterns TEXT[],

  -- Completion status
  is_completed BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints: One response per question per session
  CONSTRAINT life_themes_responses_session_question_unique UNIQUE (session_id, question_number)
);

-- ============================================================================
-- Table 3: life_themes_patterns (Cross-Question Pattern Discovery)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.life_themes_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.life_themes_sessions(id) ON DELETE CASCADE,

  -- Pattern details
  pattern_text TEXT NOT NULL,
  pattern_description TEXT,

  -- Which questions this pattern appears in
  related_questions INTEGER[] NOT NULL,

  -- Evidence/examples from responses
  evidence TEXT[],

  -- AI suggested or user identified
  source TEXT NOT NULL DEFAULT 'user' CHECK (source IN ('user', 'ai', 'combined')),

  -- Confidence level (for AI suggestions)
  confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Table 4: life_themes (Final Theme Ranking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.life_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.life_themes_sessions(id) ON DELETE CASCADE,

  -- Theme details
  theme_name TEXT NOT NULL,
  theme_description TEXT,

  -- Priority ranking (1 = highest)
  priority_rank INTEGER NOT NULL CHECK (priority_rank > 0),

  -- Related patterns
  related_pattern_ids UUID[],

  -- Enneagram connection (if available)
  enneagram_connection TEXT,

  -- User reflection on this theme
  personal_reflection TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints: Unique priority per session
  CONSTRAINT life_themes_session_priority_unique UNIQUE (session_id, priority_rank)
);

-- ============================================================================
-- Table 5: life_themes_analysis (AI Analysis Results)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.life_themes_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.life_themes_sessions(id) ON DELETE CASCADE,

  -- Analysis type
  analysis_type TEXT NOT NULL CHECK (analysis_type IN (
    'pattern_summary',    -- Summary of all patterns
    'theme_suggestion',   -- AI suggested themes
    'enneagram_insight',  -- Enneagram connection analysis
    'career_implication', -- Career/life direction insights
    'final_synthesis'     -- Final comprehensive analysis
  )),

  -- Analysis content
  content TEXT NOT NULL,

  -- Structured data (for suggestions with confidence scores, etc.)
  structured_data JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints: One analysis per type per session
  CONSTRAINT life_themes_analysis_session_type_unique UNIQUE (session_id, analysis_type)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- life_themes_sessions indexes
CREATE INDEX IF NOT EXISTS idx_life_themes_sessions_user_id
  ON public.life_themes_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_life_themes_sessions_status
  ON public.life_themes_sessions(status);

-- life_themes_responses indexes
CREATE INDEX IF NOT EXISTS idx_life_themes_responses_session_id
  ON public.life_themes_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_life_themes_responses_question
  ON public.life_themes_responses(question_number);

-- life_themes_patterns indexes
CREATE INDEX IF NOT EXISTS idx_life_themes_patterns_session_id
  ON public.life_themes_patterns(session_id);

-- life_themes indexes
CREATE INDEX IF NOT EXISTS idx_life_themes_session_id
  ON public.life_themes(session_id);
CREATE INDEX IF NOT EXISTS idx_life_themes_priority
  ON public.life_themes(priority_rank);

-- life_themes_analysis indexes
CREATE INDEX IF NOT EXISTS idx_life_themes_analysis_session_id
  ON public.life_themes_analysis(session_id);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.life_themes_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_themes_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_themes_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_themes_analysis ENABLE ROW LEVEL SECURITY;

-- life_themes_sessions RLS policies
CREATE POLICY "Users can view their own life themes sessions"
  ON public.life_themes_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own life themes sessions"
  ON public.life_themes_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own life themes sessions"
  ON public.life_themes_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own life themes sessions"
  ON public.life_themes_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- life_themes_responses RLS policies (access via session)
CREATE POLICY "Users can view responses via session"
  ON public.life_themes_responses FOR SELECT
  USING (
    session_id IN (SELECT id FROM public.life_themes_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create responses via session"
  ON public.life_themes_responses FOR INSERT
  WITH CHECK (
    session_id IN (SELECT id FROM public.life_themes_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update responses via session"
  ON public.life_themes_responses FOR UPDATE
  USING (
    session_id IN (SELECT id FROM public.life_themes_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete responses via session"
  ON public.life_themes_responses FOR DELETE
  USING (
    session_id IN (SELECT id FROM public.life_themes_sessions WHERE user_id = auth.uid())
  );

-- life_themes_patterns RLS policies
CREATE POLICY "Users can view patterns via session"
  ON public.life_themes_patterns FOR SELECT
  USING (
    session_id IN (SELECT id FROM public.life_themes_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create patterns via session"
  ON public.life_themes_patterns FOR INSERT
  WITH CHECK (
    session_id IN (SELECT id FROM public.life_themes_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update patterns via session"
  ON public.life_themes_patterns FOR UPDATE
  USING (
    session_id IN (SELECT id FROM public.life_themes_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete patterns via session"
  ON public.life_themes_patterns FOR DELETE
  USING (
    session_id IN (SELECT id FROM public.life_themes_sessions WHERE user_id = auth.uid())
  );

-- life_themes RLS policies
CREATE POLICY "Users can view themes via session"
  ON public.life_themes FOR SELECT
  USING (
    session_id IN (SELECT id FROM public.life_themes_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create themes via session"
  ON public.life_themes FOR INSERT
  WITH CHECK (
    session_id IN (SELECT id FROM public.life_themes_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update themes via session"
  ON public.life_themes FOR UPDATE
  USING (
    session_id IN (SELECT id FROM public.life_themes_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete themes via session"
  ON public.life_themes FOR DELETE
  USING (
    session_id IN (SELECT id FROM public.life_themes_sessions WHERE user_id = auth.uid())
  );

-- life_themes_analysis RLS policies
CREATE POLICY "Users can view analysis via session"
  ON public.life_themes_analysis FOR SELECT
  USING (
    session_id IN (SELECT id FROM public.life_themes_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create analysis via session"
  ON public.life_themes_analysis FOR INSERT
  WITH CHECK (
    session_id IN (SELECT id FROM public.life_themes_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update analysis via session"
  ON public.life_themes_analysis FOR UPDATE
  USING (
    session_id IN (SELECT id FROM public.life_themes_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete analysis via session"
  ON public.life_themes_analysis FOR DELETE
  USING (
    session_id IN (SELECT id FROM public.life_themes_sessions WHERE user_id = auth.uid())
  );

-- ============================================================================
-- Triggers for updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_life_themes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_life_themes_sessions_updated_at ON public.life_themes_sessions;
CREATE TRIGGER set_life_themes_sessions_updated_at
  BEFORE UPDATE ON public.life_themes_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_life_themes_updated_at();

DROP TRIGGER IF EXISTS set_life_themes_responses_updated_at ON public.life_themes_responses;
CREATE TRIGGER set_life_themes_responses_updated_at
  BEFORE UPDATE ON public.life_themes_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_life_themes_updated_at();

DROP TRIGGER IF EXISTS set_life_themes_patterns_updated_at ON public.life_themes_patterns;
CREATE TRIGGER set_life_themes_patterns_updated_at
  BEFORE UPDATE ON public.life_themes_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_life_themes_updated_at();

DROP TRIGGER IF EXISTS set_life_themes_updated_at ON public.life_themes;
CREATE TRIGGER set_life_themes_updated_at
  BEFORE UPDATE ON public.life_themes
  FOR EACH ROW
  EXECUTE FUNCTION update_life_themes_updated_at();

-- ============================================================================
-- Table Comments (Documentation)
-- ============================================================================

COMMENT ON TABLE public.life_themes_sessions IS 'Stores Life Themes discovery sessions';
COMMENT ON COLUMN public.life_themes_sessions.status IS 'Session status: in_progress or completed';
COMMENT ON COLUMN public.life_themes_sessions.current_step IS 'Current step in the discovery process';

COMMENT ON TABLE public.life_themes_responses IS 'Stores answers to the 6 Career Construction Interview questions';
COMMENT ON COLUMN public.life_themes_responses.question_number IS 'Question 1-6 corresponding to: role_models, media, hobbies, mottos, subjects, memories';
COMMENT ON COLUMN public.life_themes_responses.response_data IS 'JSONB containing structured response data specific to each question type';
COMMENT ON COLUMN public.life_themes_responses.identified_patterns IS 'Patterns identified within this specific question';

COMMENT ON TABLE public.life_themes_patterns IS 'Stores cross-question patterns discovered during analysis';
COMMENT ON COLUMN public.life_themes_patterns.pattern_text IS 'Short description of the pattern';
COMMENT ON COLUMN public.life_themes_patterns.related_questions IS 'Array of question numbers (1-6) where this pattern appears';
COMMENT ON COLUMN public.life_themes_patterns.evidence IS 'Specific examples from responses supporting this pattern';
COMMENT ON COLUMN public.life_themes_patterns.source IS 'Whether pattern was user-identified, AI-suggested, or combined';

COMMENT ON TABLE public.life_themes IS 'Stores final prioritized life themes';
COMMENT ON COLUMN public.life_themes.theme_name IS 'Name of the life theme (e.g., "Growth", "Connection", "Challenge")';
COMMENT ON COLUMN public.life_themes.priority_rank IS 'Priority ranking (1 = most important)';
COMMENT ON COLUMN public.life_themes.enneagram_connection IS 'How this theme relates to user''s Enneagram type';

COMMENT ON TABLE public.life_themes_analysis IS 'Stores AI-generated analysis and insights';
COMMENT ON COLUMN public.life_themes_analysis.analysis_type IS 'Type of analysis: pattern_summary, theme_suggestion, enneagram_insight, career_implication, final_synthesis';

-- ============================================================================
-- Question Reference (for documentation)
-- ============================================================================
-- Q1 (role_models): Who do you admire? Who would you like to be like?
-- Q2 (media): What magazines, books, TV shows, YouTube channels do you enjoy?
-- Q3 (hobbies): What do you do in your free time? What hobbies do you have?
-- Q4 (mottos): What phrases, quotes, song lyrics, or mottos resonate with you?
-- Q5 (subjects): What subjects did you like/dislike in school?
-- Q6 (memories): What are your earliest childhood memories (ages 3-6)?
