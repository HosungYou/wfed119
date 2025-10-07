-- Create vision_statements table for Vision Statement module
-- This table stores users' vision statement creation process and results

CREATE TABLE IF NOT EXISTS public.vision_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    values_result_id UUID REFERENCES public.value_assessment_results(id) ON DELETE SET NULL,

    -- Step 1: Imagine Future
    future_imagery TEXT,
    future_imagery_analysis JSONB,

    -- Step 2: Discover Core Aspirations
    core_aspirations JSONB, -- Array of {keyword: string, reason: string}

    -- Step 3: Draft Vision Statement
    draft_versions JSONB, -- Array of {style: string, text: string, timestamp: string}
    statement_style TEXT, -- 'action' | 'state' | 'inspirational'

    -- Step 4: Finalize
    final_statement TEXT,
    selected_template_id TEXT,

    -- Progress tracking
    current_step INTEGER NOT NULL DEFAULT 1,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT vision_statements_user_id_unique UNIQUE (user_id),
    CONSTRAINT vision_statements_current_step_check CHECK (current_step >= 1 AND current_step <= 4)
);

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_vision_statements_user_id ON public.vision_statements(user_id);
CREATE INDEX IF NOT EXISTS idx_vision_statements_completed ON public.vision_statements(is_completed);

-- Enable Row Level Security
ALTER TABLE public.vision_statements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own vision statements
CREATE POLICY "Users can view their own vision statements"
    ON public.vision_statements
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own vision statements
CREATE POLICY "Users can create their own vision statements"
    ON public.vision_statements
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own vision statements
CREATE POLICY "Users can update their own vision statements"
    ON public.vision_statements
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own vision statements
CREATE POLICY "Users can delete their own vision statements"
    ON public.vision_statements
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vision_statements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS set_vision_statements_updated_at ON public.vision_statements;
CREATE TRIGGER set_vision_statements_updated_at
    BEFORE UPDATE ON public.vision_statements
    FOR EACH ROW
    EXECUTE FUNCTION update_vision_statements_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.vision_statements IS 'Stores user vision statement creation process and results';
COMMENT ON COLUMN public.vision_statements.user_id IS 'Reference to auth.users';
COMMENT ON COLUMN public.vision_statements.values_result_id IS 'Reference to the values assessment used as context';
COMMENT ON COLUMN public.vision_statements.future_imagery IS 'User description of their future (Step 1)';
COMMENT ON COLUMN public.vision_statements.core_aspirations IS 'Array of core aspirations with keywords and reasons (Step 2)';
COMMENT ON COLUMN public.vision_statements.draft_versions IS 'Array of vision statement drafts with style and text (Step 3)';
COMMENT ON COLUMN public.vision_statements.final_statement IS 'Finalized vision statement (Step 4)';
COMMENT ON COLUMN public.vision_statements.current_step IS 'Current step in the vision creation process (1-4)';
COMMENT ON COLUMN public.vision_statements.is_completed IS 'Whether the vision statement module is completed';
