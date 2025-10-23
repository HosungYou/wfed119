# Conversation Storage System

## Overview

WFED119 now includes a comprehensive conversation storage system that saves all AI chat interactions to Supabase. This enables conversation history tracking, analytics, and user data persistence.

## Architecture

### Database Schema

**Table: `conversation_messages`**

```sql
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `session_id` - Fast lookup by session
- `user_id` - User-specific queries
- `created_at` - Chronological ordering
- `role` - Filter by message sender

### Data Flow

```
User Input → Chat API → AI Service → Response
     ↓                                    ↓
     └─────────→ Supabase ←──────────────┘
                    ↓
          conversation_messages table
```

## Features

### 1. Automatic Message Storage

All messages are automatically saved when a user interacts with the AI:

**What gets saved:**
- User messages
- AI assistant responses
- Session context (stage, message count)
- Timestamps

**Storage trigger:** Every chat interaction via `/api/chat`

### 2. Conversation Retrieval

**Get conversation for a session:**
```bash
GET /api/conversations/{sessionId}
```

**Response:**
```json
{
  "sessionId": "abc-123",
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "Tell me about my strengths",
      "metadata": { "stage": "initial" },
      "created_at": "2025-09-30T10:00:00Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "I'd love to help you discover your strengths...",
      "metadata": { "stage": "initial", "messageCount": 2 },
      "created_at": "2025-09-30T10:00:05Z"
    }
  ],
  "count": 2
}
```

**Get all user's conversations:**
```bash
GET /api/conversations
```

**Response:**
```json
{
  "sessions": [
    {
      "session_id": "abc-123",
      "session_type": "strengths",
      "current_stage": "summary",
      "completed": true,
      "messageCount": 18,
      "created_at": "2025-09-30T10:00:00Z",
      "updated_at": "2025-09-30T10:30:00Z"
    }
  ],
  "count": 1
}
```

### 3. Conversation Deletion (GDPR Compliance)

Users can delete their conversation history:

```bash
DELETE /api/conversations/{sessionId}
```

**Response:**
```json
{
  "success": true,
  "message": "Conversation messages deleted successfully",
  "sessionId": "abc-123"
}
```

## Security & Privacy

### Row Level Security (RLS)

Supabase RLS policies ensure:
- Users can only access their own conversations
- Admins have full access for support purposes
- Session validation prevents unauthorized access

**RLS Policies:**

```sql
-- Users can view own conversations
CREATE POLICY "Users can view own conversations"
  ON conversation_messages FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    session_id IN (
      SELECT session_id FROM user_sessions WHERE user_id = auth.uid()
    )
  );

-- Admins have full access
CREATE POLICY "Admins have full access"
  ON conversation_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );
```

### Data Retention

- **Active conversations:** Stored indefinitely
- **Completed sessions:** Retained for user reference
- **Deleted by user:** Permanently removed (GDPR compliant)
- **Inactive accounts:** Follow your data retention policy

## Implementation Details

### Chat API Integration

The chat API (`/api/chat/route.ts`) automatically saves messages:

```typescript
// Save user message
const userMessageData = {
  session_id: sessionId,
  user_id: userId,
  role: 'user',
  content: lastMessage.content,
  metadata: {
    stage: currentStage,
    timestamp: new Date().toISOString()
  }
};

// Save assistant response
const assistantMessageData = {
  session_id: sessionId,
  user_id: userId,
  role: 'assistant',
  content: response,
  metadata: {
    stage: currentStage,
    timestamp: new Date().toISOString(),
    messageCount: messages.length + 1
  }
};

// Insert both messages
await supabase
  .from('conversation_messages')
  .insert([userMessageData, assistantMessageData]);
```

### Metadata Structure

The `metadata` JSONB field stores context:

```json
{
  "stage": "initial" | "deepening" | "synthesis" | "summary",
  "timestamp": "2025-09-30T10:00:00Z",
  "messageCount": 5,
  "model": "claude-3-5-sonnet",
  "tokens": 1234
}
```

**Extensible for future needs:**
- Token usage tracking
- Model version
- Response time
- Sentiment analysis
- Topic extraction

## Setup Instructions

### 1. Run Migration

Execute in Supabase SQL Editor:

```bash
# From project root
cat database/migrations/create-conversation-messages.sql
```

Copy and run the entire SQL script in Supabase Dashboard > SQL Editor

### 2. Verify Installation

```sql
-- Check table exists
SELECT * FROM conversation_messages LIMIT 1;

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'conversation_messages';
```

### 3. Test Conversation Storage

1. Start development server: `npm run dev`
2. Open Strength Discovery chat
3. Send a message
4. Check Supabase Dashboard > Table Editor > conversation_messages

## Usage Examples

### Frontend: Display Conversation History

```typescript
async function loadConversationHistory(sessionId: string) {
  const response = await fetch(`/api/conversations/${sessionId}`);
  const data = await response.json();

  return data.messages.map(msg => ({
    role: msg.role,
    content: msg.content,
    timestamp: new Date(msg.created_at)
  }));
}
```

### Analytics: Message Count by Stage

```sql
SELECT
  metadata->>'stage' as stage,
  COUNT(*) as message_count,
  COUNT(DISTINCT session_id) as session_count
FROM conversation_messages
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY metadata->>'stage'
ORDER BY message_count DESC;
```

### Analytics: Average Messages per Session

```sql
SELECT
  session_id,
  COUNT(*) / 2 as turn_count,  -- Divide by 2 (user + assistant)
  MAX(created_at) - MIN(created_at) as duration
FROM conversation_messages
GROUP BY session_id
ORDER BY turn_count DESC;
```

## Monitoring & Maintenance

### Storage Growth

Monitor table size:

```sql
SELECT
  pg_size_pretty(pg_total_relation_size('conversation_messages')) as total_size,
  COUNT(*) as message_count,
  COUNT(DISTINCT session_id) as unique_sessions
FROM conversation_messages;
```

### Performance Optimization

Indexes are automatically created, but monitor query performance:

```sql
-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read
FROM pg_stat_user_indexes
WHERE tablename = 'conversation_messages';
```

### Archiving Old Conversations

Optional: Archive conversations older than 1 year:

```sql
-- Create archive table
CREATE TABLE conversation_messages_archive (LIKE conversation_messages);

-- Move old data
INSERT INTO conversation_messages_archive
SELECT * FROM conversation_messages
WHERE created_at < NOW() - INTERVAL '1 year';

-- Delete from main table
DELETE FROM conversation_messages
WHERE created_at < NOW() - INTERVAL '1 year';
```

## Troubleshooting

### Messages Not Saving

**Check:**
1. User is authenticated: `supabase.auth.getSession()`
2. RLS policies allow insert
3. `session_id` exists in `user_sessions` table
4. Console logs for errors: `[CHAT_API] Failed to save conversation`

**Debug query:**
```sql
SELECT * FROM conversation_messages
WHERE user_id = 'your-user-uuid'
ORDER BY created_at DESC
LIMIT 10;
```

### Permission Denied

**Issue:** RLS policy blocking access

**Solution:**
```sql
-- Check current user
SELECT auth.uid();

-- Verify policy allows access
SELECT * FROM conversation_messages
WHERE user_id = auth.uid();
```

### Foreign Key Constraint

**Error:** `session_id` references non-existent session

**Solution:** Ensure session exists in `user_sessions` before inserting messages

## Migration from Prisma

Previous Prisma-based storage has been completely replaced with Supabase:

**Removed:**
- ❌ Prisma Client
- ❌ `prisma/schema.prisma`
- ❌ Migration scripts
- ❌ Local SQLite database

**Migrated to:**
- ✅ Supabase PostgreSQL
- ✅ Supabase Auth integration
- ✅ Real-time capabilities
- ✅ Built-in RLS security
- ✅ Dashboard management

## Future Enhancements

Potential additions:

1. **Real-time Updates:** Use Supabase Realtime to stream messages
2. **Full-text Search:** PostgreSQL full-text search on content
3. **Conversation Export:** Download as JSON/PDF/Markdown
4. **Conversation Sharing:** Share read-only link with coaches
5. **AI Analysis:** Aggregate insights across conversations
6. **Voice Transcription:** Store audio → text conversations

## Related Documentation

- [Supabase Setup Guide](./collaboration/COLLABORATOR_SETUP.md)
- [Database Architecture](./database/SCHEMA.md)
- [API Documentation](./api/README.md)
- [Admin Management](../scripts/admin-management.sql)