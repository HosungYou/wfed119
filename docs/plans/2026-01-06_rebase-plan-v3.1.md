# WFED119 LifeCraft Bot - Rebase v3.1 Plan

> **문서 버전**: 3.1
> **작성일**: 2026-01-06
> **상태**: 완료 (Implemented)

---

## Executive Summary

v3.1은 v3.0의 8개 모듈 시스템을 10개 모듈로 확장하고, 통합 모듈 컴포넌트 시스템을 구현합니다:

1. **10개 모듈 시스템** - Mission, Career Options 모듈 추가
2. **통합 UI 컴포넌트** - ModuleShell, ModuleHeader, ActivitySidebar
3. **AI 엔드포인트 수정** - 13개 AI 라우트 모델명 및 검증 추가
4. **Admin 모듈 잠금 우회** - 관리자 모든 모듈 접근 허용
5. **사용자 동의 시스템** - 개인정보 처리 및 연구 참여 동의

---

## Final Module Sequence (10 Modules)

| # | Module | Part | Korean Name | Description |
|---|--------|------|-------------|-------------|
| 1 | Values | Part 1: Self-Discovery | 가치관 탐색 | Terminal, Instrumental, Work values |
| 2 | Strengths | Part 1: Self-Discovery | 강점 발견 | AI 대화를 통한 강점 발견 |
| 3 | Enneagram | Part 1: Self-Discovery | 에니어그램 | 성격 유형 진단 |
| 4 | Life Themes | Part 1: Self-Discovery | 라이프 테마 | Career Construction Interview |
| 5 | Vision | Part 2: Vision & Mission | 비전 설계 | Dreams 통합, 비전 선언문 |
| 6 | **Mission** | Part 2: Vision & Mission | **사명 선언문** | **NEW:** 4단계 사명 작성 |
| 7 | **Career Options** | Part 2: Vision & Mission | **커리어 옵션** | **NEW:** Holland 코드 + 커리어 탐색 |
| 8 | SWOT | Part 3: Strategic Analysis | SWOT 분석 | 전략 분석 및 우선순위 |
| 9 | Goals | Part 4: Goal Setting | 목표 설정 | OKR 기반 역할별 목표 설정 |
| 10 | ERRC | Part 4: Goal Setting | ERRC 전략 | Blue Ocean + Wellbeing Wheel |

### Module Part Groupings (Updated)

```typescript
export type ModulePart = 'self-discovery' | 'vision-mission' | 'strategic-analysis' | 'goal-setting';

export const MODULE_PARTS: Record<ModulePart, ModuleId[]> = {
  'self-discovery': ['values', 'strengths', 'enneagram', 'life-themes'],
  'vision-mission': ['vision', 'mission', 'career-options'],  // Updated
  'strategic-analysis': ['swot'],
  'goal-setting': ['goals', 'errc'],
};
```

---

## Phase 1: New Module Types

### 1.1 Type System Updates

**File:** `src/lib/types/modules.ts`

**주요 변경:**

```typescript
// ModuleId - mission, career-options 추가
export type ModuleId =
  | 'values' | 'strengths' | 'enneagram' | 'life-themes'
  | 'vision' | 'mission' | 'career-options'
  | 'swot' | 'goals' | 'errc';

// MODULE_ORDER - 10개 모듈 순서
export const MODULE_ORDER: ModuleId[] = [
  'values', 'strengths', 'enneagram', 'life-themes',
  'vision', 'mission', 'career-options',
  'swot', 'goals', 'errc',
];

// MissionData 타입 추가
export interface MissionData {
  id: string;
  userId: string;
  valuesUsed: {
    terminal: string[];
    instrumental: string[];
    work: string[];
  };
  purposeAnswers: {
    whatDoYouDo?: string;
    forWhom?: string;
    howDoYouDoIt?: string;
    whatImpact?: string;
    whyDoesItMatter?: string;
  };
  draftVersions: string[];
  finalStatement?: string;
  createdAt: string;
  updatedAt: string;
}

// CareerOptionsData 타입 추가
export interface CareerOptionsData {
  id: string;
  userId: string;
  hollandCode: {
    primary: string;
    secondary?: string;
    tertiary?: string;
  };
  hollandScores: Record<string, number>;
  hollandResponses: Record<string, number>;
  suggestedCareers: CareerSuggestion[];
  exploredCareers: ExploredCareer[];
  comparisonMatrix?: ComparisonMatrix;
  topCareerChoices: { career: string; notes: string }[];
  currentStep: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## Phase 2: Database Schema

### 2.1 Mission Statements Table

**File:** `database/migrations/2026-01-06-create-mission-statements.sql`

```sql
CREATE TABLE public.mission_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  values_used JSONB DEFAULT '{}',
  purpose_answers JSONB DEFAULT '{}',
  draft_versions JSONB DEFAULT '[]',
  final_statement TEXT,
  ai_suggestions JSONB DEFAULT '[]',
  feedback_history JSONB DEFAULT '[]',
  current_step INTEGER DEFAULT 1,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS Policies
ALTER TABLE public.mission_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own mission"
ON public.mission_statements
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### 2.2 Career Explorations Table

**File:** `database/migrations/2026-01-06-create-career-explorations.sql`

```sql
CREATE TABLE public.career_explorations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  holland_code VARCHAR(6),
  holland_scores JSONB DEFAULT '{}',
  holland_responses JSONB DEFAULT '[]',
  suggested_careers JSONB DEFAULT '[]',
  explored_careers JSONB DEFAULT '[]',
  comparison_matrix JSONB DEFAULT '{}',
  top_career_choices JSONB DEFAULT '[]',
  current_step INTEGER DEFAULT 1,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS Policies
ALTER TABLE public.career_explorations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own career explorations"
ON public.career_explorations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### 2.3 User Consent Agreements Table

**File:** `database/migrations/2026-01-06-create-user-consent-agreements.sql`

```sql
CREATE TABLE public.user_consent_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  privacy_policy_agreed BOOLEAN NOT NULL DEFAULT false,
  research_consent_agreed BOOLEAN DEFAULT false,
  consent_data_collection BOOLEAN DEFAULT false,
  consent_ai_processing BOOLEAN DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  consent_version VARCHAR(20) DEFAULT '1.0',
  agreed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS Policies
ALTER TABLE public.user_consent_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own consent"
ON public.user_consent_agreements
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### 2.4 Users Table RLS Policies

**추가 정책 (기존 테이블):**

```sql
-- public.users 테이블 RLS 정책 추가
CREATE POLICY "Users can read own row" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own row" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can read all" ON public.users
  FOR SELECT TO service_role USING (true);

CREATE POLICY "Authenticated users can insert own row" ON public.users
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
```

---

## Phase 3: Mission Module Implementation

### 3.1 Mission Module Steps

| Step | Path | Name | Description |
|------|------|------|-------------|
| 1 | `/discover/mission/step1` | Values Review | 이전 모듈 가치관 확인 |
| 2 | `/discover/mission/step2` | Purpose Questions | AI 가이드 목적 질문 |
| 3 | `/discover/mission/step3` | Mission Draft | AI 초안 생성 |
| 4 | `/discover/mission/step4` | Refinement | 최종 수정 및 확정 |

### 3.2 Purpose Questions (Step 2)

```typescript
const PURPOSE_QUESTIONS = [
  { id: 'whatDoYouDo', label: 'What do you do?', korean: '당신은 무엇을 하나요?' },
  { id: 'forWhom', label: 'For whom?', korean: '누구를 위해?' },
  { id: 'howDoYouDoIt', label: 'How do you do it?', korean: '어떻게 하나요?' },
  { id: 'whatImpact', label: 'What impact do you make?', korean: '어떤 영향을 미치나요?' },
  { id: 'whyDoesItMatter', label: 'Why does it matter?', korean: '왜 중요한가요?' },
];
```

### 3.3 AI Suggest Endpoint

**File:** `src/app/api/discover/mission/ai-suggest/route.ts`

```typescript
// AI 제안 요청 형식
interface MissionSuggestRequest {
  values: ValuesData;
  purposeAnswers: PurposeAnswers;
  context?: {
    vision?: VisionData;
    strengths?: StrengthsData;
  };
  type: 'draft' | 'refine' | 'feedback';
}

// AI 제안 응답 형식
interface MissionSuggestResponse {
  suggestion: string | MissionFeedback;
  source: 'ai' | 'fallback';
  error?: string;
}
```

---

## Phase 4: Career Options Module Implementation

### 4.1 Career Options Steps

| Step | Path | Name | Description |
|------|------|------|-------------|
| 1 | `/discover/career-options/step1` | Holland Assessment | 30문항 RIASEC 검사 |
| 2 | `/discover/career-options/step2` | AI Suggestions | AI 커리어 추천 |
| 3 | `/discover/career-options/step3` | Career Research | 선택 커리어 심층 탐색 |
| 4 | `/discover/career-options/step4` | Comparison | 비교 매트릭스 |

### 4.2 Holland Code Types

```typescript
const HOLLAND_TYPES = {
  R: { name: 'Realistic', korean: '현실형', color: 'green' },
  I: { name: 'Investigative', korean: '탐구형', color: 'blue' },
  A: { name: 'Artistic', korean: '예술형', color: 'purple' },
  S: { name: 'Social', korean: '사회형', color: 'yellow' },
  E: { name: 'Enterprising', korean: '기업형', color: 'orange' },
  C: { name: 'Conventional', korean: '관습형', color: 'gray' },
};
```

### 4.3 Holland Assessment Questions

30문항, 각 6개 유형별 5문항:

```typescript
interface HollandQuestion {
  id: number;
  type: 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
  text: string;
  textKo: string;
}

// 점수 계산
function calculateHollandScores(responses: Record<number, number>): Record<string, number> {
  const scores: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  HOLLAND_QUESTIONS.forEach(q => {
    scores[q.type] += responses[q.id] || 0;
  });

  return scores;
}

// 코드 생성 (상위 3개)
function generateHollandCode(scores: Record<string, number>): string {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type)
    .join('');
}
```

---

## Phase 5: Unified Module Components

### 5.1 ModuleShell Component

**File:** `src/components/modules/ModuleShell.tsx`

```tsx
interface ModuleShellProps {
  moduleId: ModuleId;
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}

export function ModuleShell({
  moduleId,
  currentStep,
  totalSteps,
  title,
  subtitle,
  sidebar,
  children,
}: ModuleShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <ModuleHeader
        moduleId={moduleId}
        title={title}
        currentStep={currentStep}
        totalSteps={totalSteps}
      />
      <div className="flex">
        {sidebar && (
          <aside className="w-64 hidden lg:block">
            {sidebar}
          </aside>
        )}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### 5.2 ModuleHeader Component

**File:** `src/components/modules/ModuleHeader.tsx`

```tsx
interface ModuleHeaderProps {
  moduleId: ModuleId;
  title: string;
  currentStep: number;
  totalSteps: number;
}

export function ModuleHeader({ moduleId, title, currentStep, totalSteps }: ModuleHeaderProps) {
  return (
    <header className="bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg">
            <HomeIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="text-sm text-gray-500">
              Step {currentStep} of {totalSteps}
            </p>
          </div>
        </div>
        <StepProgress current={currentStep} total={totalSteps} />
      </div>
    </header>
  );
}
```

### 5.3 ActivitySidebar Component

**File:** `src/components/modules/ActivitySidebar.tsx`

```tsx
interface Activity {
  id: string;
  title: string;
  status: 'locked' | 'available' | 'in-progress' | 'completed';
  path: string;
}

interface ActivitySidebarProps {
  activities: Activity[];
  currentActivityId: string;
}

export function ActivitySidebar({ activities, currentActivityId }: ActivitySidebarProps) {
  return (
    <nav className="p-4 space-y-2">
      {activities.map((activity, index) => (
        <ActivityItem
          key={activity.id}
          activity={activity}
          index={index}
          isCurrent={activity.id === currentActivityId}
        />
      ))}
    </nav>
  );
}
```

---

## Phase 6: AI Endpoint Fixes

### 6.1 Model Name Correction

**모든 AI 엔드포인트:**

```typescript
// Before (잘못된 코드)
model: 'claude-3.5-sonnet'

// After (올바른 코드)
model: 'claude-3-5-sonnet-20241022'
```

### 6.2 API Key Validation

```typescript
const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey || apiKey === 'your_anthropic_api_key_here' || apiKey.length < 10) {
  return NextResponse.json({
    suggestions: generateFallbackData(),
    source: 'fallback',
    message: 'AI service not configured. Using template-based suggestion.',
  });
}
```

### 6.3 Fixed Endpoints (13 total)

| # | Endpoint | Fix Type |
|---|----------|----------|
| 1 | `/api/discover/vision/ai-suggest` | Model name |
| 2 | `/api/discover/vision/ai-coach` | Model name |
| 3 | `/api/discover/vision/dreams/ai-analyze` | Model name |
| 4 | `/api/discover/swot/ai-suggest` | Model name + validation |
| 5 | `/api/discover/swot/auto-fill` | Model name + validation |
| 6 | `/api/discover/goals/ai-suggest` | Model name |
| 7 | `/api/discover/mission/ai-coach` | Model name + validation |
| 8 | `/api/discover/career-options/ai-suggest` | Model name + validation |
| 9 | `/api/discover/enneagram/ai-analyze` | Model name |
| 10 | `/api/discover/strengths/chat` | Model name |
| 11 | `/api/discover/life-themes/ai-analyze` | Model name |
| 12 | `/api/discover/errc/ai-suggest` | Model name |
| 13 | `/api/discover/values/ai-analyze` | Model name |

---

## Phase 7: Admin Module Lock Bypass

### 7.1 checkIsAdmin Method

**File:** `src/lib/services/moduleProgressService.ts`

```typescript
async checkIsAdmin(): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', this.userId)
      .single();

    if (error) {
      console.error('[ModuleProgressService] Could not fetch user role:', error);
      return false;
    }

    return data?.role === 'ADMIN' || data?.role === 'SUPER_ADMIN';
  } catch (error) {
    console.error('[ModuleProgressService] Admin check failed:', error);
    return false;
  }
}
```

### 7.2 canStartModule Integration

```typescript
async canStartModule(moduleId: ModuleId): Promise<{ canStart: boolean; missingPrerequisites: ModuleId[] }> {
  // Admin bypass
  const isAdmin = await this.checkIsAdmin();
  if (isAdmin) {
    return { canStart: true, missingPrerequisites: [] };
  }

  // Normal linear progression check
  const completedModules = await this.getCompletedModulesSet();
  return canStartModuleLinear(moduleId, completedModules);
}
```

---

## Phase 8: User Consent System

### 8.1 ConsentModal Component

**File:** `src/components/auth/ConsentModal.tsx`

```tsx
interface ConsentModalProps {
  isOpen: boolean;
  onConsent: (consent: ConsentData) => void;
}

export function ConsentModal({ isOpen, onConsent }: ConsentModalProps) {
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [researchAgreed, setResearchAgreed] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={() => {}} closable={false}>
      <h2>연구 참여 동의 / Research Consent</h2>

      {/* Privacy Policy (Required) */}
      <Checkbox
        checked={privacyAgreed}
        onChange={setPrivacyAgreed}
        required
      >
        개인정보 처리방침에 동의합니다 (필수)
      </Checkbox>

      {/* Research Participation (Optional) */}
      <Checkbox
        checked={researchAgreed}
        onChange={setResearchAgreed}
      >
        연구 참여에 동의합니다 (선택)
      </Checkbox>

      <Button
        disabled={!privacyAgreed}
        onClick={() => onConsent({ privacyAgreed, researchAgreed })}
      >
        동의하고 계속하기
      </Button>
    </Modal>
  );
}
```

### 8.2 Consent API

**File:** `src/app/api/auth/consent/route.ts`

```typescript
// GET: 동의 상태 확인
export async function GET(request: NextRequest) {
  const consent = await supabase
    .from('user_consent_agreements')
    .select('*')
    .eq('user_id', userId)
    .single();

  return NextResponse.json({
    hasConsent: !!consent.data,
    consent: consent.data,
  });
}

// POST: 동의 저장
export async function POST(request: NextRequest) {
  const body = await request.json();

  await supabase
    .from('user_consent_agreements')
    .upsert({
      user_id: userId,
      privacy_policy_agreed: body.privacyAgreed,
      research_consent_agreed: body.researchAgreed,
      consent_data_collection: body.dataCollection,
      consent_ai_processing: body.aiProcessing,
      ip_address: request.ip,
      user_agent: request.headers.get('user-agent'),
    });

  return NextResponse.json({ success: true });
}
```

---

## File Changes Summary

### New Files Created

| Category | Files |
|----------|-------|
| **Mission Module** (8 files) | `page.tsx`, `step1-4/page.tsx`, `session/route.ts`, `ai-suggest/route.ts`, `ai-coach/route.ts` |
| **Career Options Module** (8 files) | `page.tsx`, `step1-4/page.tsx`, `session/route.ts`, `ai-suggest/route.ts` |
| **Unified Components** (6 files) | `ModuleShell.tsx`, `ModuleHeader.tsx`, `ActivitySidebar.tsx`, `ModuleCard.tsx`, `ModuleButton.tsx`, `index.ts` |
| **Consent System** (3 files) | `ConsentModal.tsx`, `ConsentGuard.tsx`, `/api/auth/consent/route.ts` |
| **Database** (3 files) | `create-mission-statements.sql`, `create-career-explorations.sql`, `create-user-consent-agreements.sql` |

### Modified Files

| File | Changes |
|------|---------|
| `src/lib/types/modules.ts` | ModuleId 확장, MissionData, CareerOptionsData 추가 |
| `src/lib/services/moduleProgressService.ts` | Admin bypass, getMissionData, getCareerOptionsData |
| `src/lib/i18n/translations/en.json` | 10 modules, mission/career translations |
| `src/lib/i18n/translations/ko.json` | 10 modules, mission/career translations |
| 13 AI endpoint files | Model name corrections |

---

## Testing Checklist

### New Modules
- [ ] Mission Step 1-4 완료 가능
- [ ] Career Options Step 1-4 완료 가능
- [ ] Holland 코드 정상 계산
- [ ] AI 제안 정상 작동 또는 fallback

### Admin Bypass
- [ ] ADMIN 역할 사용자 모든 모듈 접근 가능
- [ ] 일반 사용자 순차 진행 강제

### Consent System
- [ ] 신규 사용자 동의 모달 표시
- [ ] 동의 없이 앱 진행 불가
- [ ] 동의 후 정상 앱 사용

### UI Components
- [ ] ModuleShell 정상 렌더링
- [ ] ActivitySidebar 단계 표시
- [ ] ModuleHeader 진행률 표시

---

## Release Information

**Version:** 3.1.0 + 3.1.1
**Release Dates:** 2026-01-06
**GitHub Releases:**
- [v3.1.0](https://github.com/HosungYou/wfed119/releases/tag/v3.1.0)
- [v3.1.1](https://github.com/HosungYou/wfed119/releases/tag/v3.1.1)

### Breaking Changes

None - fully backward compatible with v3.0

---

## Contact

Repository: https://github.com/HosungYou/wfed119
