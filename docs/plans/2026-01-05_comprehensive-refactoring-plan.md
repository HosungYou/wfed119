# WFED119 Comprehensive Refactoring Plan

## 프론트엔드-백엔드-데이터베이스 연결성 강화 및 인증 통합

**작성일:** November 2025
**버전:** 1.0
**목표:** 모듈 간 연결성 확보, 인증 통합, RAG 시스템 준비

---

## Executive Summary

### 현재 문제점

| 영역 | 문제 | 영향 |
|------|------|------|
| **인증** | NextAuth + Supabase Auth 이중 시스템 | RLS 정책 미작동, 세션 불일치 |
| **데이터 연결** | 모듈별 독립적 데이터 접근 | 모듈 간 데이터 공유 불가 |
| **선수조건** | 모듈 순서 강제 없음 | 불완전한 데이터로 진행 가능 |
| **상태 관리** | Zustand + Supabase 혼용 | 데이터 동기화 문제 |
| **코드 정리** | 중복 폴더 존재 (discover 2, conversations 2) | 유지보수 어려움 |

### 리팩토링 목표

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Target Architecture                               │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │   Supabase Auth     │
                    │   (Single Source)   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   auth.uid() = ID   │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   Frontend    │    │   API Routes  │    │   Database    │
│  Components   │◄──►│  (Validated)  │◄──►│  (RLS Active) │
└───────────────┘    └───────────────┘    └───────────────┘
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Module Dependency  │
                    │      Manager        │
                    └─────────────────────┘
```

---

## 1. 현재 아키텍처 분석

### 1.1 모듈 구조 및 의존성

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WFED119 Module Dependency Graph                       │
└─────────────────────────────────────────────────────────────────────────┘

Layer 1 (기초)
┌─────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                  │
│  │   Values    │    │  Strengths  │    │  Enneagram  │   ← 독립 실행    │
│  │  Discovery  │    │  Discovery  │    │    Test     │     가능         │
│  └──────┬──────┘    └──────┬──────┘    └─────────────┘                  │
│         │                  │                                             │
└─────────┼──────────────────┼─────────────────────────────────────────────┘
          │                  │
          ▼                  ▼
Layer 2 (통합)
┌─────────────────────────────────────────────────────────────────────────┐
│         ┌──────────────────────────────┐                                │
│         │      Vision Statement        │   ← Values + Strengths         │
│         │   (Step 1: Time Horizon)     │     데이터 참조 필요           │
│         │   (Step 2: Core Aspirations) │                                │
│         │   (Step 3: Final Statement)  │                                │
│         └──────────────┬───────────────┘                                │
│                        │                                                │
└────────────────────────┼────────────────────────────────────────────────┘
                         │
                         ▼
Layer 3 (전략)
┌─────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      SWOT Analysis                               │    │
│  │  (Discovery → Strategy → Goals → Action → Reflection)           │    │
│  │                                                                  │    │
│  │  Required: Vision Statement (goal/vision 입력)                  │    │
│  │  Optional: Strengths (S 영역 자동 채우기)                       │    │
│  └──────────────────────────────┬──────────────────────────────────┘    │
│                                 │                                        │
└─────────────────────────────────┼────────────────────────────────────────┘
                                  │
                                  ▼
Layer 4 (실행)
┌─────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                       Dream List                                 │    │
│  │  (Categories → Timeline → Integration)                          │    │
│  │                                                                  │    │
│  │  Enriched by: All previous modules                              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1.2 현재 데이터 흐름 문제

| 모듈 | 데이터 테이블 | ID 기준 | 문제점 |
|------|--------------|---------|--------|
| Values | `value_assessment_results` | `user_id` | ✅ 정상 |
| Strengths | `strength_profiles` | `session_id` | ❌ user_id 연결 약함 |
| Strengths | `strength_discovery_results` | `user_id` | ✅ 정상 |
| Vision | `vision_statements` | `user_id` | ✅ 정상 |
| SWOT | `swot_analyses` | `user_id` | ✅ 정상 |
| Chat | `conversation_messages` | `session_id` | ❌ user_id 연결 약함 |
| Chat | `user_sessions` | `user_id` + `session_id` | ⚠️ 복합 키 |

### 1.3 인증 흐름 문제

```
현재 문제 상황:

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  User Login                                                              │
│      │                                                                   │
│      ├───────────────────┐                                               │
│      │                   │                                               │
│      ▼                   ▼                                               │
│  ┌─────────┐        ┌─────────┐                                         │
│  │NextAuth │        │Supabase │                                         │
│  │  OAuth  │        │  Auth   │                                         │
│  └────┬────┘        └────┬────┘                                         │
│       │                  │                                               │
│       ▼                  ▼                                               │
│  ┌─────────┐        ┌─────────┐                                         │
│  │JWT Token│        │Supabase │                                         │
│  │(Client) │        │ Session │                                         │
│  └────┬────┘        └────┬────┘                                         │
│       │                  │                                               │
│       │    ✗ NOT SYNCED  │                                               │
│       │                  │                                               │
│       ▼                  ▼                                               │
│  Frontend            API Routes                                          │
│  (session.user)      (auth.uid() = NULL!)                               │
│                                                                          │
│  → RLS policies FAIL because auth.uid() doesn't match NextAuth user     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 리팩토링 단계별 계획

### Phase 1: 인증 통합 (Week 1-2)

#### 1.1 Supabase Auth 단일화

**목표:** NextAuth 제거, Supabase Auth로 통합

```
수정 대상 파일:
├── src/app/api/auth/[...nextauth]/route.ts  → 삭제
├── src/middleware.ts                         → Supabase SSR로 교체
├── src/lib/supabase-server.ts               → 유지 (이미 정상)
├── src/lib/supabase-client-auth.ts          → 검토/통합
├── src/types/next-auth.d.ts                 → 삭제
└── package.json                             → next-auth 제거
```

**마이그레이션 단계:**

| 단계 | 작업 | 위험도 | 롤백 가능 |
|------|------|--------|-----------|
| 1 | Supabase Dashboard에서 Google OAuth 설정 | 낮음 | ✅ |
| 2 | 기존 사용자 데이터 백업 | 낮음 | ✅ |
| 3 | Auth callback route 업데이트 | 중간 | ✅ |
| 4 | Middleware 업데이트 | 중간 | ✅ |
| 5 | NextAuth 관련 코드 제거 | 중간 | ✅ |
| 6 | 테스트 및 검증 | - | - |

#### 1.2 Auth Context 생성

```typescript
// src/contexts/AuthContext.tsx (신규)
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}
```

**적용 대상:**
- 모든 Protected 페이지
- Dashboard
- API Routes (서버 사이드)

---

### Phase 2: 모듈 의존성 관리 시스템 (Week 3-4)

#### 2.1 ModuleProgress Service

**목표:** 모듈 완료 상태 및 선수조건 통합 관리

```typescript
// src/services/ModuleProgressService.ts (신규)

interface ModuleDefinition {
  id: string;
  name: string;
  prerequisites: string[];
  requiredFields: string[];
  table: string;
  completionField: string;
}

const MODULE_DEFINITIONS: ModuleDefinition[] = [
  {
    id: 'values',
    name: 'Values Discovery',
    prerequisites: [],  // 선수조건 없음
    requiredFields: ['terminal_values_sorted', 'instrumental_values_sorted', 'work_values_sorted'],
    table: 'value_assessment_results',
    completionField: 'is_completed'
  },
  {
    id: 'strengths',
    name: 'Strengths Discovery',
    prerequisites: [],  // 선수조건 없음
    requiredFields: ['final_strengths'],
    table: 'strength_discovery_results',
    completionField: 'is_completed'
  },
  {
    id: 'vision',
    name: 'Vision Statement',
    prerequisites: ['values', 'strengths'],  // Values + Strengths 완료 권장
    requiredFields: ['final_statement', 'core_aspirations'],
    table: 'vision_statements',
    completionField: 'is_completed'
  },
  {
    id: 'swot',
    name: 'SWOT Analysis',
    prerequisites: ['vision'],  // Vision 필수
    requiredFields: ['strengths', 'weaknesses', 'opportunities', 'threats'],
    table: 'swot_analyses',
    completionField: 'is_completed'
  },
  {
    id: 'dreams',
    name: 'Dream List',
    prerequisites: [],  // 선수조건 없음 (독립 실행)
    requiredFields: ['dreams'],
    table: 'dream_lists',
    completionField: 'is_completed'
  }
];

class ModuleProgressService {
  async getModuleStatus(userId: string, moduleId: string): Promise<ModuleStatus>;
  async checkPrerequisites(userId: string, moduleId: string): Promise<PrerequisiteResult>;
  async getAllProgress(userId: string): Promise<UserProgress>;
  async getAvailableModules(userId: string): Promise<string[]>;
}
```

#### 2.2 선수조건 Gate Component

```typescript
// src/components/ModuleGate.tsx (신규)

interface ModuleGateProps {
  moduleId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  softGate?: boolean;  // true면 경고만, false면 차단
}

// 사용 예시
<ModuleGate moduleId="swot" softGate={false}>
  <SWOTAnalysisPage />
</ModuleGate>
```

#### 2.3 Dashboard 연동

Dashboard에서 모듈별 상태 시각화:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Module Progress Flow                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────┐     ┌──────────┐     ┌──────────┐                        │
│   │  Values  │────▶│Strengths │────▶│  Vision  │                        │
│   │   ✅     │     │   ✅     │     │   ⏳     │                        │
│   └──────────┘     └──────────┘     └────┬─────┘                        │
│                                          │                               │
│                                          ▼                               │
│                                    ┌──────────┐     ┌──────────┐        │
│                                    │   SWOT   │────▶│  Dreams  │        │
│                                    │   🔒     │     │   🔒     │        │
│                                    └──────────┘     └──────────┘        │
│                                                                          │
│   Legend: ✅ Complete | ⏳ In Progress | 🔒 Locked | ⬚ Not Started     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 3: 데이터 연결성 강화 (Week 5-6)

#### 3.1 User Profile Aggregation

**목표:** 모든 모듈 데이터를 user_id 기준으로 통합 조회

```sql
-- 사용자 통합 프로필 뷰 생성
CREATE VIEW user_complete_profile AS
SELECT
  u.id as user_id,
  u.email,
  u.name,

  -- Values
  var.terminal_values_sorted,
  var.instrumental_values_sorted,
  var.work_values_sorted,
  var.is_completed as values_completed,

  -- Strengths
  sdr.final_strengths,
  sdr.is_completed as strengths_completed,

  -- Vision
  vs.final_statement as vision_statement,
  vs.core_aspirations,
  vs.time_horizon,
  vs.is_completed as vision_completed,

  -- SWOT
  sa.strengths as swot_strengths,
  sa.weaknesses as swot_weaknesses,
  sa.opportunities as swot_opportunities,
  sa.threats as swot_threats,
  sa.current_stage as swot_stage,
  sa.is_completed as swot_completed

FROM auth.users u
LEFT JOIN value_assessment_results var ON u.id = var.user_id
LEFT JOIN strength_discovery_results sdr ON u.id = sdr.user_id
LEFT JOIN vision_statements vs ON u.id = vs.user_id
LEFT JOIN swot_analyses sa ON u.id = sa.user_id;
```

#### 3.2 Cross-Module Data Injection

**자동 데이터 연결 예시:**

| From Module | To Module | Data Transfer |
|-------------|-----------|---------------|
| Values | Vision Step 2 | Top 3 terminal values → Core Aspirations 제안 |
| Strengths | SWOT | Final strengths → SWOT "S" 영역 자동 채우기 |
| Vision | SWOT | Final statement → SWOT goal/vision 자동 입력 |
| All modules | Dashboard | 통합 인사이트 생성 |

```typescript
// src/services/DataInjectionService.ts (신규)

class DataInjectionService {
  // Vision 모듈 시작 시 호출
  async getVisionContext(userId: string): Promise<VisionContext> {
    const values = await this.getTopValues(userId);
    const strengths = await this.getTopStrengths(userId);

    return {
      suggestedKeywords: this.generateKeywordSuggestions(values, strengths),
      valueThemes: this.extractValueThemes(values),
      strengthThemes: this.extractStrengthThemes(strengths)
    };
  }

  // SWOT 모듈 시작 시 호출
  async getSWOTContext(userId: string): Promise<SWOTContext> {
    const vision = await this.getVisionStatement(userId);
    const strengths = await this.getUserStrengths(userId);

    return {
      visionStatement: vision.final_statement,
      prefilledStrengths: strengths.map(s => s.name),
      suggestedOpportunities: this.generateOpportunities(vision, strengths)
    };
  }
}
```

---

### Phase 4: Session-User ID 통합 (Week 7)

#### 4.1 Session 테이블 정규화

**문제:** `strength_profiles`, `conversation_messages`가 `session_id`만 사용

**해결책:**

```sql
-- 1. session_id → user_id 매핑 확보
ALTER TABLE strength_profiles
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. 기존 데이터 마이그레이션
UPDATE strength_profiles sp
SET user_id = us.user_id
FROM user_sessions us
WHERE sp.session_id = us.session_id
AND sp.user_id IS NULL;

-- 3. conversation_messages도 동일하게 처리
-- (이미 user_id 컬럼 있음, NULL 값 채우기)
UPDATE conversation_messages cm
SET user_id = us.user_id
FROM user_sessions us
WHERE cm.session_id = us.session_id
AND cm.user_id IS NULL;
```

#### 4.2 ChatInterface 인증 연동

```typescript
// 현재: session_id만 사용
const { sessionId } = useSessionStore();

// 변경: user_id 우선, 비로그인 시 session_id 폴백
const { user } = useAuth();
const { sessionId } = useSessionStore();

const effectiveId = user?.id || sessionId;
const isAuthenticated = !!user;

// API 호출 시 인증 상태 전달
await fetch('/api/chat/stream', {
  headers: {
    'Content-Type': 'application/json',
    ...(isAuthenticated && { 'Authorization': `Bearer ${session.access_token}` })
  },
  body: JSON.stringify({
    sessionId,
    userId: user?.id,  // 추가
    messages,
    ...
  })
});
```

---

### Phase 5: API Routes 표준화 (Week 8)

#### 5.1 API Route 패턴 통일

```typescript
// src/lib/api/withAuth.ts (신규)

export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest) => {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return handler(req, { user, supabase });
  };
}

// 사용 예시
export const GET = withAuth(async (req, { user, supabase }) => {
  // user.id로 RLS 자동 적용
  const { data } = await supabase
    .from('value_assessment_results')
    .select('*');  // RLS가 user.id 기준 필터링

  return NextResponse.json(data);
});
```

#### 5.2 API Routes 정리

| 삭제 대상 (중복) | 유지 대상 |
|------------------|-----------|
| `api/discover 2/*` | `api/discover/*` |
| `api/conversations 2/*` | `api/conversations/*` |
| `api/auth/[...nextauth]/*` | `api/auth/callback/*` (Supabase) |

---

### Phase 6: RAG 시스템 준비 (Week 9-10)

#### 6.1 데이터 정규화 완료 확인

RAG 임베딩 전 필수 조건:

| 체크리스트 | 상태 |
|------------|------|
| 모든 테이블 user_id 연결 | Phase 4에서 완료 |
| 인증 통합 완료 | Phase 1에서 완료 |
| 데이터 일관성 확보 | Phase 3에서 완료 |

#### 6.2 Embedding Pipeline 연동 포인트

```typescript
// 모듈 완료 시 자동 임베딩 트리거

// src/services/EmbeddingTriggerService.ts
class EmbeddingTriggerService {
  // Values 완료 시
  async onValuesComplete(userId: string, data: ValueResults) {
    await this.queueEmbedding({
      source_type: 'value_result',
      source_id: data.id,
      user_id: userId,
      content: this.formatValueContent(data),
      metadata: { module: 'values', completed_at: new Date() }
    });
  }

  // Strengths 완료 시
  async onStrengthsComplete(userId: string, data: StrengthProfile) {
    await this.queueEmbedding({
      source_type: 'strength_profile',
      source_id: data.id,
      user_id: userId,
      content: this.formatStrengthContent(data),
      metadata: { module: 'strengths', completed_at: new Date() }
    });
  }

  // Conversation 완료 시
  async onConversationComplete(sessionId: string, userId: string) {
    const messages = await this.getConversationMessages(sessionId);
    const summary = await this.summarizeConversation(messages);

    await this.queueEmbedding({
      source_type: 'conversation',
      source_id: sessionId,
      user_id: userId,
      content: summary,
      metadata: { module: 'chat', message_count: messages.length }
    });
  }
}
```

---

## 3. 파일 구조 변경 계획

### 3.1 삭제 대상

```
src/app/
├── api/
│   ├── auth/[...nextauth]/     ← 삭제 (NextAuth)
│   ├── discover 2/             ← 삭제 (중복)
│   └── conversations 2/        ← 삭제 (중복)
└── discover/
    └── values/[set] 2/         ← 삭제 (중복)

src/types/
└── next-auth.d.ts              ← 삭제
```

### 3.2 신규 생성

```
src/
├── contexts/
│   └── AuthContext.tsx         ← 신규 (인증 컨텍스트)
├── services/
│   ├── ModuleProgressService.ts    ← 신규
│   ├── DataInjectionService.ts     ← 신규
│   └── EmbeddingTriggerService.ts  ← 신규
├── components/
│   ├── ModuleGate.tsx          ← 신규 (선수조건 게이트)
│   └── AuthGuard.tsx           ← 신규 (인증 가드)
└── lib/
    └── api/
        └── withAuth.ts         ← 신규 (API 인증 래퍼)
```

---

## 4. 구현 타임라인

```
Week 1-2:  Phase 1 - 인증 통합
           ├── Supabase OAuth 설정
           ├── NextAuth 제거
           └── Auth Context 구현

Week 3-4:  Phase 2 - 모듈 의존성 관리
           ├── ModuleProgressService 구현
           ├── ModuleGate 컴포넌트 구현
           └── Dashboard 연동

Week 5-6:  Phase 3 - 데이터 연결성
           ├── User Profile View 생성
           ├── Cross-module injection 구현
           └── API 데이터 통합

Week 7:    Phase 4 - Session-User 통합
           ├── 테이블 마이그레이션
           └── ChatInterface 인증 연동

Week 8:    Phase 5 - API 표준화
           ├── withAuth 래퍼 구현
           ├── 중복 폴더 정리
           └── API routes 통일

Week 9-10: Phase 6 - RAG 준비
           ├── 데이터 정합성 검증
           ├── Embedding trigger 구현
           └── 테스트 및 문서화
```

---

## 5. 위험 요소 및 대응 방안

| 위험 | 영향도 | 대응 방안 |
|------|--------|-----------|
| 기존 사용자 세션 손실 | 높음 | 마이그레이션 스크립트로 session→user 매핑 |
| 인증 전환 중 다운타임 | 중간 | 점진적 전환, 폴백 메커니즘 |
| RLS 정책 미작동 | 높음 | 테스트 환경에서 철저한 검증 |
| API 호환성 | 중간 | 버전 관리, deprecated 경고 |

---

## 6. 성공 지표

| 지표 | 현재 | 목표 |
|------|------|------|
| 인증 시스템 | 2개 (NextAuth + Supabase) | 1개 (Supabase) |
| RLS 정책 작동률 | ~50% | 100% |
| 모듈 간 데이터 공유 | 수동 | 자동 |
| 선수조건 강제 | 없음 | 있음 (설정 가능) |
| API 패턴 일관성 | 낮음 | 높음 |
| RAG 준비도 | 0% | 100% |

---

## Document Information

**Version:** 1.0
**Last Updated:** November 2025
**Author:** Hosung You
**Status:** Ready for Implementation
