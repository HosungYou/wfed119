-- Create enneagram_sessions table for Enneagram module
CREATE TABLE IF NOT EXISTS public.enneagram_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  stage TEXT NOT NULL DEFAULT 'screener',
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  scores JSONB,
  primary_type TEXT,
  wing_estimate TEXT,
  instinct TEXT,
  confidence TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enneagram_sessions_user_id ON public.enneagram_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_enneagram_sessions_session_id ON public.enneagram_sessions(session_id);

ALTER TABLE public.enneagram_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enneagram sessions are viewable by owner"
  ON public.enneagram_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Enneagram sessions are insertable by owner"
  ON public.enneagram_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enneagram sessions are updatable by owner"
  ON public.enneagram_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.enneagram_sessions IS 'Stores Enneagram assessment sessions and results';
COMMENT ON COLUMN public.enneagram_sessions.session_id IS 'Client-side session identifier';
COMMENT ON COLUMN public.enneagram_sessions.responses IS 'Stage responses payload (screener, discriminators, wings, narrative)';
COMMENT ON COLUMN public.enneagram_sessions.scores IS 'Computed scoring output for Stage 1';
