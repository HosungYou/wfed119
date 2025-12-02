/**
 * Goal Setting Module Types (OKR-based)
 *
 * Based on LifeCraft Chapter 10: 7 Principles of Goal Setting
 * - 정체성 반영 (Identity Alignment)
 * - 충분한 숙고 (Deliberation)
 * - 미완성 (Embrace Incompleteness)
 * - 다양성 (Multiple Roles)
 * - 연계성 (Bigger Picture)
 * - 실현 가능성 (Feasibility)
 * - 실행 용이성 (Ease of Execution)
 */

// ============================================================================
// Database Entity Types (matching Supabase schema)
// ============================================================================

export interface GoalSettingSession {
  id: string;
  user_id: string;
  swot_analysis_id: string;
  status: GoalSessionStatus;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export type GoalSessionStatus = 'in_progress' | 'completed';

export interface GoalRole {
  id: string;
  session_id: string;
  role_number: number;
  role_name: string;
  role_description: string | null;
  percentage_allocation: number;
  is_wellbeing: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoalObjective {
  id: string;
  role_id: string;
  objective_text: string;
  objective_number: number;
  related_swot_strategies: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface GoalKeyResult {
  id: string;
  objective_id: string;
  key_result_number: number;
  key_result_text: string;
  success_criteria: string | null;
  deadline: string | null;
  status: KeyResultStatus;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export type KeyResultStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';

export interface GoalActionPlan {
  id: string;
  key_result_id: string;
  action_number: number;
  action_text: string;
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalReflection {
  id: string;
  session_id: string;
  reflection_type: ReflectionType;
  reflection_text: string;
  created_at: string;
}

export type ReflectionType =
  | 'identity_alignment'    // 1. 정체성 반영
  | 'deliberation'          // 2. 충분한 숙고
  | 'incompleteness'        // 3. 미완성
  | 'diversity'             // 4. 다양성
  | 'connectivity'          // 5. 연계성
  | 'feasibility'           // 6. 실현 가능성
  | 'execution_ease';       // 7. 실행 용이성

// ============================================================================
// Frontend Types (camelCase for React components)
// ============================================================================

export interface GoalRoleWithObjectives extends GoalRole {
  objectives: GoalObjectiveWithKeyResults[];
}

export interface GoalObjectiveWithKeyResults extends GoalObjective {
  keyResults: GoalKeyResultWithActions[];
}

export interface GoalKeyResultWithActions extends GoalKeyResult {
  actionPlans: GoalActionPlan[];
}

export interface GoalSettingSessionFull extends GoalSettingSession {
  roles: GoalRoleWithObjectives[];
  reflections: GoalReflection[];
}

// ============================================================================
// API Request/Response Types
// ============================================================================

// Session
export interface CreateGoalSessionRequest {
  swot_analysis_id: string;
}

export interface UpdateGoalSessionRequest {
  status?: GoalSessionStatus;
}

// Roles
export interface CreateGoalRoleRequest {
  session_id: string;
  role_number: number;
  role_name: string;
  role_description?: string;
  percentage_allocation?: number;
  is_wellbeing?: boolean;
}

export interface UpdateGoalRoleRequest {
  role_name?: string;
  role_description?: string;
  percentage_allocation?: number;
}

export interface BulkUpsertRolesRequest {
  session_id: string;
  roles: Array<{
    id?: string;
    role_number: number;
    role_name: string;
    role_description?: string;
    percentage_allocation: number;
    is_wellbeing: boolean;
  }>;
}

// Objectives
export interface CreateGoalObjectiveRequest {
  role_id: string;
  objective_text: string;
  objective_number?: number;
  related_swot_strategies?: string[];
}

export interface UpdateGoalObjectiveRequest {
  objective_text?: string;
  related_swot_strategies?: string[];
}

// Key Results
export interface CreateGoalKeyResultRequest {
  objective_id: string;
  key_result_number: number;
  key_result_text: string;
  success_criteria?: string;
  deadline?: string;
}

export interface UpdateGoalKeyResultRequest {
  key_result_text?: string;
  success_criteria?: string;
  deadline?: string;
  status?: KeyResultStatus;
  progress_percentage?: number;
}

// Action Plans
export interface CreateGoalActionPlanRequest {
  key_result_id: string;
  action_number: number;
  action_text: string;
  due_date?: string;
}

export interface UpdateGoalActionPlanRequest {
  action_text?: string;
  due_date?: string;
  is_completed?: boolean;
}

// Reflections
export interface CreateGoalReflectionRequest {
  session_id: string;
  reflection_type: ReflectionType;
  reflection_text: string;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface GoalSettingState {
  session: GoalSettingSession | null;
  roles: GoalRole[];
  objectives: Record<string, GoalObjective[]>; // keyed by role_id
  keyResults: Record<string, GoalKeyResult[]>; // keyed by objective_id
  actionPlans: Record<string, GoalActionPlan[]>; // keyed by key_result_id
  reflections: GoalReflection[];
  isLoading: boolean;
  error: string | null;
  currentStage: GoalSettingStage;
}

export type GoalSettingStage =
  | 'roles'
  | 'objectives'
  | 'key-results'
  | 'actions'
  | 'reflection'
  | 'completed';

// ============================================================================
// Default Values and Constants
// ============================================================================

export const DEFAULT_ROLES = [
  { role_number: 1, role_name: '웰빙/자기관리', is_wellbeing: true },
  { role_number: 2, role_name: '가족', is_wellbeing: false },
  { role_number: 3, role_name: '직업/경력', is_wellbeing: false },
  { role_number: 4, role_name: '사회적 관계', is_wellbeing: false },
  { role_number: 5, role_name: '자기계발', is_wellbeing: false },
];

export const REFLECTION_LABELS: Record<ReflectionType, { korean: string; english: string; description: string }> = {
  identity_alignment: {
    korean: '정체성 반영',
    english: 'Identity Alignment',
    description: '목표가 나의 핵심 가치관과 정체성을 반영하고 있는가?',
  },
  deliberation: {
    korean: '충분한 숙고',
    english: 'Sufficient Deliberation',
    description: '목표를 충분히 숙고하고 검토했는가?',
  },
  incompleteness: {
    korean: '미완성',
    english: 'Embrace Incompleteness',
    description: '완벽하지 않아도 괜찮다는 것을 받아들이는가?',
  },
  diversity: {
    korean: '다양성',
    english: 'Multiple Roles',
    description: '삶의 다양한 역할들을 균형 있게 고려했는가?',
  },
  connectivity: {
    korean: '연계성',
    english: 'Bigger Picture',
    description: '목표들이 더 큰 비전과 연결되어 있는가?',
  },
  feasibility: {
    korean: '실현 가능성',
    english: 'Feasibility',
    description: '목표가 현실적으로 달성 가능한가?',
  },
  execution_ease: {
    korean: '실행 용이성',
    english: 'Ease of Execution',
    description: '첫 번째 행동을 쉽게 시작할 수 있는가?',
  },
};

export const KEY_RESULT_STATUS_LABELS: Record<KeyResultStatus, { korean: string; color: string }> = {
  not_started: { korean: '시작 전', color: 'gray' },
  in_progress: { korean: '진행 중', color: 'blue' },
  completed: { korean: '완료', color: 'green' },
  blocked: { korean: '보류', color: 'red' },
};

// ============================================================================
// Validation Helpers
// ============================================================================

export function validateRoleAllocation(roles: Array<{ percentage_allocation: number }>): {
  isValid: boolean;
  total: number;
  message: string;
} {
  const total = roles.reduce((sum, role) => sum + role.percentage_allocation, 0);
  return {
    isValid: total === 100,
    total,
    message: total === 100
      ? '할당이 100%입니다.'
      : total < 100
        ? `${100 - total}%가 더 필요합니다.`
        : `${total - 100}%를 줄여야 합니다.`,
  };
}

export function calculateOverallProgress(keyResults: GoalKeyResult[]): number {
  if (keyResults.length === 0) return 0;
  const totalProgress = keyResults.reduce((sum, kr) => sum + kr.progress_percentage, 0);
  return Math.round(totalProgress / keyResults.length);
}
