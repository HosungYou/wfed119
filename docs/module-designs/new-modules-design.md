# New Module Designs: Life Themes, Goal Setting, ERRC Action Plan

Based on LifeCraft textbook analysis and existing module architecture.

**Last Updated:** 2024-12-02
**Review Status:** Codex Reviewed - Issues Addressed

---

## Codex Review Feedback (Incorporated)

### High Priority (Addressed)
- ✅ Removed redundant `user_id` from child tables - ownership enforced via session_id
- ✅ Added UNIQUE constraints for ordering/uniqueness (question_number, priority_rank, role_number, etc.)
- ✅ Added composite constraints where needed

### Medium Priority (Addressed)
- ✅ Changed nullable FKs to NOT NULL for required dependencies
- ✅ Removed computed `total_percentage` - calculated in queries/app layer
- ✅ Changed `related_role` to FK reference to goal_roles
- ✅ Added enums for wellbeing_area

### API Improvements (Recommended)
- Use nested resource paths: `/sessions/:id/roles`, `/roles/:id/objectives`
- Use PATCH for updates, DELETE where applicable
- Tie AI operations to session ID in path

### Additional Considerations
- Add RLS policies for all new tables
- Add indexes on all foreign keys
- Plan background jobs for deadline notifications
- Consider soft-deletes for AI outputs

---

## Module Architecture Overview

### Current Module Flow
```
Values → Strengths → Vision → SWOT → Dreams
```

### Proposed New Module Flow
```
Values → Enneagram → Life Themes → Strengths → Vision → SWOT → Goal Setting → ERRC → Dreams
```

### Module Dependencies
| Module | Prerequisites (Required) | Data Sources (Optional) |
|--------|--------------------------|------------------------|
| Life Themes | Enneagram | Values |
| Goal Setting | Vision, SWOT | Values, Strengths, Life Themes |
| ERRC Action Plan | Goal Setting | SWOT strategies |

---

## 1. Life Themes Module (인생 테마)

### Purpose
Help users discover recurring patterns and themes in their lives through structured interview questions, based on Mark Savickas's Career Construction Interview methodology.

### Database Schema

```sql
-- Main life themes session (ownership at session level only)
CREATE TABLE life_themes_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  current_question INTEGER DEFAULT 1 CHECK (current_question BETWEEN 1 AND 6),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  -- Only one in-progress session per user
  UNIQUE (user_id, status) WHERE status = 'in_progress'
);

-- Interview responses for each question (no user_id - enforced via session)
CREATE TABLE life_themes_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES life_themes_sessions(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL CHECK (question_number BETWEEN 1 AND 6),
  question_type TEXT NOT NULL CHECK (question_type IN (
    'role_models',      -- Q1: 존경하는 사람
    'media_interests',  -- Q2: 좋아하는 미디어
    'hobbies',          -- Q3: 취미와 여가
    'mottos',           -- Q4: 좌우명/명언
    'school_subjects',  -- Q5: 학교 과목
    'early_memories'    -- Q6: 어린 시절 기억
  )),
  response_data JSONB NOT NULL,
  -- response_data structure varies by question_type:
  -- role_models: { entries: [{ name, description, similarities, differences }] }
  -- media_interests: { entries: [{ name, reason }] }
  -- hobbies: { entries: [{ name, enjoyment_reason }] }
  -- mottos: { entries: [{ quote, meaning }] }
  -- school_subjects: { liked: [{ name, reason }], disliked: [{ name, reason }] }
  -- early_memories: { entries: [{ title, description, emotions }] }
  patterns_found TEXT[], -- Common patterns identified in this response
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- One response per question per session
  UNIQUE (session_id, question_number)
);

-- Discovered themes (4-5 themes derived from all responses)
CREATE TABLE life_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES life_themes_sessions(id) ON DELETE CASCADE,
  theme_name TEXT NOT NULL,
  theme_description TEXT,
  related_questions INTEGER[], -- Which questions contributed to this theme
  related_patterns TEXT[], -- Patterns that led to this theme
  priority_rank INTEGER CHECK (priority_rank BETWEEN 1 AND 5), -- 1-5, user-ranked priority
  enneagram_connection TEXT, -- How this relates to their Enneagram type
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Unique priority rank per session
  UNIQUE (session_id, priority_rank)
);

-- AI analysis results (one per session)
CREATE TABLE life_themes_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES life_themes_sessions(id) ON DELETE CASCADE,
  ai_summary TEXT,
  cross_question_patterns JSONB, -- Patterns found across multiple questions
  theme_recommendations JSONB, -- AI-suggested themes
  enneagram_integration TEXT, -- How themes relate to Enneagram
  values_integration TEXT, -- How themes relate to Values
  created_at TIMESTAMPTZ DEFAULT now(),
  -- One analysis per session
  UNIQUE (session_id)
);

-- Indexes for performance
CREATE INDEX idx_life_themes_sessions_user ON life_themes_sessions(user_id);
CREATE INDEX idx_life_themes_responses_session ON life_themes_responses(session_id);
CREATE INDEX idx_life_themes_session ON life_themes(session_id);

-- RLS Policies
ALTER TABLE life_themes_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_themes_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_themes_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sessions" ON life_themes_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage responses via session" ON life_themes_responses
  FOR ALL USING (
    session_id IN (SELECT id FROM life_themes_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage themes via session" ON life_themes
  FOR ALL USING (
    session_id IN (SELECT id FROM life_themes_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view analysis via session" ON life_themes_analysis
  FOR ALL USING (
    session_id IN (SELECT id FROM life_themes_sessions WHERE user_id = auth.uid())
  );
```

### TypeScript Interfaces

```typescript
// src/lib/types/lifeThemes.ts

export type QuestionType =
  | 'role_models'
  | 'media_interests'
  | 'hobbies'
  | 'mottos'
  | 'school_subjects'
  | 'early_memories';

export interface RoleModelEntry {
  name: string;
  description: string;
  similarities: string;
  differences: string;
}

export interface MediaEntry {
  name: string;
  reason: string;
}

export interface HobbyEntry {
  name: string;
  enjoymentReason: string;
}

export interface MottoEntry {
  quote: string;
  meaning: string;
}

export interface SubjectEntry {
  name: string;
  reason: string;
}

export interface EarlyMemoryEntry {
  title: string;
  description: string;
  emotions: string;
}

export interface LifeThemesResponse {
  id: string;
  sessionId: string;
  questionNumber: number;
  questionType: QuestionType;
  responseData: any; // Varies by question type
  patternsFound: string[];
}

export interface LifeTheme {
  id: string;
  sessionId: string;
  themeName: string;
  themeDescription: string;
  relatedQuestions: number[];
  relatedPatterns: string[];
  priorityRank: number;
  enneagramConnection: string;
}

export interface LifeThemesData {
  themes: LifeTheme[];
  responses: LifeThemesResponse[];
  aiSummary: string;
  crossQuestionPatterns: Record<string, string[]>;
}
```

### API Routes

```
GET  /api/life-themes/session - Get current session
POST /api/life-themes/session - Create/update session
GET  /api/life-themes/responses - Get all responses
POST /api/life-themes/responses - Save response for a question
GET  /api/life-themes/themes - Get discovered themes
POST /api/life-themes/themes - Save/update themes
POST /api/life-themes/analyze - AI analysis of patterns
POST /api/life-themes/finalize - Complete session with final themes
```

### UI Components

1. **Question Flow Page** (`/discover/life-themes`)
   - 6 questions with expandable entry forms
   - Progress indicator (1-6)
   - Pattern identification helper

2. **Pattern Discovery Page** (`/discover/life-themes/patterns`)
   - Visual connections between responses
   - AI-suggested patterns
   - User confirmation/editing

3. **Themes Summary Page** (`/discover/life-themes/themes`)
   - 4-5 discovered themes with descriptions
   - Priority ranking (drag-drop)
   - Enneagram connection display

4. **Results Page** (`/discover/life-themes/results`)
   - Final summary with all themes
   - Export functionality
   - Integration with other modules

---

## 2. Goal Setting Module (목표 설정)

### Purpose
Implement OKR-based role-focused goal setting following LifeCraft's 7 principles, integrated with SWOT strategies.

### Database Schema

```sql
-- Goal setting session (required link to SWOT)
CREATE TABLE goal_setting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  swot_analysis_id UUID NOT NULL REFERENCES swot_analyses(id) ON DELETE RESTRICT,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  -- total_percentage computed in queries, not stored
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  -- Only one in-progress session per user
  UNIQUE (user_id) WHERE status = 'in_progress'
);

-- Life roles (5-7 roles including Wellbeing as #1)
CREATE TABLE goal_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES goal_setting_sessions(id) ON DELETE CASCADE,
  role_number INTEGER NOT NULL CHECK (role_number BETWEEN 1 AND 7),
  role_name TEXT NOT NULL,
  role_description TEXT, -- Responsibility description
  percentage_allocation INTEGER DEFAULT 0 CHECK (percentage_allocation >= 0 AND percentage_allocation <= 100),
  is_wellbeing BOOLEAN DEFAULT FALSE, -- True for role #1 (Wellbeing)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Unique role number per session
  UNIQUE (session_id, role_number),
  -- Only one wellbeing role per session
  UNIQUE (session_id) WHERE is_wellbeing = TRUE
);

-- Objectives for each role (OKR Objective)
CREATE TABLE goal_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES goal_roles(id) ON DELETE CASCADE,
  objective_text TEXT NOT NULL, -- Inspiring goal statement
  related_swot_strategies TEXT[], -- Which SWOT strategies this addresses
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Key Results for each objective (OKR Key Results)
CREATE TABLE goal_key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID NOT NULL REFERENCES goal_objectives(id) ON DELETE CASCADE,
  key_result_number INTEGER NOT NULL CHECK (key_result_number BETWEEN 1 AND 3),
  key_result_text TEXT NOT NULL, -- Measurable outcome
  success_criteria TEXT, -- How to measure success
  deadline DATE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'blocked')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Unique key result number per objective
  UNIQUE (objective_id, key_result_number)
);

-- Action plans (Initiatives) for each key result
CREATE TABLE goal_action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_result_id UUID NOT NULL REFERENCES goal_key_results(id) ON DELETE CASCADE,
  action_number INTEGER NOT NULL,
  action_text TEXT NOT NULL,
  due_date DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Unique action number per key result
  UNIQUE (key_result_id, action_number)
);

-- Goal setting reflections (7 principles)
CREATE TABLE goal_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES goal_setting_sessions(id) ON DELETE CASCADE,
  reflection_type TEXT NOT NULL CHECK (reflection_type IN (
    'identity_alignment',    -- 1. 정체성 반영
    'deliberation',          -- 2. 충분한 숙고
    'incompleteness',        -- 3. 미완성 (ongoing review)
    'diversity',             -- 4. 다양성 (multiple roles)
    'connectivity',          -- 5. 연계성 (bigger picture)
    'feasibility',           -- 6. 실현 가능성
    'execution_ease'         -- 7. 실행 용이성
  )),
  reflection_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- One reflection per type per session
  UNIQUE (session_id, reflection_type)
);

-- Indexes for performance
CREATE INDEX idx_goal_sessions_user ON goal_setting_sessions(user_id);
CREATE INDEX idx_goal_roles_session ON goal_roles(session_id);
CREATE INDEX idx_goal_objectives_role ON goal_objectives(role_id);
CREATE INDEX idx_goal_key_results_objective ON goal_key_results(objective_id);
CREATE INDEX idx_goal_action_plans_kr ON goal_action_plans(key_result_id);

-- RLS Policies
ALTER TABLE goal_setting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goal sessions" ON goal_setting_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage roles via session" ON goal_roles
  FOR ALL USING (
    session_id IN (SELECT id FROM goal_setting_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage objectives via role" ON goal_objectives
  FOR ALL USING (
    role_id IN (
      SELECT r.id FROM goal_roles r
      JOIN goal_setting_sessions s ON r.session_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage key results via objective" ON goal_key_results
  FOR ALL USING (
    objective_id IN (
      SELECT o.id FROM goal_objectives o
      JOIN goal_roles r ON o.role_id = r.id
      JOIN goal_setting_sessions s ON r.session_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage action plans via key result" ON goal_action_plans
  FOR ALL USING (
    key_result_id IN (
      SELECT kr.id FROM goal_key_results kr
      JOIN goal_objectives o ON kr.objective_id = o.id
      JOIN goal_roles r ON o.role_id = r.id
      JOIN goal_setting_sessions s ON r.session_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage reflections via session" ON goal_reflections
  FOR ALL USING (
    session_id IN (SELECT id FROM goal_setting_sessions WHERE user_id = auth.uid())
  );
```

### TypeScript Interfaces

```typescript
// src/lib/types/goalSetting.ts

export interface GoalRole {
  id: string;
  sessionId: string;
  roleNumber: number;
  roleName: string;
  roleDescription: string;
  percentageAllocation: number;
  isWellbeing: boolean;
  objectives: GoalObjective[];
}

export interface GoalObjective {
  id: string;
  roleId: string;
  objectiveText: string;
  relatedSwotStrategies: string[];
  keyResults: GoalKeyResult[];
}

export interface GoalKeyResult {
  id: string;
  objectiveId: string;
  keyResultNumber: number;
  keyResultText: string;
  successCriteria: string;
  deadline: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  progressPercentage: number;
  actionPlans: GoalActionPlan[];
}

export interface GoalActionPlan {
  id: string;
  keyResultId: string;
  actionNumber: number;
  actionText: string;
  dueDate: string;
  isCompleted: boolean;
}

export type ReflectionType =
  | 'identity_alignment'
  | 'deliberation'
  | 'incompleteness'
  | 'diversity'
  | 'connectivity'
  | 'feasibility'
  | 'execution_ease';

export interface GoalReflection {
  id: string;
  sessionId: string;
  reflectionType: ReflectionType;
  reflectionText: string;
}

export interface GoalSettingData {
  roles: GoalRole[];
  totalPercentage: number;
  reflections: GoalReflection[];
  swotStrategiesUsed: string[];
}
```

### API Routes

```
GET  /api/goals/session - Get goal setting session
POST /api/goals/session - Create/update session
GET  /api/goals/roles - Get all roles
POST /api/goals/roles - Save/update roles
GET  /api/goals/objectives - Get objectives for a role
POST /api/goals/objectives - Save/update objectives
GET  /api/goals/key-results - Get key results for an objective
POST /api/goals/key-results - Save/update key results
POST /api/goals/action-plans - Save action plans
POST /api/goals/reflections - Save reflection
POST /api/goals/finalize - Complete goal setting
GET  /api/goals/swot-integration - Get SWOT strategies for integration
```

### UI Components

1. **Role Setup Page** (`/discover/goals`)
   - 5-7 role cards with Wellbeing as #1
   - Percentage allocation slider (total = 100%)
   - Role description input

2. **OKR Builder Page** (`/discover/goals/okr`)
   - Role-based tabs
   - Objective input with SWOT strategy suggestions
   - Key Results with deadline picker
   - Action plan builder

3. **7 Principles Reflection** (`/discover/goals/reflection`)
   - Guided reflection for each principle
   - AI assistance for self-assessment

4. **Goal Dashboard** (`/discover/goals/dashboard`)
   - Progress visualization
   - Upcoming deadlines
   - Export functionality

---

## 3. ERRC Action Plan Module (ERRC 실행 계획)

### Purpose
Apply Blue Ocean Strategy's ERRC framework to personal life optimization, helping users identify what to Eliminate, Reduce, Raise, and Create.

### Database Schema

```sql
-- Wellbeing area enum type
CREATE TYPE wellbeing_area_type AS ENUM (
  'physical', 'emotional', 'intellectual', 'social', 'spiritual', 'career', 'financial'
);

-- ERRC action plan session (required link to Goal Setting)
CREATE TABLE errc_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_setting_session_id UUID NOT NULL REFERENCES goal_setting_sessions(id) ON DELETE RESTRICT,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  -- Only one in-progress session per user
  UNIQUE (user_id) WHERE status = 'in_progress'
);

-- ERRC items (Eliminate, Reduce, Raise, Create categories)
CREATE TABLE errc_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES errc_sessions(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('eliminate', 'reduce', 'raise', 'create')),
  item_text TEXT NOT NULL,
  item_description TEXT, -- Why this item
  related_wellbeing_area wellbeing_area_type, -- Using enum type
  related_role_id UUID REFERENCES goal_roles(id) ON DELETE SET NULL, -- FK to actual role
  priority INTEGER DEFAULT 0, -- Higher = more important
  implementation_status TEXT DEFAULT 'planned' CHECK (implementation_status IN (
    'planned', 'in_progress', 'completed', 'paused'
  )),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ERRC action steps for each item
CREATE TABLE errc_action_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  errc_item_id UUID NOT NULL REFERENCES errc_items(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_text TEXT NOT NULL,
  target_date DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Unique step number per item
  UNIQUE (errc_item_id, step_number)
);

-- Wellbeing check-in (before/after ERRC implementation)
CREATE TABLE errc_wellbeing_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES errc_sessions(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('before', 'after')),
  physical_score INTEGER CHECK (physical_score BETWEEN 0 AND 10),
  emotional_score INTEGER CHECK (emotional_score BETWEEN 0 AND 10),
  intellectual_score INTEGER CHECK (intellectual_score BETWEEN 0 AND 10),
  social_score INTEGER CHECK (social_score BETWEEN 0 AND 10),
  spiritual_score INTEGER CHECK (spiritual_score BETWEEN 0 AND 10),
  career_score INTEGER CHECK (career_score BETWEEN 0 AND 10),
  financial_score INTEGER CHECK (financial_score BETWEEN 0 AND 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- One before and one after per session
  UNIQUE (session_id, assessment_type)
);

-- ERRC reflection journal
CREATE TABLE errc_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES errc_sessions(id) ON DELETE CASCADE,
  reflection_date DATE DEFAULT CURRENT_DATE,
  energy_level TEXT CHECK (energy_level IN ('low', 'medium', 'high')),
  key_insights TEXT,
  challenges TEXT,
  wins TEXT,
  next_focus TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- One reflection per date per session
  UNIQUE (session_id, reflection_date)
);

-- Indexes for performance
CREATE INDEX idx_errc_sessions_user ON errc_sessions(user_id);
CREATE INDEX idx_errc_items_session ON errc_items(session_id);
CREATE INDEX idx_errc_items_category ON errc_items(category);
CREATE INDEX idx_errc_action_steps_item ON errc_action_steps(errc_item_id);

-- RLS Policies
ALTER TABLE errc_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE errc_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE errc_action_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE errc_wellbeing_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE errc_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own ERRC sessions" ON errc_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage items via session" ON errc_items
  FOR ALL USING (
    session_id IN (SELECT id FROM errc_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage action steps via item" ON errc_action_steps
  FOR ALL USING (
    errc_item_id IN (
      SELECT i.id FROM errc_items i
      JOIN errc_sessions s ON i.session_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage wellbeing assessments via session" ON errc_wellbeing_assessments
  FOR ALL USING (
    session_id IN (SELECT id FROM errc_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage reflections via session" ON errc_reflections
  FOR ALL USING (
    session_id IN (SELECT id FROM errc_sessions WHERE user_id = auth.uid())
  );
```

### TypeScript Interfaces

```typescript
// src/lib/types/errc.ts

export type ERRCCategory = 'eliminate' | 'reduce' | 'raise' | 'create';
export type ImplementationStatus = 'planned' | 'in_progress' | 'completed' | 'paused';
export type WellbeingArea =
  | 'physical'
  | 'emotional'
  | 'intellectual'
  | 'social'
  | 'spiritual'
  | 'career'
  | 'financial';

export interface ERRCItem {
  id: string;
  sessionId: string;
  category: ERRCCategory;
  itemText: string;
  itemDescription: string;
  relatedWellbeingArea: WellbeingArea;
  relatedRole: string;
  priority: number;
  implementationStatus: ImplementationStatus;
  actionSteps: ERRCActionStep[];
}

export interface ERRCActionStep {
  id: string;
  errcItemId: string;
  stepNumber: number;
  stepText: string;
  targetDate: string;
  isCompleted: boolean;
  notes: string;
}

export interface WellbeingAssessment {
  id: string;
  sessionId: string;
  assessmentType: 'before' | 'after';
  physicalScore: number;
  emotionalScore: number;
  intellectualScore: number;
  socialScore: number;
  spiritualScore: number;
  careerScore: number;
  financialScore: number;
  notes: string;
}

export interface ERRCReflection {
  id: string;
  sessionId: string;
  reflectionDate: string;
  energyLevel: 'low' | 'medium' | 'high';
  keyInsights: string;
  challenges: string;
  wins: string;
  nextFocus: string;
}

export interface ERRCData {
  items: {
    eliminate: ERRCItem[];
    reduce: ERRCItem[];
    raise: ERRCItem[];
    create: ERRCItem[];
  };
  wellbeingAssessment: {
    before: WellbeingAssessment;
    after: WellbeingAssessment;
  };
  reflections: ERRCReflection[];
}
```

### API Routes

```
GET  /api/errc/session - Get ERRC session
POST /api/errc/session - Create/update session
GET  /api/errc/items - Get all ERRC items
POST /api/errc/items - Save/update items
POST /api/errc/items/[id]/steps - Save action steps for an item
PUT  /api/errc/items/[id]/status - Update item status
GET  /api/errc/wellbeing - Get wellbeing assessments
POST /api/errc/wellbeing - Save wellbeing assessment
POST /api/errc/reflections - Save reflection
POST /api/errc/finalize - Complete ERRC session
GET  /api/errc/suggestions - AI-generated ERRC suggestions based on goals
```

### UI Components

1. **ERRC Canvas Page** (`/discover/errc`)
   - 4-quadrant layout (Eliminate, Reduce, Raise, Create)
   - Drag-drop item cards
   - Priority ranking

2. **Wellbeing Wheel Assessment** (`/discover/errc/wellbeing`)
   - 7-area radar chart
   - Before/After comparison
   - Score input sliders

3. **Action Planning Page** (`/discover/errc/actions`)
   - Item-by-item action steps
   - Timeline view
   - Progress tracking

4. **Reflection Journal** (`/discover/errc/journal`)
   - Daily/weekly reflection entries
   - Energy tracking
   - Wins and challenges log

5. **Progress Dashboard** (`/discover/errc/dashboard`)
   - Implementation status overview
   - Wellbeing improvement chart
   - Export functionality

---

## Module Integration Map

```
                    ┌─────────────┐
                    │   Values    │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │ Enneagram   │ │  Strengths  │ │   Dreams    │
    └──────┬──────┘ └──────┬──────┘ └─────────────┘
           │               │
           ▼               │
    ┌─────────────┐        │
    │ Life Themes │◄───────┘
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │   Vision    │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │    SWOT     │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │Goal Setting │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │    ERRC     │
    └─────────────┘
```

### Data Flow

1. **Life Themes** receives:
   - Enneagram type (required)
   - Values data (optional, for integration insights)

2. **Goal Setting** receives:
   - Vision statement (required)
   - SWOT strategies (required)
   - Values top 3 (optional)
   - Strengths (optional)
   - Life Themes (optional)

3. **ERRC** receives:
   - Goals from Goal Setting (required)
   - SWOT strategies (optional)
   - Wellbeing areas from Dreams module (optional)

---

## Implementation Priority

### Phase 1: Goal Setting Module
- Most directly builds on existing SWOT module
- SWOT already has goals table structure
- Can reuse existing patterns

### Phase 2: ERRC Action Plan Module
- Extends existing swot_errc table
- Adds action planning layer
- Wellbeing assessment integration

### Phase 3: Life Themes Module
- New concept, requires fresh implementation
- Complex interview flow
- AI pattern recognition

---

## UI/UX Guidelines

### Design Consistency
- Follow existing purple/pink gradient theme
- Use Lucide icons consistently
- Card-based layout with rounded corners
- Drag-drop interactions where applicable

### Mobile Responsiveness
- Collapsible sidebars on mobile
- Touch-friendly inputs
- Swipe gestures for navigation

### Accessibility
- ARIA labels for all interactive elements
- Keyboard navigation support
- Color contrast compliance

---

## Technical Notes

### State Management
- Use existing `useModuleProgress` hook
- Session-based data persistence
- Optimistic UI updates

### AI Integration
- Claude API for pattern recognition
- Streaming responses for long operations
- Fallback to manual entry if AI fails

### Testing Strategy
- Unit tests for data transformations
- Integration tests for API routes
- E2E tests for critical user flows
