# WFED119 RAG Data Pipeline Guide

## Overview

Supabase 데이터베이스의 데이터를 RAG 시스템용 벡터 임베딩으로 변환하는 파이프라인 가이드입니다.

---

## 1. 데이터 파이프라인 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        RAG Data Pipeline                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌────────────┐
│  Raw Data    │───▶│  Extraction  │───▶│   Cleaning   │───▶│  Chunking  │
│  (Supabase)  │    │   & Filter   │    │  & Normalize │    │            │
└──────────────┘    └──────────────┘    └──────────────┘    └────────────┘
                                                                   │
                                                                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌────────────┐
│   RAG Use    │◀───│   pgvector   │◀───│  Embedding   │◀───│  Metadata  │
│   (Query)    │    │   Storage    │    │  Generation  │    │  Tagging   │
└──────────────┘    └──────────────┘    └──────────────┘    └────────────┘
```

---

## 2. 데이터 소스별 정제 전략

### 2.1 conversation_messages (대화 기록)

#### 원본 데이터 구조
```sql
-- 현재 테이블 구조
conversation_messages (
  id UUID,
  session_id TEXT,
  user_id UUID,
  role TEXT,           -- 'user' | 'assistant' | 'system'
  content TEXT,        -- 실제 메시지 내용
  metadata JSONB,      -- { stage, timestamp, ... }
  created_at TIMESTAMPTZ
)
```

#### 정제 전략

**문제점:**
- 개별 메시지는 맥락이 부족함
- "네", "좋아요" 같은 짧은 응답은 임베딩 가치가 낮음
- 개인정보가 포함될 수 있음

**해결책:**
1. **세션 단위로 대화 묶기** (개별 메시지 X)
2. **의미있는 대화만 필터링** (최소 4턴 이상)
3. **개인정보 익명화**
4. **AI 응답은 포함하되, 사용자 질문과 함께 문맥화**

```typescript
// 대화 정제 함수
interface ConversationChunk {
  session_id: string;
  user_id: string;
  stage: string;
  summary: string;           // AI가 생성한 대화 요약
  key_insights: string[];    // 추출된 핵심 인사이트
  strengths_mentioned: string[];
  values_mentioned: string[];
  full_context: string;      // 임베딩할 전체 텍스트
}

async function processConversations(supabase: SupabaseClient) {
  // 1. 세션별로 메시지 그룹화
  const { data: sessions } = await supabase
    .from('conversation_messages')
    .select('session_id, role, content, metadata, created_at')
    .order('created_at', { ascending: true });

  // 2. 세션별로 그룹화
  const groupedBySession = groupBy(sessions, 'session_id');

  const chunks: ConversationChunk[] = [];

  for (const [sessionId, messages] of Object.entries(groupedBySession)) {
    // 3. 최소 4턴 이상만 처리
    if (messages.length < 8) continue; // 4 user + 4 assistant

    // 4. 대화를 구조화된 텍스트로 변환
    const conversationText = formatConversation(messages);

    // 5. AI로 요약 및 인사이트 추출
    const analysis = await analyzeConversation(conversationText);

    chunks.push({
      session_id: sessionId,
      user_id: messages[0].user_id,
      stage: messages[0].metadata?.stage || 'unknown',
      summary: analysis.summary,
      key_insights: analysis.insights,
      strengths_mentioned: analysis.strengths,
      values_mentioned: analysis.values,
      full_context: buildEmbeddingText(messages, analysis)
    });
  }

  return chunks;
}

// 임베딩용 텍스트 생성
function buildEmbeddingText(messages: Message[], analysis: Analysis): string {
  return `
## Career Coaching Conversation Summary

**Stage:** ${analysis.stage}
**Topic:** ${analysis.mainTopic}

### Key Discussion Points:
${analysis.insights.map(i => `- ${i}`).join('\n')}

### Strengths Identified:
${analysis.strengths.map(s => `- ${s}`).join('\n')}

### Values Expressed:
${analysis.values.map(v => `- ${v}`).join('\n')}

### Conversation Excerpt:
${extractMeaningfulExcerpts(messages)}
  `.trim();
}
```

---

### 2.2 strength_profiles (강점 프로필)

#### 원본 데이터 구조
```sql
strength_profiles (
  id UUID,
  session_id TEXT,
  strengths JSONB,     -- { skills: [], attitudes: [], values: [] }
  summary TEXT,
  insights JSONB,
  created_at TIMESTAMPTZ
)
```

#### 정제 전략

**목적:** 유사한 강점을 가진 사용자들의 패턴을 찾아 추천에 활용

```typescript
interface StrengthEmbedding {
  profile_id: string;
  user_type: string;          // 클러스터링 결과
  skills_normalized: string[];
  attitudes_normalized: string[];
  values_normalized: string[];
  embedding_text: string;
}

async function processStrengthProfiles(supabase: SupabaseClient) {
  const { data: profiles } = await supabase
    .from('strength_profiles')
    .select('*');

  const processed: StrengthEmbedding[] = [];

  for (const profile of profiles) {
    const strengths = profile.strengths as {
      skills: string[];
      attitudes: string[];
      values: string[];
    };

    // 1. 강점 정규화 (유사 표현 통합)
    const normalizedSkills = normalizeStrengths(strengths.skills, SKILL_SYNONYMS);
    const normalizedAttitudes = normalizeStrengths(strengths.attitudes, ATTITUDE_SYNONYMS);
    const normalizedValues = normalizeStrengths(strengths.values, VALUE_SYNONYMS);

    // 2. 임베딩 텍스트 생성
    const embeddingText = `
## Career Strength Profile

### Core Skills:
${normalizedSkills.map(s => `- ${s}`).join('\n')}

### Work Attitudes:
${normalizedAttitudes.map(a => `- ${a}`).join('\n')}

### Personal Values:
${normalizedValues.map(v => `- ${v}`).join('\n')}

### Profile Summary:
This individual demonstrates strong capabilities in ${normalizedSkills.slice(0, 3).join(', ')}.
Their work approach is characterized by ${normalizedAttitudes.slice(0, 2).join(' and ')}.
They prioritize ${normalizedValues.slice(0, 2).join(' and ')} in their career decisions.
    `.trim();

    processed.push({
      profile_id: profile.id,
      user_type: classifyProfile(normalizedSkills, normalizedAttitudes, normalizedValues),
      skills_normalized: normalizedSkills,
      attitudes_normalized: normalizedAttitudes,
      values_normalized: normalizedValues,
      embedding_text: embeddingText
    });
  }

  return processed;
}

// 강점 정규화 (유사 표현 통합)
const SKILL_SYNONYMS: Record<string, string> = {
  'problem solving': 'Problem-Solving',
  'problem-solving': 'Problem-Solving',
  'solving problems': 'Problem-Solving',
  'communication': 'Communication',
  'communicating': 'Communication',
  'verbal skills': 'Communication',
  'leadership': 'Leadership',
  'leading teams': 'Leadership',
  'team leadership': 'Leadership',
  // ... 더 많은 동의어
};

function normalizeStrengths(strengths: string[], synonyms: Record<string, string>): string[] {
  return strengths.map(s => {
    const lower = s.toLowerCase().trim();
    return synonyms[lower] || capitalizeWords(s);
  });
}
```

---

### 2.3 value_results (가치 평가 결과)

#### 원본 데이터 구조
```sql
value_results (
  id UUID,
  user_id UUID,
  value_set TEXT,      -- 'terminal' | 'instrumental' | 'work'
  layout JSONB,        -- 카드 배치 결과
  top3 TEXT[],         -- 상위 3개 가치
  created_at TIMESTAMPTZ
)
```

#### 정제 전략

```typescript
interface ValueEmbedding {
  user_id: string;
  terminal_values: string[];    // 궁극적 가치
  instrumental_values: string[]; // 수단적 가치
  work_values: string[];         // 직업 가치
  value_profile: string;         // 가치 프로필 설명
  embedding_text: string;
}

async function processValueResults(supabase: SupabaseClient) {
  // 사용자별로 모든 가치 결과 조회
  const { data: results } = await supabase
    .from('value_results')
    .select('user_id, value_set, top3')
    .order('updated_at', { ascending: false });

  // 사용자별로 그룹화
  const userValues = groupBy(results, 'user_id');

  const processed: ValueEmbedding[] = [];

  for (const [userId, values] of Object.entries(userValues)) {
    const terminal = values.find(v => v.value_set === 'terminal')?.top3 || [];
    const instrumental = values.find(v => v.value_set === 'instrumental')?.top3 || [];
    const work = values.find(v => v.value_set === 'work')?.top3 || [];

    // 가치 프로필 생성
    const profile = generateValueProfile(terminal, instrumental, work);

    const embeddingText = `
## Personal Values Profile

### Life Goals (Terminal Values):
${terminal.map((v, i) => `${i + 1}. ${v}`).join('\n')}

### Character Traits (Instrumental Values):
${instrumental.map((v, i) => `${i + 1}. ${v}`).join('\n')}

### Career Priorities (Work Values):
${work.map((v, i) => `${i + 1}. ${v}`).join('\n')}

### Values Interpretation:
${profile}

### Career Alignment Suggestions:
${suggestCareersBasedOnValues(terminal, instrumental, work)}
    `.trim();

    processed.push({
      user_id: userId,
      terminal_values: terminal,
      instrumental_values: instrumental,
      work_values: work,
      value_profile: profile,
      embedding_text: embeddingText
    });
  }

  return processed;
}

// 가치 조합에 따른 프로필 생성
function generateValueProfile(
  terminal: string[],
  instrumental: string[],
  work: string[]
): string {
  // 가치 패턴 분석
  const hasAchievement = terminal.some(v =>
    ['Achievement', 'Success', 'Recognition'].includes(v)
  );
  const hasRelationship = terminal.some(v =>
    ['Family Security', 'True Friendship', 'Love'].includes(v)
  );
  const hasAutonomy = work.some(v =>
    ['Independence', 'Creativity', 'Flexibility'].includes(v)
  );

  if (hasAchievement && hasAutonomy) {
    return 'This person is driven by personal achievement and values independence. They likely thrive in entrepreneurial or leadership roles where they can make autonomous decisions and be recognized for their accomplishments.';
  }

  if (hasRelationship && !hasAchievement) {
    return 'This person prioritizes relationships and security over personal achievement. They may excel in supportive roles, team environments, or careers focused on helping others.';
  }

  // ... 더 많은 패턴
  return 'This person has a balanced value system with diverse priorities.';
}
```

---

## 3. 임베딩 생성 및 저장

### 3.1 데이터베이스 스키마

```sql
-- pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 통합 임베딩 테이블
CREATE TABLE rag_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 소스 정보
  source_type TEXT NOT NULL CHECK (source_type IN (
    'conversation', 'strength_profile', 'value_result', 'textbook'
  )),
  source_id TEXT,              -- 원본 레코드 ID
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- 임베딩 콘텐츠
  content TEXT NOT NULL,       -- 임베딩된 원본 텍스트
  embedding VECTOR(1536),      -- OpenAI text-embedding-3-small

  -- 메타데이터 (필터링용)
  metadata JSONB DEFAULT '{}'::jsonb,
  -- metadata 예시:
  -- conversation: { stage, topic, message_count }
  -- strength: { skills, attitudes, values, user_type }
  -- value: { terminal, instrumental, work }

  -- 검색 최적화
  is_anonymized BOOLEAN DEFAULT false,
  is_aggregated BOOLEAN DEFAULT false,  -- 여러 사용자 데이터 통합 여부

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 벡터 검색 인덱스 (HNSW - 빠른 근사 검색)
CREATE INDEX ON rag_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 필터링용 인덱스
CREATE INDEX idx_rag_source_type ON rag_embeddings(source_type);
CREATE INDEX idx_rag_user_id ON rag_embeddings(user_id);
CREATE INDEX idx_rag_metadata ON rag_embeddings USING gin(metadata);
```

### 3.2 임베딩 생성 코드

```typescript
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 배치 임베딩 생성
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });

  return response.data.map(d => d.embedding);
}

// 임베딩 저장
async function storeEmbeddings(
  items: Array<{
    source_type: string;
    source_id: string;
    user_id?: string;
    content: string;
    metadata: Record<string, any>;
  }>
) {
  // 배치 크기 제한 (OpenAI: 최대 2048개)
  const BATCH_SIZE = 100;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const texts = batch.map(item => item.content);

    // 임베딩 생성
    const embeddings = await generateEmbeddings(texts);

    // Supabase에 저장
    const records = batch.map((item, idx) => ({
      source_type: item.source_type,
      source_id: item.source_id,
      user_id: item.user_id,
      content: item.content,
      embedding: embeddings[idx],
      metadata: item.metadata,
    }));

    const { error } = await supabase
      .from('rag_embeddings')
      .upsert(records, { onConflict: 'source_type,source_id' });

    if (error) {
      console.error('Failed to store embeddings:', error);
      throw error;
    }

    console.log(`Stored batch ${i / BATCH_SIZE + 1}/${Math.ceil(items.length / BATCH_SIZE)}`);
  }
}
```

---

## 4. RAG 검색 쿼리

### 4.1 유사도 검색 함수

```sql
-- Supabase에서 벡터 검색 함수 생성
CREATE OR REPLACE FUNCTION search_rag_embeddings(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 5,
  filter_source_type TEXT DEFAULT NULL,
  filter_user_id UUID DEFAULT NULL,
  similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  source_type TEXT,
  source_id TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.source_type,
    e.source_id,
    e.content,
    e.metadata,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM rag_embeddings e
  WHERE
    (filter_source_type IS NULL OR e.source_type = filter_source_type)
    AND (filter_user_id IS NULL OR e.user_id = filter_user_id OR e.is_anonymized = true)
    AND (1 - (e.embedding <=> query_embedding)) > similarity_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### 4.2 TypeScript에서 RAG 쿼리

```typescript
// RAG 검색 API
async function searchRAG(
  query: string,
  options: {
    sourceTypes?: string[];
    userId?: string;
    limit?: number;
    includePersonal?: boolean;  // 개인 데이터 포함 여부
  } = {}
) {
  const { sourceTypes, userId, limit = 5, includePersonal = true } = options;

  // 1. 쿼리 임베딩 생성
  const queryEmbedding = await generateEmbeddings([query]);

  // 2. 벡터 검색
  const { data: results, error } = await supabase.rpc('search_rag_embeddings', {
    query_embedding: queryEmbedding[0],
    match_count: limit,
    filter_source_type: sourceTypes?.[0] || null,
    filter_user_id: includePersonal ? userId : null,
    similarity_threshold: 0.7
  });

  if (error) throw error;

  return results;
}

// Chat API에서 RAG 사용
async function generateRAGResponse(
  userMessage: string,
  userId: string,
  sessionContext: SessionContext
) {
  // 1. 관련 컨텍스트 검색
  const ragResults = await searchRAG(userMessage, {
    userId,
    sourceTypes: ['textbook', 'strength_profile', 'conversation'],
    limit: 3,
    includePersonal: true
  });

  // 2. 컨텍스트 구성
  const ragContext = ragResults.map(r =>
    `[Source: ${r.source_type}]\n${r.content}`
  ).join('\n\n---\n\n');

  // 3. 프롬프트에 RAG 컨텍스트 추가
  const systemPrompt = `
You are a career coach using the LifeCraft methodology.

## Relevant Context (from knowledge base):
${ragContext}

## Instructions:
- Use the context above to provide personalized, grounded responses
- Reference the LifeCraft methodology when applicable
- If context includes user's previous conversations or assessments, acknowledge their journey
  `;

  // 4. AI 응답 생성
  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    max_tokens: 600
  });

  return response;
}
```

---

## 5. 데이터 파이프라인 스케줄링

### 5.1 증분 업데이트 전략

```typescript
// 새로운 데이터만 임베딩 (증분 업데이트)
async function incrementalUpdate() {
  // 마지막 업데이트 시간 조회
  const { data: lastRun } = await supabase
    .from('rag_pipeline_runs')
    .select('completed_at')
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  const sinceDate = lastRun?.completed_at || '1970-01-01';

  // 새로운 대화 처리
  const { data: newConversations } = await supabase
    .from('conversation_messages')
    .select('*')
    .gt('created_at', sinceDate);

  if (newConversations?.length) {
    const processed = await processConversations(newConversations);
    await storeEmbeddings(processed.map(c => ({
      source_type: 'conversation',
      source_id: c.session_id,
      user_id: c.user_id,
      content: c.full_context,
      metadata: {
        stage: c.stage,
        insights: c.key_insights,
        strengths: c.strengths_mentioned
      }
    })));
  }

  // 파이프라인 실행 기록
  await supabase.from('rag_pipeline_runs').insert({
    completed_at: new Date().toISOString(),
    records_processed: newConversations?.length || 0
  });
}
```

### 5.2 스케줄링 (Supabase Edge Functions 또는 Cron)

```typescript
// supabase/functions/rag-update/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async () => {
  try {
    await incrementalUpdate();
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    });
  }
});

// cron: 매일 새벽 2시 실행
// supabase functions deploy rag-update --schedule "0 2 * * *"
```

---

## 6. 개인정보 보호 고려사항

### 6.1 익명화 전략

```typescript
// 개인정보 익명화
function anonymizeContent(content: string, userId: string): string {
  // 이름 패턴 제거
  let anonymized = content.replace(
    /\b(I'm|I am|my name is)\s+[A-Z][a-z]+/gi,
    '$1 [NAME]'
  );

  // 이메일 제거
  anonymized = anonymized.replace(
    /[\w.-]+@[\w.-]+\.\w+/g,
    '[EMAIL]'
  );

  // 전화번호 제거
  anonymized = anonymized.replace(
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    '[PHONE]'
  );

  // 회사명 (일반적인 패턴)
  anonymized = anonymized.replace(
    /\b(at|with|for)\s+[A-Z][A-Za-z]+\s+(Inc|Corp|LLC|Company)/gi,
    '$1 [COMPANY]'
  );

  return anonymized;
}
```

### 6.2 RLS 정책

```sql
-- 개인 데이터는 본인만 접근 가능
CREATE POLICY "Users can access own RAG data"
  ON rag_embeddings
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_anonymized = true
    OR source_type = 'textbook'  -- 교재는 모두 접근 가능
  );
```

---

## Summary

| 데이터 소스 | 정제 방법 | 임베딩 단위 | 업데이트 주기 |
|-------------|-----------|-------------|---------------|
| conversation_messages | 세션 묶음 + 요약 | 세션당 1개 | 실시간/일일 |
| strength_profiles | 정규화 + 프로필 생성 | 프로필당 1개 | 생성 시 |
| value_results | 가치 조합 해석 | 사용자당 1개 | 변경 시 |
| LifeCraft Textbook | 청킹 (500토큰) | 챕터당 10-20개 | 1회 |

이 파이프라인을 구현하면 WFED119의 모든 사용자 데이터를 효과적으로 RAG에 활용할 수 있습니다.
