-- Migration: Add conversation table for Life Themes module
-- Date: 2026-02-02
-- Description: Creates table for storing AI conversation sessions in Life Themes module

-- Create the life_themes_conversations table
CREATE TABLE IF NOT EXISTS life_themes_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES life_themes_sessions(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]',
  themes_suggested BOOLEAN DEFAULT false,
  themes_confirmed BOOLEAN DEFAULT false,
  suggested_themes JSONB,
  exchange_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_life_themes_conversations_session
  ON life_themes_conversations(session_id);

-- Enable Row Level Security
ALTER TABLE life_themes_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access conversations linked to their sessions
CREATE POLICY "Users can view own conversations" ON life_themes_conversations
  FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM life_themes_sessions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own conversations" ON life_themes_conversations
  FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM life_themes_sessions
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own conversations" ON life_themes_conversations
  FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM life_themes_sessions
      WHERE user_id = auth.uid()
    )
  );

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_life_themes_conversations_updated_at ON life_themes_conversations;
CREATE TRIGGER update_life_themes_conversations_updated_at
  BEFORE UPDATE ON life_themes_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment on table
COMMENT ON TABLE life_themes_conversations IS 'Stores AI conversation sessions for the Life Themes module Career Construction Interview';
COMMENT ON COLUMN life_themes_conversations.messages IS 'JSONB array of conversation messages: [{role: "ai"|"user", content: string, timestamp: string}]';
COMMENT ON COLUMN life_themes_conversations.themes_suggested IS 'Whether AI has suggested themes after 3 exchanges';
COMMENT ON COLUMN life_themes_conversations.themes_confirmed IS 'Whether user has confirmed the suggested themes';
COMMENT ON COLUMN life_themes_conversations.suggested_themes IS 'JSONB array of suggested themes from AI';
COMMENT ON COLUMN life_themes_conversations.exchange_count IS 'Number of back-and-forth exchanges (user + AI = 1 exchange)';
