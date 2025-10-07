# TRIVI-01: AI Conversation Management System

**Priority:** P1 (Sprint 1 - Week 1)
**Owner:** @trivikram (AI/RAG Lead)
**Type:** feature
**Estimate:** 8 hours
**Dependencies:** Supabase Auth, User Sessions

## 🎯 Objective
Implement a sophisticated conversational AI system for the Strengths Discovery module that maintains context across multiple interactions and provides personalized guidance based on user assessment data.

## ✅ Definition of Ready
- [ ] Access to Anthropic/OpenAI API keys
- [ ] Understanding of existing assessment flow
- [ ] Supabase database access configured
- [ ] TypeScript environment ready

## 📋 Acceptance Criteria
- [ ] Multi-turn conversation state management
- [ ] Context preservation across page refreshes
- [ ] Integration with user assessment results
- [ ] Personalized prompt generation
- [ ] Conversation history storage in Supabase
- [ ] Error handling and fallback responses
- [ ] Response time < 2 seconds

## 🛠️ Implementation Tasks

### 1. Core Conversation Manager
**File**: `src/lib/ai/conversation-manager.ts`

```typescript
import { createSupabaseClient } from '@/lib/supabase';

export interface ConversationState {
  sessionId: string;
  userId: string;
  module: 'strengths' | 'enneagram' | 'values' | 'career';
  context: {
    currentTopic: string;
    turnCount: number;
    extractedStrengths: string[];
    confidenceScores: Record<string, number>;
  };
  history: ConversationTurn[];
}

export interface ConversationTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    intent?: string;
    entities?: string[];
    sentiment?: number;
  };
}

export class ConversationManager {
  private state: ConversationState;
  private supabase = createSupabaseClient();

  async initializeSession(userId: string, module: string): Promise<void> {
    // Load existing conversation or create new
    // Fetch user's previous assessment results for context
  }

  async processUserInput(input: string): Promise<string> {
    // Analyze input intent
    // Update conversation state
    // Generate contextual prompt
    // Call AI API
    // Store in database
    // Return response
  }

  async saveConversation(): Promise<void> {
    // Persist to Supabase conversations table
  }

  private generateContextualPrompt(input: string): string {
    // Build prompt with user history and assessment data
  }
}
```

### 2. Database Schema for Conversations
**File**: `database/migrations/003-conversations.sql`

```sql
-- Conversation sessions table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  module VARCHAR(50) NOT NULL,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  state JSONB NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE
);

-- Conversation turns table
CREATE TABLE conversation_turns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversation_turns_conversation_id ON conversation_turns(conversation_id);
```

### 3. Strengths Discovery Integration
**File**: `src/app/api/discover/strengths/conversation/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ConversationManager } from '@/lib/ai/conversation-manager';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message, sessionId } = await req.json();

  try {
    const manager = new ConversationManager();
    await manager.initializeSession(session.user.id, 'strengths');

    const response = await manager.processUserInput(message);

    return NextResponse.json({
      response,
      sessionId: manager.getSessionId(),
      strengthsIdentified: manager.getExtractedStrengths()
    });
  } catch (error) {
    console.error('[STRENGTHS_CONVERSATION] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process conversation' },
      { status: 500 }
    );
  }
}
```

### 4. Prompt Engineering Templates
**File**: `src/lib/ai/prompts/strengths-discovery.ts`

```typescript
export const STRENGTHS_PROMPTS = {
  initial: `You are a career counselor helping a student discover their strengths.
Previous assessments show: {userContext}
Start with an open-ended question about their recent accomplishments.`,

  followUp: `Based on the user saying: "{userInput}"
They have mentioned these potential strengths: {extractedStrengths}
Ask a probing question to deeper understand their {currentTopic}.`,

  synthesis: `The user has shared these experiences: {conversationHistory}
Identified strengths include: {strengthsList}
Provide a summary and suggest how these strengths align with career paths.`
};

export function generatePrompt(
  template: string,
  context: Record<string, any>
): string {
  // Replace placeholders with actual context
  return template.replace(/{(\w+)}/g, (match, key) =>
    context[key] || match
  );
}
```

### 5. React Hook for Conversation UI
**File**: `src/hooks/useConversation.ts`

```typescript
import { useState, useCallback, useEffect } from 'react';

export function useConversation(module: string) {
  const [messages, setMessages] = useState<ConversationTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  const sendMessage = useCallback(async (content: string) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/discover/${module}/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, sessionId })
      });

      const data = await response.json();

      setMessages(prev => [
        ...prev,
        { role: 'user', content, timestamp: new Date().toISOString() },
        { role: 'assistant', content: data.response, timestamp: new Date().toISOString() }
      ]);

      if (data.sessionId) setSessionId(data.sessionId);
    } finally {
      setIsLoading(false);
    }
  }, [module, sessionId]);

  return { messages, sendMessage, isLoading, sessionId };
}
```

## 📊 Testing Requirements

### Unit Tests
```typescript
// src/lib/ai/__tests__/conversation-manager.test.ts
describe('ConversationManager', () => {
  it('should initialize session with user context');
  it('should maintain conversation state across turns');
  it('should extract strengths from user input');
  it('should handle API errors gracefully');
  it('should save conversation to database');
});
```

### Integration Tests
- Test full conversation flow from UI to database
- Verify context persistence across page refreshes
- Test concurrent conversations for same user
- Validate prompt generation with real user data

## 🎯 Definition of Done
- [ ] Conversation manager class implemented
- [ ] Database tables created and indexed
- [ ] API endpoints functional with auth
- [ ] Prompt templates created and tested
- [ ] React hook integrated in Strengths UI
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests completed
- [ ] Performance < 2s response time
- [ ] Error handling implemented
- [ ] Documentation updated
- [ ] Code review by @jonathan
- [ ] Deployed to staging

## 📈 Success Metrics
- Average response time < 2 seconds
- Conversation completion rate > 70%
- Strength identification accuracy > 80%
- User satisfaction rating > 4/5

## 🔗 Resources
- [Anthropic Claude API Docs](https://docs.anthropic.com)
- [Supabase Database Docs](https://supabase.com/docs/guides/database)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/)
- Existing code: `src/app/discover/strengths/`

## 🐛 Potential Issues & Solutions

### Issue 1: API Rate Limiting
**Solution**: Implement request queuing and caching of common responses

### Issue 2: Context Token Limits
**Solution**: Implement sliding window for conversation history

### Issue 3: Slow Response Times
**Solution**: Stream responses and show typing indicators

## 📝 Notes
- Coordinate with @jonathan on database schema changes
- Consider implementing WebSocket for real-time responses in Sprint 2
- Plan for multilingual support in future iterations