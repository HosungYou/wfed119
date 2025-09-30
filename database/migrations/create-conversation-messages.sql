-- Create conversation_messages table for storing individual AI chat messages
-- This enables full conversation history tracking and analysis

CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes for performance
  CONSTRAINT conversation_messages_session_id_idx
    FOREIGN KEY (session_id) REFERENCES user_sessions(session_id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversation_messages_session
  ON conversation_messages(session_id);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_user
  ON conversation_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_created
  ON conversation_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_role
  ON conversation_messages(role);

-- Enable Row Level Security
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own conversations
CREATE POLICY "Users can view own conversations"
  ON conversation_messages
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    session_id IN (
      SELECT session_id FROM user_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own conversations"
  ON conversation_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR
    session_id IN (
      SELECT session_id FROM user_sessions WHERE user_id = auth.uid()
    )
  );

-- Admin policy for full access
CREATE POLICY "Admins have full access"
  ON conversation_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- Add helpful comment
COMMENT ON TABLE conversation_messages IS 'Stores individual messages from AI conversations for history tracking and analysis';
COMMENT ON COLUMN conversation_messages.session_id IS 'References user_sessions.session_id';
COMMENT ON COLUMN conversation_messages.role IS 'Message sender: user, assistant, or system';
COMMENT ON COLUMN conversation_messages.metadata IS 'Additional context like stage, tokens, model used, etc.';