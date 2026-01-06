/**
 * Goal Setting Module Types (OKR-based)
 *
 * Based on LifeCraft Chapter 10: 7 Principles of Goal Setting
 * - Identity Alignment
 * - Deliberation
 * - Embrace Incompleteness
 * - Multiple Roles
 * - Bigger Picture
 * - Feasibility
 * - Ease of Execution
 */

// ============================================================================
// Database Entity Types (matching Supabase schema)
// ============================================================================

export interface GoalSettingSession {
  id: string;
  user_id: string;
  swot_analysis_id: string;
  status: GoalSessionStatus;
  duration_months: number;
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
  | 'identity_alignment'    // 1. Identity Alignment
  | 'deliberation'          // 2. Deliberation
  | 'incompleteness'        // 3. Embrace Incompleteness
  | 'diversity'             // 4. Multiple Roles
  | 'connectivity'          // 5. Bigger Picture
  | 'feasibility'           // 6. Feasibility
  | 'execution_ease';       // 7. Ease of Execution

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
  duration_months?: number;
}

export interface UpdateGoalSessionRequest {
  status?: GoalSessionStatus;
  duration_months?: number;
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
  { role_number: 1, role_name: 'Wellbeing/Self-Care', is_wellbeing: true },
  { role_number: 2, role_name: 'Career/Work', is_wellbeing: false },
  { role_number: 3, role_name: 'Personal Growth', is_wellbeing: false },
];

export const REFLECTION_LABELS: Record<ReflectionType, { title: string; description: string }> = {
  identity_alignment: {
    title: 'Identity Alignment',
    description: 'Do your goals reflect your core values and identity?',
  },
  deliberation: {
    title: 'Sufficient Deliberation',
    description: 'Have you thought through and reviewed your goals carefully?',
  },
  incompleteness: {
    title: 'Embrace Incompleteness',
    description: 'Can you accept that it\'s okay not to be perfect?',
  },
  diversity: {
    title: 'Multiple Roles',
    description: 'Have you considered various roles in life in a balanced way?',
  },
  connectivity: {
    title: 'Bigger Picture',
    description: 'Are your goals connected to a larger vision?',
  },
  feasibility: {
    title: 'Feasibility',
    description: 'Are your goals realistically achievable?',
  },
  execution_ease: {
    title: 'Ease of Execution',
    description: 'Can you easily start your first action step?',
  },
};

export const KEY_RESULT_STATUS_LABELS: Record<KeyResultStatus, { label: string; color: string }> = {
  not_started: { label: 'Not Started', color: 'gray' },
  in_progress: { label: 'In Progress', color: 'blue' },
  completed: { label: 'Completed', color: 'green' },
  blocked: { label: 'Blocked', color: 'red' },
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
      ? 'Allocation is 100%.'
      : total < 100
        ? `Need ${100 - total}% more.`
        : `Reduce by ${total - 100}%.`,
  };
}

export function calculateOverallProgress(keyResults: GoalKeyResult[]): number {
  if (keyResults.length === 0) return 0;
  const totalProgress = keyResults.reduce((sum, kr) => sum + kr.progress_percentage, 0);
  return Math.round(totalProgress / keyResults.length);
}
