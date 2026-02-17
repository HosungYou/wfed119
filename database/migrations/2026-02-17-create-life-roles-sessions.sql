-- ============================================================================
-- Life Roles Sessions Table
-- Module #5: Life Roles & Commitment
-- Assignment 6: Life Roles and Commitments (30 points, Week 6)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.life_roles_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  current_step INTEGER NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 5),

  -- Step 1: Relationship Mind Map (관계 마인드맵)
  life_roles JSONB DEFAULT '[]',
  -- [{id, entity, role, category, importance, source}]

  -- Step 2: Wellbeing Reflections - Sharpen the Saw (톱날 갈기)
  wellbeing_reflections JSONB DEFAULT '{}',
  -- {physical: {reflection, currentLevel, goals}, intellectual: {...}, ...}

  -- Step 3: Life Rainbow (인생 무지개)
  rainbow_data JSONB DEFAULT '{}',
  -- {currentAge, slots: [{roleId, ageStart, ageEnd, intensity}], notes}

  -- Step 4: R&C Table (역할과 헌신 표)
  role_commitments JSONB DEFAULT '[]',
  -- [{roleId, roleName, commitment, currentTimePct, desiredTimePct, gapAnalysis}]
  wellbeing_commitments JSONB DEFAULT '{}',
  -- {physical, intellectual, social_emotional, spiritual, financial}

  -- Step 5: Reflection (성찰)
  reflection JSONB DEFAULT '{}',
  -- {identityReflection, futureChanges, lessonsLearned, aiSummary, balanceAssessment}

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  CONSTRAINT life_roles_sessions_user_unique UNIQUE (user_id)
);

-- Row Level Security (same pattern as mission_sessions)
ALTER TABLE public.life_roles_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own life_roles_sessions"
  ON public.life_roles_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own life_roles_sessions"
  ON public.life_roles_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own life_roles_sessions"
  ON public.life_roles_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own life_roles_sessions"
  ON public.life_roles_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypass for API routes
CREATE POLICY "Service role full access to life_roles_sessions"
  ON public.life_roles_sessions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_life_roles_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER life_roles_sessions_updated_at
  BEFORE UPDATE ON public.life_roles_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_life_roles_sessions_updated_at();

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_life_roles_sessions_user_id
  ON public.life_roles_sessions(user_id);
