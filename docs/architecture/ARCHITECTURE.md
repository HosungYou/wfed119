# WFED119 LifeCraft Bot - Architecture Documentation

> **버전**: 3.3.0
> **최종 업데이트**: 2026-01-08
> **목적**: Claude Code 및 개발자를 위한 시스템 아키텍처 참고 문서

---

## 목차

1. [시스템 개요](#시스템-개요)
2. [기술 스택](#기술-스택)
3. [모듈 시스템](#모듈-시스템)
4. [프론트엔드-백엔드 연결](#프론트엔드-백엔드-연결)
5. [AI 통합 아키텍처](#ai-통합-아키텍처)
6. [데이터 흐름](#데이터-흐름)
7. [데이터베이스 스키마](#데이터베이스-스키마)
8. [컴포넌트 시스템](#컴포넌트-시스템)
9. [API 엔드포인트 참조](#api-엔드포인트-참조)
10. [개발 지침](#개발-지침)

---

## 시스템 개요

LifeCraft Bot은 AI 기반 커리어 코칭 시스템으로, 10개의 순차적 모듈을 통해 사용자의 자기 발견부터 목표 설정까지 체계적인 여정을 제공합니다.

### 핵심 특징

- **Linear Progression**: 8→10개 모듈 순차 진행 (이전 모듈 완료 필수)
- **Cross-Module AI Context**: 이전 모듈 데이터를 AI 프롬프트에 주입
- **Bilingual Support**: 한국어/영어 이중 언어 지원
- **Supabase Backend**: PostgreSQL + Row Level Security

---

## 기술 스택

### Frontend

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 15.x | React 프레임워크, App Router |
| TypeScript | 5.x | 타입 안정성 |
| Tailwind CSS | 3.x | 유틸리티 CSS |
| Lucide React | - | 아이콘 라이브러리 |

### Backend

| 기술 | 용도 |
|------|------|
| Next.js API Routes | `/app/api/` 서버 엔드포인트 |
| Supabase Client | PostgreSQL 쿼리, RLS |
| Anthropic SDK | Claude AI 통합 |
| OpenAI SDK | GPT 모델 통합 (선택) |

### Infrastructure

| 서비스 | 용도 |
|--------|------|
| Render.com | 호스팅, 자동 배포 |
| Supabase | 데이터베이스, 인증, 실시간 |
| GitHub | 소스 코드, CI/CD 트리거 |

---

## 모듈 시스템

### 10개 모듈 순서 (v3.1+)

```typescript
export type ModuleId =
  | 'values' | 'strengths' | 'enneagram' | 'life-themes'  // Part 1
  | 'vision' | 'mission' | 'career-options'               // Part 2
  | 'swot'                                                 // Part 3
  | 'goals' | 'errc';                                     // Part 4

export const MODULE_ORDER: ModuleId[] = [
  'values',         // 1. 가치관 탐색
  'strengths',      // 2. 강점 발견
  'enneagram',      // 3. 에니어그램
  'life-themes',    // 4. 라이프 테마
  'vision',         // 5. 비전 설계 (Dreams 통합)
  'mission',        // 6. 사명 선언문 (v3.3: 5단계 Life Roles)
  'career-options', // 7. 커리어 옵션 (Holland Code)
  'swot',           // 8. SWOT 분석
  'goals',          // 9. 목표 설정 (OKR)
  'errc',           // 10. ERRC 전략
];
```

### 모듈 파트 그룹

```typescript
export const MODULE_PARTS: Record<ModulePart, ModuleId[]> = {
  'self-discovery':     ['values', 'strengths', 'enneagram', 'life-themes'],
  'vision-mission':     ['vision', 'mission', 'career-options'],
  'strategic-analysis': ['swot'],
  'goal-setting':       ['goals', 'errc'],
};
```

### 선형 진행 규칙

```typescript
// moduleProgressService.ts
export function canStartModuleLinear(
  moduleId: ModuleId,
  completedModules: Set<ModuleId>
): { canStart: boolean; missingPrerequisites: ModuleId[] } {
  const moduleIndex = MODULE_ORDER.indexOf(moduleId);

  // 첫 번째 모듈은 항상 시작 가능
  if (moduleIndex === 0) return { canStart: true, missingPrerequisites: [] };

  // 이전 모든 모듈 완료 필요
  const requiredModules = MODULE_ORDER.slice(0, moduleIndex);
  const missing = requiredModules.filter(m => !completedModules.has(m));

  return { canStart: missing.length === 0, missingPrerequisites: missing };
}

// Admin 우회 (ADMIN/SUPER_ADMIN 역할)
async canStartModule(moduleId: ModuleId): Promise<CanStartResult> {
  const isAdmin = await this.checkIsAdmin();
  if (isAdmin) {
    return { canStart: true, missingPrerequisites: [] };
  }
  return canStartModuleLinear(moduleId, await this.getCompletedModulesSet());
}
```

---

## 프론트엔드-백엔드 연결

### API 라우트 패턴

```
/api/discover/{module}/              # 모듈 메인 API
/api/discover/{module}/session       # 세션 GET/PATCH/DELETE
/api/discover/{module}/ai-suggest    # AI 제안 POST
/api/discover/{module}/ai-chat       # AI 대화 SSE (선택)
```

### 인증 흐름

```typescript
// 서버 컴포넌트/API 라우트
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (!session || error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  // ... 비즈니스 로직
}
```

### 개발 환경 인증 (dev-auth-helper)

```typescript
// 로컬 개발 시 DEV_USER_ID 환경변수 사용
import { checkDevAuth, requireAuth } from '@/lib/dev-auth-helper';

const auth = checkDevAuth(session);
if (!requireAuth(auth)) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
const userId = auth.userId;
```

### 프론트엔드 데이터 페칭

```typescript
// 클라이언트 컴포넌트
'use client';

const [session, setSession] = useState(null);

useEffect(() => {
  const fetchSession = async () => {
    const response = await fetch('/api/discover/mission/session');
    if (response.ok) {
      const data = await response.json();
      setSession(data);
    }
  };
  fetchSession();
}, []);

// 세션 업데이트
const updateSession = async (updates: Partial<SessionData>) => {
  await fetch('/api/discover/mission/session', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
};
```

---

## AI 통합 아키텍처

### AI 서비스 구성

```
┌─────────────────────────────────────────────────────────────┐
│                     AI Service Layer                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  Anthropic SDK  │  │   OpenAI SDK    │                   │
│  │  (Claude)       │  │   (GPT-4)       │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                            │
│           └──────────┬─────────┘                            │
│                      │                                      │
│           ┌──────────▼──────────┐                           │
│           │  AIContextService   │                           │
│           │  - buildContextFor  │                           │
│           │    Module()         │                           │
│           │  - buildSuggestion  │                           │
│           │    Context()        │                           │
│           └──────────┬──────────┘                           │
│                      │                                      │
│           ┌──────────▼──────────┐                           │
│           │  Module Prompts     │                           │
│           │  - BASE_PERSONA     │                           │
│           │  - getModulePrompt  │                           │
│           │    (moduleId)       │                           │
│           └─────────────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

### 크로스 모듈 AI 컨텍스트 시스템

**AIContextService** (`src/lib/services/aiContextService.ts`)

```typescript
export class AIContextService {
  async buildContextForModule(targetModule: ModuleId): Promise<AIContextResult> {
    // 1. 이전 완료 모듈 데이터 수집
    const crossModuleContext = await service.getCrossModuleContext(targetModule);

    // 2. 각 모듈별 컨텍스트 섹션 생성
    // Values → "## 사용자의 핵심 가치 (User's Core Values)"
    // Strengths → "## 발견된 강점 (Discovered Strengths)"
    // Enneagram → "## 성격 유형 (Personality Type)"

    // 3. 프롬프트 컨텍스트 조합
    return {
      promptContext: formatPromptContext(sections, availableModules),
      availableModules,
      hasContext: sections.length > 0,
      summary: { values: [...], strengths: [...], ... },
    };
  }
}
```

### 모듈별 AI 프롬프트 (v3.2+)

**Module Prompts** (`src/lib/prompts/modulePrompts.ts`)

```typescript
export const BASE_PERSONA = `
당신은 LifeCraft 커리어 코치입니다...

**핵심 원칙:**
1. 사용자의 이전 모듈 결과를 적극 활용하여 개인화된 안내 제공
2. 따뜻하고 공감적인 톤 유지
3. 구체적이고 실행 가능한 제안 제공
...
`;

export const MODULE_PROMPTS: Record<ModuleId, string> = {
  vision: `
${BASE_PERSONA}

**현재 모듈: 비전 설계 (Vision & Dreams)**

이전 모듈 연결 (필수):
- 가치관: 비전이 핵심 가치를 반영하는지 확인
- 강점: 비전 실현에 활용할 강점 연결
...
`,
  mission: `
${BASE_PERSONA}

**현재 모듈: 사명 선언문 (Mission Statement)**
...
`,
  // ... 10개 모듈 각각
};
```

### AI 엔드포인트 패턴

```typescript
// /api/discover/{module}/ai-suggest/route.ts

export async function POST(request: NextRequest) {
  let body: any = null;

  try {
    body = await request.json();

    // 1. AI 컨텍스트 구축
    const aiContextService = new AIContextService(userId);
    const context = await aiContextService.buildContextForModule('mission');

    // 2. 모듈별 프롬프트 가져오기
    const modulePrompt = getModulePrompt('mission');

    // 3. 최종 프롬프트 조합
    const fullPrompt = buildAIPrompt('mission', context.promptContext);

    // 4. AI 호출
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        { role: 'system', content: fullPrompt },
        { role: 'user', content: body.userInput },
      ],
    });

    return NextResponse.json({ suggestion: response.content[0].text });

  } catch (error) {
    // Fallback 응답 (500 에러 방지)
    const fallback = generateFallbackResponse(body);
    return NextResponse.json({
      suggestion: fallback,
      source: 'fallback',
      error: 'AI service temporarily unavailable.',
    });
  }
}
```

### AI 컨텍스트 주입 지점

| Module | 주입되는 이전 데이터 | AI 활용 방식 |
|--------|---------------------|--------------|
| **Strengths** | Values | 가치 기반 강점 탐색 질문 |
| **Enneagram** | Values, Strengths | 유형 확인 시 참조 |
| **Life Themes** | All Part 1 | 테마와 가치/강점 연결 |
| **Vision** | All Part 1 | 비전 초안 제안 |
| **Mission** | All Part 1 + Vision | 사명문 옵션 생성 |
| **Career Options** | All previous | 커리어 적합도 분석 |
| **SWOT** | All previous | S 자동 채우기, 전략 제안 |
| **Goals** | All previous + SWOT | OKR 초안, 역할 제안 |
| **ERRC** | All previous + Goals | ERRC 행동 제안 |

---

## 데이터 흐름

### 전체 데이터 흐름도

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER SESSION                                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Part 1: Self-Discovery                                              │
│  ┌─────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────┐            │
│  │ Values  │→│ Strengths │→│ Enneagram │→│ Life Themes │            │
│  │─────────│ │───────────│ │───────────│ │─────────────│            │
│  │terminal │ │topStrength│ │   type    │ │   themes    │            │
│  │instrume │ │   s[]     │ │   wing    │ │   stages    │            │
│  │ work    │ │  summary  │ │ instinct  │ │  influences │            │
│  └────┬────┘ └─────┬─────┘ └─────┬─────┘ └──────┬──────┘            │
│       └────────────┴─────────────┴──────────────┘                    │
│                            │                                         │
│                            ▼  [user_integrated_profiles 동기화]       │
└────────────────────────────┼─────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Part 2: Vision & Mission                                            │
│  ┌─────────────┐ ┌───────────────┐ ┌────────────────┐               │
│  │   Vision    │→│    Mission    │→│ Career Options │               │
│  │─────────────│ │───────────────│ │────────────────│               │
│  │  statement  │ │ finalStatement│ │  hollandCode   │               │
│  │   dreams    │ │ purposeAnswers│ │ suggestedCare  │               │
│  │ aspirations │ │ life_roles*   │ │   topChoices   │               │
│  └─────────────┘ │wellbeing_refl*│ └────────────────┘               │
│                  │role_commitment│                                   │
│                  └───────────────┘                                   │
│  * v3.3 추가: Life Roles 관련 필드                                    │
└───────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Part 3: Strategic Analysis                                          │
│  ┌──────────────────────────────────────────────┐                   │
│  │                    SWOT                       │                   │
│  │  Strengths (S) ← 강점 모듈 자동 반영          │                   │
│  │  Weaknesses (W) ← 에니어그램 맹점             │                   │
│  │  Opportunities (O) ← 비전/사명 기회           │                   │
│  │  Threats (T) ← 커리어 진입장벽                │                   │
│  │                                              │                   │
│  │  → SO, WO, ST, WT 전략 도출                  │                   │
│  └──────────────────────────────────────────────┘                   │
└───────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Part 4: Goal Setting                                                │
│  ┌─────────────────────────┐ ┌─────────────────────────┐            │
│  │         Goals           │→│          ERRC           │            │
│  │  ─ Life Roles (5개)     │ │  ─ Eliminate            │            │
│  │  ─ Objectives           │ │  ─ Reduce               │            │
│  │  ─ Key Results (OKR)    │ │  ─ Raise                │            │
│  │  [SWOT 전략 기반]        │ │  ─ Create               │            │
│  └─────────────────────────┘ │  ─ Wellbeing Wheel      │            │
│                              │  [목표 기반 행동 계획]    │            │
│                              └─────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
```

### 세션 데이터 저장/조회 흐름

```
┌───────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend    │     │   API Route     │     │    Supabase     │
│   (React)     │     │   (Next.js)     │     │   (PostgreSQL)  │
└───────┬───────┘     └────────┬────────┘     └────────┬────────┘
        │                      │                       │
        │  GET /api/.../session│                       │
        │─────────────────────▶│                       │
        │                      │  SELECT * FROM ...    │
        │                      │──────────────────────▶│
        │                      │                       │
        │                      │◀──────────────────────│
        │                      │     { session data }  │
        │◀─────────────────────│                       │
        │   { session data }   │                       │
        │                      │                       │
        │  PATCH /api/.../sess │                       │
        │  { current_step: 3 } │                       │
        │─────────────────────▶│                       │
        │                      │  UPDATE ... SET ...   │
        │                      │──────────────────────▶│
        │                      │◀──────────────────────│
        │◀─────────────────────│                       │
        │   { updated session }│                       │
        │                      │                       │
```

---

## 데이터베이스 스키마

### 주요 테이블

| 테이블 | 용도 | RLS |
|--------|------|-----|
| `auth.users` | Supabase 인증 사용자 | 기본 |
| `public.users` | 확장 사용자 정보 (role 등) | Yes |
| `module_progress` | 모듈 진행 상태 | Yes |
| `user_integrated_profiles` | 통합 프로필 | Yes |
| `value_results` | 가치관 결과 | Yes |
| `strengths_sessions` | 강점 세션 | Yes |
| `enneagram_results` | 에니어그램 결과 | Yes |
| `life_themes_sessions` | 라이프 테마 세션 | Yes |
| `vision_statements` | 비전 + Dreams | Yes |
| `mission_sessions` | 사명 세션 (v3.3 확장) | Yes |
| `career_explorations` | 커리어 탐색 | Yes |
| `swot_sessions` | SWOT 세션 | Yes |
| `goal_sessions` | 목표 설정 세션 | Yes |
| `errc_sessions` | ERRC 세션 | Yes |
| `user_consent_agreements` | 사용자 동의 | Yes |

### Mission Sessions 스키마 (v3.3)

```sql
CREATE TABLE public.mission_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'in_progress',
  current_step INTEGER DEFAULT 1,
  values_used JSONB DEFAULT '[]',
  purpose_answers JSONB DEFAULT '{}',
  draft_versions JSONB DEFAULT '[]',
  final_statement TEXT,
  ai_conversation JSONB DEFAULT '[]',

  -- v3.3 Life Roles 추가 필드
  life_roles JSONB DEFAULT '[]',           -- [{id, entity, role}]
  wellbeing_reflections JSONB DEFAULT '{}', -- {physical, intellectual, ...}
  role_commitments JSONB DEFAULT '[]',      -- [{roleId, entity, role, commitment}]
  wellbeing_commitments JSONB DEFAULT '{}', -- {physical, intellectual, ...}

  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### RLS 정책 패턴

```sql
-- 표준 RLS 정책
ALTER TABLE public.{table_name} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own data"
ON public.{table_name}
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## 컴포넌트 시스템

### 통합 모듈 컴포넌트 (v3.1+)

**위치**: `src/components/modules/`

```typescript
// index.ts exports
export { default as ModuleHeader } from './ModuleHeader';
export { default as ModuleShell, ModuleCard, ModuleButton } from './ModuleShell';
export { default as ActivitySidebar, createActivitiesFromSteps } from './ActivitySidebar';
export { SessionResetButton } from './SessionResetButton';
```

### ModuleShell 패턴

```tsx
// 각 모듈 페이지에서 사용
import { ModuleShell, ModuleCard, ModuleButton } from '@/components/modules';

export default function MissionStep2() {
  return (
    <ModuleShell
      moduleId="mission"
      currentStep={2}
      totalSteps={5}
      title="Life Roles Mapping"
      sidebar={<ActivitySidebar activities={activities} currentActivityId="step2" />}
    >
      <ModuleCard className="mb-6">
        {/* 모듈 컨텐츠 */}
      </ModuleCard>

      <div className="flex justify-between">
        <ModuleButton variant="secondary" onClick={goBack}>
          Previous
        </ModuleButton>
        <ModuleButton onClick={goNext} disabled={!canProceed}>
          Next Step
        </ModuleButton>
      </div>
    </ModuleShell>
  );
}
```

### STEPS 구성 패턴

```typescript
// 각 모듈 step 페이지에서 정의
const STEPS = [
  { id: 'step1', label: 'Values Review', labelKo: '가치관 검토' },
  { id: 'step2', label: 'Life Roles Mapping', labelKo: '삶의 역할 탐색' },
  { id: 'step3', label: 'Self-Role Reflection', labelKo: '자기 역할 성찰' },
  { id: 'step4', label: 'Roles & Commitment', labelKo: '역할과 헌신' },
  { id: 'step5', label: 'Mission Statement', labelKo: '사명 선언문' },
];

const totalSteps = 5;
const currentStep = 2;

// ActivitySidebar 생성
const activities = createActivitiesFromSteps(STEPS, currentStep);
```

---

## API 엔드포인트 참조

### 공통 엔드포인트

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/modules/context` | GET | 크로스 모듈 컨텍스트 조회 |
| `/api/modules/integrated-profile` | GET/POST | 통합 프로필 조회/새로고침 |
| `/api/auth/consent` | GET/POST | 사용자 동의 상태 |

### 모듈별 엔드포인트 패턴

| Pattern | Method | Purpose |
|---------|--------|---------|
| `/api/discover/{module}/session` | GET | 세션 조회/생성 |
| `/api/discover/{module}/session` | PATCH | 세션 업데이트 |
| `/api/discover/{module}/session` | DELETE | 세션 리셋 |
| `/api/discover/{module}/ai-suggest` | POST | AI 제안 요청 |

### Mission 모듈 엔드포인트 (v3.3)

```typescript
// GET /api/discover/mission/session
// Response:
{
  id: string;
  user_id: string;
  status: 'in_progress' | 'completed';
  current_step: 1 | 2 | 3 | 4 | 5;
  values_used: string[];
  purpose_answers: Record<string, string>;
  draft_versions: string[];
  final_statement: string | null;
  ai_conversation: Message[];
  life_roles: LifeRole[];           // v3.3
  wellbeing_reflections: Record<string, string>; // v3.3
  role_commitments: RoleCommitment[]; // v3.3
  wellbeing_commitments: Record<string, string>; // v3.3
}

// PATCH /api/discover/mission/session
// Body (partial update):
{
  current_step?: number;  // 1-5
  life_roles?: LifeRole[];
  wellbeing_reflections?: Record<string, string>;
  role_commitments?: RoleCommitment[];
  wellbeing_commitments?: Record<string, string>;
  final_statement?: string;
  status?: 'in_progress' | 'completed';
}
```

---

## 개발 지침

### 새 모듈 단계 추가 시

1. **API Route 수정**: `route.ts`에서 step 범위 검증 업데이트
2. **Step 페이지 생성**: `/discover/{module}/step{N}/page.tsx`
3. **STEPS 배열 업데이트**: 모든 step 페이지의 STEPS 배열 동기화
4. **totalSteps 업데이트**: 모든 step 페이지 및 랜딩 페이지
5. **데이터베이스 스키마**: 필요시 새 컬럼 추가

### AI 엔드포인트 추가 시

1. **Fallback 응답 구현**: 500 에러 방지
2. **컨텍스트 빌드**: `AIContextService` 활용
3. **모듈 프롬프트**: `modulePrompts.ts`에 추가
4. **JSON 파싱 핸들링**: Markdown code block 제거

### 에러 핸들링 패턴

```typescript
try {
  // 비즈니스 로직
} catch (error) {
  console.error('[API_NAME] Error:', error);

  // Fallback 제공 (가능한 경우)
  if (canProvideFallback) {
    return NextResponse.json({
      data: fallbackData,
      source: 'fallback',
      error: 'Service temporarily unavailable.',
    });
  }

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
```

### 환경 변수

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI (Optional - fallback 사용 가능)
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...

# Development
DEV_USER_ID=uuid-for-local-testing
```

---

## 참고 문서

- **v3.0 계획**: `/docs/plans/2026-01-06_rebase-plan-v3.0.md`
- **v3.1 계획**: `/docs/plans/2026-01-06_rebase-plan-v3.1.md`
- **v3.2 계획**: `/docs/plans/2026-01-07_rebase-plan-v3.2.md`
- **릴리즈 노트**: `/release-notes/v3.0/`
- **릴리즈 노트 가이드라인**: `/release-notes/CLAUDE.md`

---

## 버전 히스토리

| Version | Date | Major Changes |
|---------|------|---------------|
| v3.0 | 2026-01-06 | 8모듈 시스템, 선형 진행, Dreams→Vision 통합 |
| v3.1 | 2026-01-06 | 10모듈 확장, Mission/Career Options 추가 |
| v3.2 | 2026-01-07 | AI 500 에러 수정, 크로스 모듈 컨텍스트 |
| v3.3 | 2026-01-08 | Mission 5단계 Life Roles 통합 |
