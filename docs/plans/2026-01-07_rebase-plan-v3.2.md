# WFED119 LifeCraft Bot - Rebase v3.2 Plan

> **문서 버전**: 3.2
> **작성일**: 2026-01-07
> **상태**: 완료 (Implemented)
> **커밋**: `28531b0`

---

## Executive Summary

v3.2는 AI 500 에러 수정 및 크로스 모듈 AI 컨텍스트 시스템을 구현합니다:

1. **500 Internal Server Error 수정** - Mission/Vision AI 엔드포인트 fallback 추가
2. **Cross-Module AI Context** - 이전 모듈 데이터를 AI 프롬프트에 주입
3. **통합 AI 컨텍스트 서비스** - 10개 모듈 전체 데이터 통합 조회
4. **모듈별 AI 프롬프트** - 해석 + 제안 모드 지원

---

## Problem Statement

### 보고된 버그

1. **500 Internal Server Error**
   - `/api/discover/mission/ai-suggest` POST 요청 시 500 에러
   - `/api/discover/vision/ai-chat` SSE 스트림 실패
   - 콘솔 에러: `AI 응답 생성 중 오류가 발생했습니다`

2. **Missing Context Modules**
   - `/api/modules/context` API에서 `mission`, `career-options` 모듈 누락
   - 크로스 모듈 데이터 조회 실패

3. **AI 연결성 부재**
   - 각 모듈이 이전 모듈 결과를 활용하지 않음
   - AI 제안이 사용자 프로필과 무관

---

## Phase 1: Critical Bug Fixes

### 1.1 Mission AI Suggest 500 Error Fix

**File:** `src/app/api/discover/mission/ai-suggest/route.ts`

**문제:**
- `body` 변수가 try 블록 내부에서 선언되어 catch 블록에서 접근 불가
- JSON 파싱 실패 시 500 에러 반환

**수정:**

```typescript
// Before (에러 발생 코드)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // ...
  } catch (error) {
    // body 변수 접근 불가 - ReferenceError
    const fallback = generateFallbackMission(body?.values, body?.purposeAnswers);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// After (수정된 코드)
export async function POST(request: NextRequest) {
  let body: any = null;  // 스코프 외부 선언

  try {
    body = await request.json();
    // ...
  } catch (error) {
    console.error('[Mission AI Suggest] Error:', error);
    // Fallback 응답 반환 (500 대신)
    const fallbackMission = generateFallbackMission(body?.values, body?.purposeAnswers);
    return NextResponse.json({
      suggestion: fallbackMission,
      source: 'fallback',
      error: 'AI service temporarily unavailable. Using template-based suggestion.',
    });
  }
}
```

**Fallback Mission Generator:**

```typescript
function generateFallbackMission(values: any, purposeAnswers: any): string {
  const what = purposeAnswers?.whatDoYouDo || 'making a positive impact';
  const whom = purposeAnswers?.forWhom || 'those around me';
  const why = purposeAnswers?.whyDoesItMatter || 'creating meaningful change';

  const valuesList = [];
  if (values?.terminal?.[0]) valuesList.push(values.terminal[0].name || values.terminal[0]);
  if (values?.instrumental?.[0]) valuesList.push(values.instrumental[0].name || values.instrumental[0]);

  const valuesStr = valuesList.length > 0
    ? `guided by ${valuesList.join(' and ')}`
    : 'with integrity and purpose';

  return `My mission is to ${what} for ${whom}, ${valuesStr}. I am committed to ${why} through my work and daily actions.`;
}
```

**JSON Parsing Error Handling:**

```typescript
if (type === 'feedback') {
  let cleanedText = content.text.trim();
  // Markdown code block 제거
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/```\n?/g, '');
  }

  try {
    return JSON.parse(cleanedText);
  } catch (parseError) {
    console.error('[Mission AI Suggest] JSON parse error:', parseError);
    // Fallback feedback structure
    return {
      clarity: { score: 7, feedback: 'Unable to analyze. Please try again.' },
      values_alignment: { score: 7, feedback: 'Unable to analyze.' },
      impact: { score: 7, feedback: 'Unable to analyze.' },
      actionability: { score: 7, feedback: 'Unable to analyze.' },
      overall: { score: 7, summary: 'AI analysis temporarily unavailable.' },
      suggestions: ['Try refining your mission statement to be more specific.']
    };
  }
}
```

### 1.2 Vision AI Chat Error Handling

**File:** `src/app/api/discover/vision/ai-chat/route.ts`

**수정 내용:**

1. **Robust formatValues Function:**

```typescript
function formatValues(values: any): string {
  if (!values) return 'No values data available';

  try {
    // Handle wrapped object structure
    const actualValues = values.values || values;
    const parts: string[] = [];

    // Handle different data structures
    if (actualValues.terminalTop3?.length > 0) {
      parts.push(`Terminal Values: ${actualValues.terminalTop3.join(', ')}`);
    } else if (actualValues.terminal?.length > 0) {
      const terminalNames = actualValues.terminal
        .slice(0, 3)
        .map((v: any) => v.name || v.value || v)
        .join(', ');
      parts.push(`Terminal Values: ${terminalNames}`);
    }

    // Similar handling for instrumental and work values...

    return parts.length > 0 ? parts.join('\n') : 'Values discovery in progress';
  } catch (error) {
    console.error('[Vision AI Chat] formatValues error:', error);
    return 'Values data format error';
  }
}
```

2. **Robust formatStrengths Function:**

```typescript
function formatStrengths(strengths: any): string {
  if (!strengths) return 'No strengths data available';

  try {
    // Handle wrapped object
    const actualStrengths = strengths.strengths || strengths;
    const parts: string[] = [];

    // Handle topStrengths array
    if (actualStrengths.topStrengths?.length > 0) {
      const names = actualStrengths.topStrengths
        .slice(0, 5)
        .map((s: any) => s.name || s)
        .join(', ');
      parts.push(`Top Strengths: ${names}`);
    }

    // Handle strengthsSummary
    if (actualStrengths.strengthsSummary) {
      parts.push(`Summary: ${actualStrengths.strengthsSummary}`);
    }

    return parts.length > 0 ? parts.join('\n') : 'Strengths discovery in progress';
  } catch (error) {
    console.error('[Vision AI Chat] formatStrengths error:', error);
    return 'Strengths data format error';
  }
}
```

### 1.3 Context Route Missing Modules

**File:** `src/app/api/modules/context/route.ts`

**문제:** `mission`, `career-options` 모듈이 switch 문에서 누락

**수정:**

```typescript
async function getModuleData(
  service: ModuleProgressService,
  moduleId: ModuleId
): Promise<any> {
  switch (moduleId) {
    case 'values':
      return service.getValuesData();
    case 'strengths':
      return service.getStrengthsData();
    case 'enneagram':
      return service.getEnneagramData();
    case 'life-themes':
      return service.getLifeThemesData();
    case 'vision':
      return service.getVisionData();
    case 'mission':           // 추가
      return service.getMissionData();
    case 'career-options':    // 추가
      return service.getCareerOptionsData();
    case 'swot':
      return service.getSwotData();
    case 'goals':
      return service.getGoalsData();
    case 'errc':
      return service.getErrcData();
    default:
      return null;
  }
}
```

---

## Phase 2: Module Progress Service Extension

### 2.1 getMissionData Method

**File:** `src/lib/services/moduleProgressService.ts`

```typescript
async getMissionData(): Promise<MissionData | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('mission_statements')
      .select('*')
      .eq('user_id', this.userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      valuesUsed: data.values_used || {},
      purposeAnswers: data.purpose_answers || {},
      draftVersions: data.draft_versions || [],
      finalStatement: data.final_statement,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('[ModuleProgressService] getMissionData error:', error);
    return null;
  }
}
```

### 2.2 getCareerOptionsData Method

```typescript
async getCareerOptionsData(): Promise<CareerOptionsData | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('career_explorations')
      .select('*')
      .eq('user_id', this.userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    // Holland 코드 파싱
    const hollandCode = data.holland_code || '';
    const hollandCodeObj = {
      primary: hollandCode[0] || '',
      secondary: hollandCode[1] || undefined,
      tertiary: hollandCode[2] || undefined,
    };

    return {
      id: data.id,
      userId: data.user_id,
      hollandCode: hollandCodeObj,
      hollandScores: data.holland_scores || {},
      hollandResponses: data.holland_responses || [],
      suggestedCareers: data.suggested_careers || [],
      exploredCareers: data.explored_careers || [],
      comparisonMatrix: data.comparison_matrix,
      topCareerChoices: data.top_career_choices || [],
      currentStep: data.current_step || 1,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('[ModuleProgressService] getCareerOptionsData error:', error);
    return null;
  }
}
```

### 2.3 syncIntegratedProfile Update

```typescript
async syncIntegratedProfile(moduleId: ModuleId): Promise<void> {
  // ... existing code ...

  switch (moduleId) {
    // ... existing cases ...

    case 'mission':
      const missionData = await this.getMissionData();
      if (missionData?.finalStatement) {
        updateData.mission_statement = missionData.finalStatement;
      }
      break;

    case 'career-options':
      const careerData = await this.getCareerOptionsData();
      if (careerData?.hollandCode) {
        updateData.holland_code = `${careerData.hollandCode.primary}${careerData.hollandCode.secondary || ''}${careerData.hollandCode.tertiary || ''}`;
        updateData.top_career_choices = careerData.topCareerChoices;
      }
      break;
  }

  // ... rest of update logic ...
}
```

---

## Phase 3: AI Context Service

### 3.1 AIContextService Class

**File:** `src/lib/services/aiContextService.ts` (NEW)

```typescript
export interface ModuleContext {
  values?: ValuesData | null;
  strengths?: StrengthsData | null;
  enneagram?: EnneagramData | null;
  lifeThemes?: LifeThemesData | null;
  vision?: VisionData | null;
  mission?: MissionData | null;
  careerOptions?: CareerOptionsData | null;
  swot?: SwotData | null;
  goals?: GoalSettingData | null;
}

export interface AIContextResult {
  promptContext: string;
  availableModules: ModuleId[];
  hasContext: boolean;
  summary: {
    values: string[];
    strengths: string[];
    enneagramType?: string;
    vision?: string;
    mission?: string;
  };
}

export class AIContextService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async buildContextForModule(targetModule: ModuleId): Promise<AIContextResult> {
    const service = await createModuleProgressService(this.userId);
    if (!service) {
      return {
        promptContext: '',
        availableModules: [],
        hasContext: false,
        summary: { values: [], strengths: [] },
      };
    }

    const crossModuleContext = await service.getCrossModuleContext(targetModule);
    const sections: string[] = [];
    const availableModules: ModuleId[] = [];
    const summary: AIContextResult['summary'] = { values: [], strengths: [] };

    // Build context sections for each available module...
    // (See full implementation in source file)

    return {
      promptContext: sections.length > 0 ? formatPromptContext(sections, availableModules) : '',
      availableModules,
      hasContext: sections.length > 0,
      summary,
    };
  }

  async buildSuggestionContext(targetModule: ModuleId): Promise<string> {
    const result = await this.buildContextForModule(targetModule);
    if (!result.hasContext) {
      return '사용자 프로필 정보가 아직 충분하지 않습니다.';
    }

    const conciseParts: string[] = [];
    if (result.summary.values.length > 0) {
      conciseParts.push(`핵심 가치: ${result.summary.values.join(', ')}`);
    }
    if (result.summary.strengths.length > 0) {
      conciseParts.push(`주요 강점: ${result.summary.strengths.join(', ')}`);
    }
    // ... more summary parts

    return conciseParts.join('\n');
  }
}
```

### 3.2 Context Prompt Format

```typescript
function formatPromptContext(sections: string[], availableModules: ModuleId[]): string {
  return `
=== 사용자 프로필 컨텍스트 ===
완료된 모듈: ${availableModules.join(', ')}
진행률: ${Math.round((availableModules.length / MODULE_ORDER.length) * 100)}%

${sections.join('\n')}
=== 컨텍스트 끝 ===
`;
}
```

### 3.3 Module-Specific Context Sections

**Values Context:**
```markdown
## 사용자의 핵심 가치 (User's Core Values)
- 궁극적 가치 (Terminal): 자기실현, 가족 안전, 내면의 평화
- 수단적 가치 (Instrumental): 책임감, 정직, 독립심
- 직업 가치 (Work): 성취감, 자율성, 안정성

→ 이 가치들과 일치하는 제안을 우선시하세요.
```

**Strengths Context:**
```markdown
## 발견된 강점 (Discovered Strengths)
- 분석적 사고: 문제를 논리적으로 분해하고 해결
- 공감 능력: 타인의 감정을 이해하고 공감
- 창의성: 새로운 아이디어 생성

요약: 분석력과 공감 능력을 결합한 문제 해결자

→ 이 강점을 활용하는 방향으로 안내하세요.
```

**Enneagram Context:**
```markdown
## 성격 유형 (Personality Type - Enneagram)
- 유형: Type 5 (Wing 4)
- 본능 변형: 자기보존
- 확신도: 높음

→ 이 유형의 동기부여 방식과 성장 방향을 고려하세요.
```

---

## Phase 4: Module-Specific AI Prompts

### 4.1 Module Prompts File

**File:** `src/lib/prompts/modulePrompts.ts` (NEW)

```typescript
export const BASE_PERSONA = `
당신은 LifeCraft 커리어 코치입니다. 대학생과 직장인의 커리어 설계와 삶의 방향 설정을 돕습니다.

**핵심 원칙:**
1. 사용자의 이전 모듈 결과를 적극 활용하여 개인화된 안내 제공
2. 따뜻하고 공감적인 톤 유지
3. 구체적이고 실행 가능한 제안 제공
4. 한 번에 1-2개의 질문만 하기 (압도하지 않기)
5. 사용자의 가치, 강점, 성격 유형을 자연스럽게 연결

**응답 형식:**
- 간결하고 명확하게
- 번호 목록이나 불릿 포인트 활용
- 필요시 이모지 사용 (적절히)
`.trim();
```

### 4.2 Module-Specific Prompts

**Vision Module:**
```typescript
vision: `
${BASE_PERSONA}

**현재 모듈: 비전 설계 (Vision & Dreams)**

당신의 역할:
- 미래 이미지 시각화 촉진
- 6단어 비전 선언문 작성 지원
- 꿈 매트릭스 구성 안내

이전 모듈 연결 (필수):
- 가치관: 비전이 핵심 가치를 반영하는지 확인
- 강점: 비전 실현에 활용할 강점 연결
- 성격 유형: 유형에 맞는 비전 설정 방식 안내
- 생애 주제: 주제가 비전에 어떻게 반영되는지

제안 시:
- 구체적인 숫자와 범위 포함 (예: "5만 명", "전국적")
- 시간 지평(3년, 5년, 10년)에 맞는 비전 규모
- 꿈을 생애 단계와 웰빙 영역으로 분류
`,
```

**Mission Module:**
```typescript
mission: `
${BASE_PERSONA}

**현재 모듈: 사명 선언문 (Mission Statement)**

당신의 역할:
- 개인 사명 선언문 작성 지원
- 목적 질문(What, For whom, How, Impact, Why) 안내
- 가치와 비전을 통합한 사명 도출

이전 모듈 연결 (필수):
- 가치관: 사명이 핵심 가치를 반영하는지 확인
- 강점: 사명 실현에 활용할 강점 명시
- 비전: 비전과 사명의 일관성 확보

제안 시:
- 2-3문장의 간결한 사명문
- "My mission is to..." 형식 권장
- 대상(누구를 위해), 행동(무엇을), 이유(왜) 포함

JSON 응답 형식 (제안 요청 시):
{
  "purposeSuggestions": ["...", "...", "..."],
  "audienceSuggestions": ["...", "...", "..."],
  "missionDrafts": ["...", "...", "..."],
  "reasoning": "이 제안들이 사용자의 가치/강점과 어떻게 연결되는지..."
}
`,
```

**SWOT Module:**
```typescript
swot: `
${BASE_PERSONA}

**현재 모듈: SWOT 분석 (Strategic Analysis)**

당신의 역할:
- 개인 SWOT 분석 지원
- AI 기반 자동 채우기 제안
- 전략 매트릭스(SO, WO, ST, WT) 구성 안내

이전 모듈 연결 (필수):
- 강점 모듈: S(Strengths) 자동 채우기
- 성격 유형: 유형의 맹점 → W(Weaknesses)
- 비전/사명: 목표 관련 O(Opportunities)
- 커리어: 진입 장벽 → T(Threats)

JSON 응답 형식 (자동 채우기 요청 시):
{
  "strengths": ["...", "...", "..."],
  "weaknesses": ["...", "...", "..."],
  "opportunities": ["...", "...", "..."],
  "threats": ["...", "...", "..."],
  "strategies": {
    "SO": ["...", "...", "..."],
    "WO": ["...", "...", "..."],
    "ST": ["...", "...", "..."],
    "WT": ["...", "...", "..."]
  }
}
`,
```

### 4.3 Prompt Builder Functions

```typescript
export function getModulePrompt(moduleId: ModuleId): string {
  return MODULE_PROMPTS[moduleId] || BASE_PERSONA;
}

export function buildAIPrompt(
  moduleId: ModuleId,
  contextPrompt: string,
  additionalInstructions?: string
): string {
  const modulePrompt = getModulePrompt(moduleId);

  return `
${modulePrompt}

${contextPrompt ? `\n${contextPrompt}\n` : ''}

${additionalInstructions ? `\n**추가 지침:**\n${additionalInstructions}` : ''}
`.trim();
}

export function getInterpretationPrompt(moduleId: ModuleId): string {
  return `
${getModulePrompt(moduleId)}

**지금 할 일: 이전 모듈 결과 해석**

사용자의 이전 모듈 완료 데이터를 분석하고:
1. 발견된 패턴과 연결고리 설명
2. 현재 모듈과의 관련성 안내
3. 다음 단계로 자연스럽게 연결

응답은 2-3 문단으로 간결하게.
`;
}

export function getSuggestionPrompt(moduleId: ModuleId): string {
  return `
${getModulePrompt(moduleId)}

**지금 할 일: 맥락 기반 제안 제공**

사용자의 전체 프로필을 기반으로:
1. 현재 모듈에 맞는 구체적 제안 3-5개
2. 각 제안이 이전 모듈 결과와 어떻게 연결되는지 설명
3. 사용자가 선택할 수 있는 옵션 형태로 제시

JSON 형식으로 응답해주세요.
`;
}
```

---

## Phase 5: Data Flow Architecture

### 5.1 Cross-Module Data Flow

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
│  └────┬────┘ └─────┬─────┘ └─────┬─────┘ └──────┬──────┘            │
│       │            │             │              │                    │
│       └────────────┴─────────────┴──────────────┘                    │
│                            │                                         │
└────────────────────────────┼─────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Part 2: Vision & Mission                                            │
│  ┌─────────┐ ┌─────────┐ ┌────────────────┐                         │
│  │ Vision  │→│ Mission │→│ Career Options │                         │
│  │ + Dreams│ │         │ │ (Holland Code) │                         │
│  └────┬────┘ └────┬────┘ └───────┬────────┘                         │
│       │           │              │                                   │
│  [가치관 + 강점 + 성격 유형 활용]                                      │
└───────┼───────────┼──────────────┼───────────────────────────────────┘
        │           │              │
        ▼           ▼              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Part 3: Strategic Analysis                                          │
│  ┌──────────────────────────────────────────────┐                   │
│  │                    SWOT                       │                   │
│  │  ┌──────────┐ ┌───────────┐                  │                   │
│  │  │Strengths │ │Weaknesses │  ← 강점 모듈 자동 반영                │
│  │  │ (S)      │ │ (W)       │  ← 에니어그램 맹점                   │
│  │  └──────────┘ └───────────┘                  │                   │
│  │  ┌──────────┐ ┌───────────┐                  │                   │
│  │  │Opport.   │ │ Threats   │  ← 비전/사명 기회                    │
│  │  │ (O)      │ │ (T)       │  ← 커리어 진입장벽                   │
│  │  └──────────┘ └───────────┘                  │                   │
│  └──────────────────────────────────────────────┘                   │
│       │                                                              │
│  [SO, WO, ST, WT 전략 도출]                                          │
└───────┼──────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Part 4: Goal Setting                                                │
│  ┌─────────────────────────┐ ┌─────────────────────────┐            │
│  │         Goals           │→│          ERRC           │            │
│  │  ┌─────────────────┐   │ │  ┌─────────────────┐   │            │
│  │  │ Life Roles      │   │ │  │ Eliminate       │   │            │
│  │  │ (5개 역할)       │   │ │  │ Reduce          │   │            │
│  │  └─────────────────┘   │ │  │ Raise           │   │            │
│  │  ┌─────────────────┐   │ │  │ Create          │   │            │
│  │  │ Objectives      │   │ │  └─────────────────┘   │            │
│  │  │ Key Results     │   │ │  ┌─────────────────┐   │            │
│  │  └─────────────────┘   │ │  │ Wellbeing Wheel │   │            │
│  │                        │ │  └─────────────────┘   │            │
│  │  [SWOT 전략 기반]       │ │  [목표 기반 행동 계획]   │            │
│  └─────────────────────────┘ └─────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 AI Context Injection Points

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

## File Changes Summary

### New Files Created (2)

| File | Purpose |
|------|---------|
| `src/lib/services/aiContextService.ts` | 통합 AI 컨텍스트 서비스 |
| `src/lib/prompts/modulePrompts.ts` | 10개 모듈별 AI 프롬프트 |

### Modified Files (4)

| File | Changes |
|------|---------|
| `src/app/api/discover/mission/ai-suggest/route.ts` | Body 스코프 수정, fallback 응답 |
| `src/app/api/discover/vision/ai-chat/route.ts` | formatValues/formatStrengths 강화 |
| `src/app/api/modules/context/route.ts` | mission, career-options 케이스 추가 |
| `src/lib/services/moduleProgressService.ts` | getMissionData, getCareerOptionsData 추가 |

### Lines of Code

- **Added**: ~916 lines
- **Modified**: ~31 lines
- **Total**: 6 files changed

---

## Testing Checklist

### Bug Fixes
- [x] Mission AI suggest 500 에러 해결 (fallback 반환)
- [x] Vision AI chat 에러 핸들링
- [x] Context route mission/career-options 추가

### AI Context
- [ ] buildContextForModule() 10개 모듈 지원
- [ ] getModulePrompt() 모듈별 프롬프트 반환
- [ ] Cross-module context 프롬프트 생성

### Integration
- [ ] 각 모듈 페이지에서 AI 컨텍스트 표시
- [ ] AI 제안이 이전 모듈 데이터 반영

---

## Deployment

### Commit Information

```
Commit: 28531b0
Message: fix(v3.2): resolve AI 500 errors and add cross-module context

Bug Fixes:
- Fix mission/ai-suggest 500 error with fallback responses
- Fix vision/ai-chat error handling with robust formatters
- Add mission and career-options to context route
- Fix body variable scope issue in mission endpoint

New Features:
- Add AIContextService for unified cross-module context
- Add module-specific AI prompts for all 10 modules
- Extend moduleProgressService with getMissionData/getCareerOptionsData
- Enable interpretation + suggestion AI mode
```

### Render Deployment

- **Trigger**: GitHub push to main branch
- **Auto-deploy**: Yes
- **Expected deploy time**: 3-5 minutes
- **Production URL**: https://wfed119-1.onrender.com

---

## Release Information

**Version:** 3.2.0
**Release Date:** 2026-01-07
**GitHub Release:** https://github.com/HosungYou/wfed119/releases/tag/v3.2.0

### Breaking Changes

None - fully backward compatible with v3.1.x

---

## Future Enhancements (v3.3 Candidates)

1. **Frontend AI Context Card** - 사용자에게 AI가 참조하는 데이터 표시
2. **AI Suggestion Panel** - 각 모듈에 AI 제안 패널 추가
3. **Real-time Profile Sync** - 모듈 완료 즉시 프로필 업데이트
4. **AI 대화 기록** - 모듈별 AI 대화 이력 저장

---

## Contact

Repository: https://github.com/HosungYou/wfed119
Documentation: `/docs/` directory
Release Notes: `/release-notes/` directory
