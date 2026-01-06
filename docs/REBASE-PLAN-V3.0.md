# WFED119 LifeCraft Bot - Major Rebase v3.0 Plan

> **문서 버전**: 3.0
> **작성일**: 2026-01-06
> **상태**: 완료 (Implemented)

---

## Executive Summary

LifeCraft Bot의 대규모 리베이스를 통해 다음을 구현합니다:
1. **Linear (순차적 강제) 모듈 진행** - 8개 모듈을 순서대로 완료해야 다음 진행
2. **Dreams → Vision 통합** - Dreams 기능을 Vision 모듈의 Step 4로 통합
3. **Full Data Integration** - 모든 모듈이 이전 모듈 데이터를 참조하고 AI 인사이트 제공
4. **Modern Minimalist UI** - 현대적 미니멀 디자인으로 전환

---

## Final Module Sequence (8 Modules)

| # | Module | Part | Korean Name | Description |
|---|--------|------|-------------|-------------|
| 1 | Values | Part 1: Self-Discovery | 가치관 탐색 | Terminal, Instrumental, Work values |
| 2 | Strengths | Part 1: Self-Discovery | 강점 발견 | AI 대화를 통한 강점 발견 |
| 3 | Enneagram | Part 1: Self-Discovery | 에니어그램 | 성격 유형 진단 |
| 4 | Life Themes | Part 1: Self-Discovery | 라이프 테마 | Career Construction Interview |
| 5 | Vision | Part 2: Vision & Mission | 비전 설계 | **Dreams 통합**, 비전 선언문 |
| 6 | SWOT | Part 3: Strategic Analysis | SWOT 분석 | 전략 분석 및 우선순위 |
| 7 | Goals | Part 4: Goal Setting | 목표 설정 | OKR 기반 역할별 목표 설정 |
| 8 | ERRC | Part 4: Goal Setting | ERRC 전략 | Blue Ocean + Wellbeing Wheel |

### Module Part Groupings

```typescript
export type ModulePart = 'self-discovery' | 'vision-mission' | 'strategic-analysis' | 'goal-setting';

export const MODULE_PARTS: Record<ModulePart, ModuleId[]> = {
  'self-discovery': ['values', 'strengths', 'enneagram', 'life-themes'],
  'vision-mission': ['vision'],
  'strategic-analysis': ['swot'],
  'goal-setting': ['goals', 'errc'],
};
```

---

## Phase 1: Database Changes

### 1.1 Update module_progress Constraint

**File:** `database/migrations/2026-01-06-update-module-progress-for-rebase.sql`

**변경사항:**
- 'dreams' 모듈 제거, 8개 모듈만 허용
- `get_user_module_summary` 함수 업데이트 (8모듈 순서)
- `get_user_journey_status` 함수 추가 (진행 상황 추적)

```sql
-- Remove 'dreams', keep 8 modules
ALTER TABLE public.module_progress
DROP CONSTRAINT IF EXISTS module_progress_module_id_check;

ALTER TABLE public.module_progress
ADD CONSTRAINT module_progress_module_id_check CHECK (
  module_id IN ('values', 'strengths', 'enneagram', 'life-themes',
                'vision', 'swot', 'goals', 'errc')
);
```

### 1.2 Create Integrated Profile Table

**File:** `database/migrations/2026-01-06-create-user-integrated-profiles.sql`

**새 테이블:** `user_integrated_profiles`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| top_values | JSONB | 상위 가치관 목록 |
| top_strengths | JSONB | 상위 강점 목록 |
| enneagram_type | INTEGER | 에니어그램 유형 |
| enneagram_wing | INTEGER | 에니어그램 날개 |
| life_themes | JSONB | 라이프 테마 목록 |
| dreams | JSONB | 꿈 목록 |
| core_aspirations | JSONB | 핵심 열망 |
| swot_summary | JSONB | SWOT 요약 |
| priority_strategies | JSONB | 우선순위 전략 |
| life_roles | JSONB | 삶의 역할 |
| key_objectives | JSONB | 핵심 목표 |
| errc_actions | JSONB | ERRC 행동 |
| ai_recommended_actions | JSONB | AI 추천 행동 |
| ai_growth_areas | JSONB | AI 성장 영역 |
| modules_completed | TEXT[] | 완료된 모듈 |
| profile_completeness | INTEGER | 프로필 완성도 (0-100) |

### 1.3 Update Vision Table for Dreams

**File:** `database/migrations/2026-01-06-update-vision-for-dreams.sql`

**추가 컬럼:**

| Column | Type | Description |
|--------|------|-------------|
| dreams | JSONB | 꿈 목록 |
| dreams_by_life_stage | JSONB | 생애 단계별 꿈 |
| dreams_completed | BOOLEAN | 꿈 단계 완료 여부 |

```sql
ALTER TABLE public.vision_statements
ADD COLUMN IF NOT EXISTS dreams JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS dreams_by_life_stage JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS dreams_completed BOOLEAN DEFAULT FALSE;
```

### 1.4 Dreams Data Migration

**File:** `database/migrations/2026-01-06-migrate-dreams-to-vision.sql`

**마이그레이션 절차:**
1. `dreams_sessions` 테이블 존재 여부 확인
2. 기존 dreams 데이터를 `vision_statements`로 이전
3. `dreams_by_category` → `dreams_by_life_stage` 변환
4. `module_progress`에서 'dreams' 레코드 삭제
5. `dreams_sessions` → `dreams_sessions_archive`로 이름 변경 (롤백 대비)

---

## Phase 2: Module Sequencing System

### 2.1 Type System Updates

**File:** `src/lib/types/modules.ts`

**주요 변경:**

```typescript
// ModuleId - 'dreams' 제거, 8개 모듈
export type ModuleId =
  | 'values' | 'strengths' | 'enneagram' | 'life-themes'
  | 'vision' | 'swot' | 'goals' | 'errc';

// MODULE_ORDER - 순서 정의
export const MODULE_ORDER: ModuleId[] = [
  'values', 'strengths', 'enneagram', 'life-themes',
  'vision', 'swot', 'goals', 'errc',
];

// Linear progression enforcement
export function canStartModuleLinear(
  moduleId: ModuleId,
  completedModules: Set<ModuleId>
): { canStart: boolean; missingPrerequisites: ModuleId[] } {
  const moduleIndex = MODULE_ORDER.indexOf(moduleId);
  if (moduleIndex === 0) return { canStart: true, missingPrerequisites: [] };

  const requiredModules = MODULE_ORDER.slice(0, moduleIndex);
  const missing = requiredModules.filter(m => !completedModules.has(m));

  return { canStart: missing.length === 0, missingPrerequisites: missing };
}

// Next module helper
export function getNextModule(
  completedModules: Set<ModuleId>
): ModuleId | null {
  for (const moduleId of MODULE_ORDER) {
    if (!completedModules.has(moduleId)) {
      return moduleId;
    }
  }
  return null; // All completed
}
```

### 2.2 Module Progress Service Updates

**File:** `src/lib/services/moduleProgressService.ts`

**새 메서드:**
- `getIntegratedProfile()` - 통합 프로필 조회
- `syncIntegratedProfile(moduleId)` - 모듈 완료 시 프로필 동기화
- `getCrossModuleContext(moduleId)` - 크로스 모듈 데이터 조회
- `generatePromptContext(moduleId)` - AI 프롬프트용 컨텍스트 생성

---

## Phase 3: Vision Module + Dreams Integration

### 3.1 Updated Vision Steps

| Step | Name | Description |
|------|------|-------------|
| 1 | Time Horizon | 3/5/10년 비전 기간 선택 |
| 2 | Future Imagery | 미래 이미지 상상 |
| 3 | Core Aspirations | 핵심 열망 정의 |
| 4 | **Dreams Matrix** | **NEW:** 꿈 목록 + Life Stage 매트릭스 |
| 5 | Vision Statement | 최종 비전 선언문 |

### 3.2 Dreams Matrix Step

**File:** `src/app/discover/vision/step4-dreams/page.tsx`

**기능:**
- 꿈 입력 UI (카테고리별)
- Life Stage 매트릭스 (immediate, 1-3years, 5years, 10years+)
- Wellbeing 차원 연결 (7가지)
- AI 분석 및 통찰

**Wellbeing Dimensions:**
```typescript
const WELLBEING_DIMENSIONS = [
  { id: 'physical', label: '신체적', color: 'green' },
  { id: 'emotional', label: '정서적', color: 'pink' },
  { id: 'intellectual', label: '지적', color: 'blue' },
  { id: 'social', label: '사회적', color: 'yellow' },
  { id: 'spiritual', label: '영적', color: 'purple' },
  { id: 'occupational', label: '직업적', color: 'orange' },
  { id: 'economic', label: '경제적', color: 'teal' },
];
```

---

## Phase 4: Dashboard Redesign

### 4.1 New Dashboard Structure

```
┌─────────────────────────────────────────────────────────┐
│  Header: LifeCraft Bot Dashboard                        │
├─────────────────────────────────────────────────────────┤
│  Journey Progress Map (Linear Visualization)            │
│  ●───○───○───○───○───○───○───○                          │
│  1   2   3   4   5   6   7   8                          │
│  Part 1      │Part 2│Part 3│  Part 4                    │
├─────────────────────────────────────────────────────────┤
│  Next Step Card (Current Module CTA)                    │
├───────────────────────────────┬─────────────────────────┤
│  Completed Modules Summary    │  Integrated Profile     │
│  (Expandable Accordion)       │  Card with AI Insights  │
└───────────────────────────────┴─────────────────────────┘
```

### 4.2 New Components

| Component | File | Purpose |
|-----------|------|---------|
| JourneyProgressMap | `src/components/dashboard/JourneyProgressMap.tsx` | 8개 모듈 선형 진행 시각화 |
| CompletedModulesSummary | `src/components/dashboard/CompletedModulesSummary.tsx` | 완료 모듈 요약 (접기/펼치기) |
| IntegratedProfileCard | `src/components/dashboard/IntegratedProfileCard.tsx` | 통합 프로필 + AI 인사이트 |

---

## Phase 5: Homepage Redesign

### 5.1 Simplified Structure

```
┌─────────────────────────────────────────────────────────┐
│  Hero: "AI 기반 커리어 코칭으로 삶을 디자인하세요"       │
│  Subtitle: "8개 모듈을 통한 체계적인 자기 발견 여정"     │
├─────────────────────────────────────────────────────────┤
│  Journey Overview (4 Parts Visualization)               │
│  [나를 알기] → [비전 설계] → [전략 분석] → [목표 설정]   │
│    4 modules     1 module     1 module    2 modules     │
├─────────────────────────────────────────────────────────┤
│  Primary CTA                                            │
│  [여정 시작하기] or [Continue to Module X]              │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Removed Elements
- Accordion 카테고리 섹션
- 개별 모듈 카드 (Dashboard로 이동)
- Aurora/Glass 배경 효과 (간소화)

---

## Phase 6: UI Design Changes

### 6.1 Design Token Updates

**File:** `src/app/globals.css`

```css
/* Card Utilities (replacing glassmorphism) */
.card {
  @apply bg-white rounded-xl border border-gray-200 shadow-sm;
}

.card-elevated {
  @apply bg-white rounded-xl shadow-md;
}

.card-interactive {
  @apply bg-white rounded-xl border border-gray-200 shadow-sm transition-all;
}

.card-interactive:hover {
  @apply shadow-md border-gray-300;
}

/* Typography Utilities */
.heading-1 {
  @apply text-4xl font-bold text-gray-900 tracking-tight;
}

.heading-2 {
  @apply text-2xl font-semibold text-gray-900;
}

.heading-3 {
  @apply text-lg font-medium text-gray-800;
}

/* Button Utilities */
.btn-primary {
  @apply px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors;
}

.btn-secondary {
  @apply px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors;
}

/* Module Status Badges */
.badge-completed {
  @apply inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full;
}

.badge-in-progress {
  @apply inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full;
}

.badge-locked {
  @apply inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded-full;
}
```

### 6.2 Legacy Glassmorphism (Kept for Backwards Compatibility)

```css
.glass-panel {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}
```

---

## Phase 7: Cross-Module Data Integration

### 7.1 Data Flow

```
Values ──────┬──→ Strengths (values 참조)
             ├──→ Enneagram (values 참조)
             ├──→ Life Themes (values 참조)
             └──→ Vision (all Part 1 참조)
                      │
                      └──→ SWOT (Strengths 자동 반영)
                               │
                               └──→ Goals (SWOT strategies 참조)
                                        │
                                        └──→ ERRC (Goals, SWOT 참조)
```

### 7.2 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/modules/context` | GET | 크로스 모듈 컨텍스트 조회 |
| `/api/modules/integrated-profile` | GET | 통합 프로필 조회 |
| `/api/modules/integrated-profile` | POST | 프로필 새로고침 (AI 분석) |

### 7.3 Context API Parameters

```
GET /api/modules/context?moduleId=swot&format=json
GET /api/modules/context?format=prompt  (모든 완료 모듈 데이터)
GET /api/modules/context  (moduleId 없이 호출 시 전체 데이터)
```

---

## Migration Execution Procedure

### Step 1: Database Migrations (순서 중요!)

```bash
# Supabase SQL Editor에서 순서대로 실행

# 1. Module progress constraint 업데이트
database/migrations/2026-01-06-update-module-progress-for-rebase.sql

# 2. Integrated profiles 테이블 생성
database/migrations/2026-01-06-create-user-integrated-profiles.sql

# 3. Vision 테이블에 Dreams 컬럼 추가
database/migrations/2026-01-06-update-vision-for-dreams.sql

# 4. Dreams 데이터 마이그레이션 (마지막에 실행)
database/migrations/2026-01-06-migrate-dreams-to-vision.sql
```

### Step 2: Verify Migration

```sql
-- 마이그레이션 검증 쿼리

-- 1. Module progress constraint 확인
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'module_progress_module_id_check';

-- 2. Integrated profiles 테이블 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_integrated_profiles';

-- 3. Vision statements Dreams 컬럼 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'vision_statements'
AND column_name IN ('dreams', 'dreams_by_life_stage', 'dreams_completed');

-- 4. Dreams 마이그레이션 결과 확인
SELECT COUNT(*) as users_with_dreams
FROM vision_statements
WHERE dreams IS NOT NULL AND jsonb_array_length(dreams) > 0;

-- 5. Archive 테이블 확인
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'dreams_sessions_archive'
);
```

### Step 3: Rollback Procedure (if needed)

```sql
-- 롤백이 필요한 경우

-- 1. Archive에서 dreams_sessions 복구
ALTER TABLE public.dreams_sessions_archive RENAME TO dreams_sessions;

-- 2. Module progress constraint 원복
ALTER TABLE public.module_progress
DROP CONSTRAINT IF EXISTS module_progress_module_id_check;

ALTER TABLE public.module_progress
ADD CONSTRAINT module_progress_module_id_check CHECK (
  module_id IN ('values', 'strengths', 'enneagram', 'life-themes',
                'vision', 'dreams', 'swot', 'goals', 'errc')
);

-- 3. Vision Dreams 컬럼 제거 (데이터 손실 주의)
ALTER TABLE public.vision_statements
DROP COLUMN IF EXISTS dreams,
DROP COLUMN IF EXISTS dreams_by_life_stage,
DROP COLUMN IF EXISTS dreams_completed;
```

---

## File Changes Summary

### New Files Created

| File | Purpose |
|------|---------|
| `database/migrations/2026-01-06-update-module-progress-for-rebase.sql` | Module constraint |
| `database/migrations/2026-01-06-create-user-integrated-profiles.sql` | Profile table |
| `database/migrations/2026-01-06-update-vision-for-dreams.sql` | Vision columns |
| `database/migrations/2026-01-06-migrate-dreams-to-vision.sql` | Data migration |
| `src/components/dashboard/JourneyProgressMap.tsx` | Progress visualization |
| `src/components/dashboard/CompletedModulesSummary.tsx` | Module summaries |
| `src/components/dashboard/IntegratedProfileCard.tsx` | Profile card |
| `src/components/dashboard/index.ts` | Component exports |
| `src/app/discover/vision/step4-dreams/page.tsx` | Dreams step |
| `src/app/api/modules/integrated-profile/route.ts` | Profile API |

### Modified Files

| File | Changes |
|------|---------|
| `src/lib/types/modules.ts` | ModuleId, MODULE_ORDER, linear functions |
| `src/lib/services/moduleProgressService.ts` | Profile sync, context methods |
| `src/app/dashboard/page.tsx` | New dashboard layout |
| `src/components/HomePage.tsx` | Simplified 4-part design |
| `src/components/ModuleProgressCard.tsx` | 8 modules |
| `src/components/ModuleProgressSection.tsx` | 8 modules |
| `src/app/api/modules/context/route.ts` | All-data fetch support |
| `src/app/globals.css` | New design tokens |

---

## Testing Checklist

### Linear Progression
- [ ] 첫 번째 모듈(values) 접근 가능 확인
- [ ] 완료되지 않은 이전 모듈이 있으면 다음 모듈 잠금 확인
- [ ] 모든 모듈 순차 완료 시 전체 완료 표시

### Dreams Integration
- [ ] Vision Step 4에서 Dreams UI 표시 확인
- [ ] 기존 dreams_sessions 데이터 마이그레이션 확인
- [ ] Dreams 완료 시 Vision dreams_completed 업데이트

### Dashboard
- [ ] JourneyProgressMap 8개 모듈 표시
- [ ] CompletedModulesSummary 접기/펼치기 동작
- [ ] IntegratedProfileCard AI 인사이트 표시

### Cross-Module Data
- [ ] /api/modules/context API 응답 확인
- [ ] /api/modules/integrated-profile API 응답 확인
- [ ] 모듈 완료 시 프로필 자동 동기화

---

## Release Information

**Version:** 3.0.0
**Release Date:** 2026-01-06
**GitHub Release:** https://github.com/HosungYou/wfed119/releases/tag/v3.0

### Breaking Changes
- Module count reduced from 9 to 8 (Dreams integrated into Vision)
- Linear progression enforced (all previous modules must be completed)
- Dreams module removed as standalone (now Vision Step 4)

---

## Contact

For questions about this rebase plan, contact the development team or refer to:
- Repository: https://github.com/HosungYou/wfed119
- Documentation: `/docs/` directory
- Release Notes: `/release-notes/` directory
