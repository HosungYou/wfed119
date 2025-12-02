/**
 * ERRC Action Plan Module Types
 *
 * Based on LifeCraft Chapter 11: ERRC Framework (Eliminate-Reduce-Raise-Create)
 * - Eliminate: Activities, relationships, habits to completely remove
 * - Reduce: Things to decrease but not eliminate
 * - Raise: Things already doing but need to increase
 * - Create: New activities, relationships, habits to introduce
 */

// ============================================================================
// Enum Types (matching PostgreSQL enums)
// ============================================================================

export type ErrcCategory = 'eliminate' | 'reduce' | 'raise' | 'create';

export type ErrcStepStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

export type WellbeingDimension =
  | 'physical'
  | 'emotional'
  | 'intellectual'
  | 'social'
  | 'spiritual'
  | 'occupational';

export type ErrcReflectionType =
  | 'weekly_check_in'
  | 'milestone'
  | 'challenge'
  | 'insight'
  | 'final_reflection';

export type ErrcSessionStep =
  | 'wellbeing_before'
  | 'canvas'
  | 'actions'
  | 'progress'
  | 'journal'
  | 'wellbeing_after'
  | 'results';

// ============================================================================
// Database Entity Types (matching Supabase schema - snake_case)
// ============================================================================

export interface ErrcSession {
  id: string;
  user_id: string;
  swot_analysis_id: string | null;
  status: 'in_progress' | 'completed';
  current_step: ErrcSessionStep;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface ErrcWellbeingAssessment {
  id: string;
  session_id: string;
  assessment_type: 'before' | 'after';
  physical_wellbeing: number;
  emotional_wellbeing: number;
  intellectual_wellbeing: number;
  social_wellbeing: number;
  spiritual_wellbeing: number;
  occupational_wellbeing: number;
  notes: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

export interface ErrcItem {
  id: string;
  session_id: string;
  category: ErrcCategory;
  item_text: string;
  description: string | null;
  priority: number;
  related_wellbeing: WellbeingDimension[];
  is_active: boolean;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface ErrcActionStep {
  id: string;
  errc_item_id: string;
  step_number: number;
  step_text: string;
  due_date: string | null;
  status: ErrcStepStatus;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ErrcReflection {
  id: string;
  session_id: string;
  reflection_type: ErrcReflectionType;
  title: string | null;
  content: string;
  related_item_id: string | null;
  mood_level: number | null;
  energy_level: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Frontend Types (camelCase for React components)
// ============================================================================

export interface ErrcItemWithSteps extends ErrcItem {
  actionSteps: ErrcActionStep[];
}

export interface ErrcSessionFull extends ErrcSession {
  wellbeingBefore: ErrcWellbeingAssessment | null;
  wellbeingAfter: ErrcWellbeingAssessment | null;
  items: ErrcItemWithSteps[];
  reflections: ErrcReflection[];
}

export interface WellbeingScores {
  physical: number;
  emotional: number;
  intellectual: number;
  social: number;
  spiritual: number;
  occupational: number;
}

export interface WellbeingComparison {
  before: WellbeingScores;
  after: WellbeingScores;
  changes: Record<WellbeingDimension, number>;
  averageBefore: number;
  averageAfter: number;
  overallChange: number;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

// Session
export interface CreateErrcSessionRequest {
  swot_analysis_id?: string;
}

export interface UpdateErrcSessionRequest {
  status?: 'in_progress' | 'completed';
  current_step?: ErrcSessionStep;
}

// Wellbeing Assessment
export interface CreateWellbeingAssessmentRequest {
  session_id: string;
  assessment_type: 'before' | 'after';
  physical_wellbeing: number;
  emotional_wellbeing: number;
  intellectual_wellbeing: number;
  social_wellbeing: number;
  spiritual_wellbeing: number;
  occupational_wellbeing: number;
  notes?: Record<string, string>;
}

export interface UpdateWellbeingAssessmentRequest {
  physical_wellbeing?: number;
  emotional_wellbeing?: number;
  intellectual_wellbeing?: number;
  social_wellbeing?: number;
  spiritual_wellbeing?: number;
  occupational_wellbeing?: number;
  notes?: Record<string, string>;
}

// Items
export interface CreateErrcItemRequest {
  session_id: string;
  category: ErrcCategory;
  item_text: string;
  description?: string;
  priority?: number;
  related_wellbeing?: WellbeingDimension[];
}

export interface UpdateErrcItemRequest {
  item_text?: string;
  description?: string;
  priority?: number;
  related_wellbeing?: WellbeingDimension[];
  is_active?: boolean;
  progress_percentage?: number;
}

export interface ReorderErrcItemsRequest {
  session_id: string;
  category: ErrcCategory;
  item_ids: string[]; // ordered list of item IDs
}

// Action Steps
export interface CreateErrcActionStepRequest {
  errc_item_id: string;
  step_number: number;
  step_text: string;
  due_date?: string;
}

export interface UpdateErrcActionStepRequest {
  step_text?: string;
  due_date?: string;
  status?: ErrcStepStatus;
  notes?: string;
}

// Reflections
export interface CreateErrcReflectionRequest {
  session_id: string;
  reflection_type: ErrcReflectionType;
  title?: string;
  content: string;
  related_item_id?: string;
  mood_level?: number;
  energy_level?: number;
}

export interface UpdateErrcReflectionRequest {
  title?: string;
  content?: string;
  mood_level?: number;
  energy_level?: number;
}

// AI Suggestions
export interface ErrcSuggestionsRequest {
  category: ErrcCategory;
  wellbeing_scores: WellbeingScores;
  existing_items?: string[];
  swot_context?: {
    strengths: string[];
    weaknesses: string[];
    goals: string[];
  };
}

export interface ErrcSuggestion {
  item_text: string;
  description: string;
  related_wellbeing: WellbeingDimension[];
  rationale: string;
}

export interface ErrcSuggestionsResponse {
  suggestions: ErrcSuggestion[];
}

// ============================================================================
// UI State Types
// ============================================================================

export interface ErrcState {
  session: ErrcSession | null;
  wellbeingBefore: ErrcWellbeingAssessment | null;
  wellbeingAfter: ErrcWellbeingAssessment | null;
  items: Record<ErrcCategory, ErrcItem[]>;
  actionSteps: Record<string, ErrcActionStep[]>; // keyed by item_id
  reflections: ErrcReflection[];
  isLoading: boolean;
  error: string | null;
}

export interface ErrcCanvasData {
  eliminate: ErrcItem[];
  reduce: ErrcItem[];
  raise: ErrcItem[];
  create: ErrcItem[];
}

// ============================================================================
// Default Values and Constants
// ============================================================================

export const ERRC_CATEGORY_LABELS: Record<ErrcCategory, {
  title: string;
  titleKo: string;
  description: string;
  descriptionKo: string;
  color: string;
  bgColor: string;
}> = {
  eliminate: {
    title: 'Eliminate',
    titleKo: '제거',
    description: 'Activities, relationships, or habits to completely remove from your life',
    descriptionKo: '삶에서 완전히 제거해야 할 활동, 관계, 습관',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  reduce: {
    title: 'Reduce',
    titleKo: '감소',
    description: 'Things to decrease but not completely eliminate',
    descriptionKo: '줄여야 하지만 완전히 제거할 필요는 없는 요소',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  raise: {
    title: 'Raise',
    titleKo: '증가',
    description: 'Activities or habits you already do but need to increase',
    descriptionKo: '이미 하고 있지만 더 늘려야 할 활동, 태도, 습관',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  create: {
    title: 'Create',
    titleKo: '창조',
    description: 'New activities, relationships, or habits to introduce',
    descriptionKo: '삶에 새롭게 도입해야 할 활동, 관계, 습관',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
};

export const WELLBEING_DIMENSION_LABELS: Record<WellbeingDimension, {
  title: string;
  titleKo: string;
  description: string;
  descriptionKo: string;
  icon: string;
}> = {
  physical: {
    title: 'Physical',
    titleKo: '신체적',
    description: 'Physical health, energy, exercise, nutrition, sleep',
    descriptionKo: '신체 건강, 에너지, 운동, 영양, 수면',
    icon: '💪',
  },
  emotional: {
    title: 'Emotional',
    titleKo: '정서적',
    description: 'Emotional balance, stress management, resilience',
    descriptionKo: '감정 균형, 스트레스 관리, 회복력',
    icon: '❤️',
  },
  intellectual: {
    title: 'Intellectual',
    titleKo: '지적',
    description: 'Mental stimulation, learning, creativity, growth',
    descriptionKo: '정신적 자극, 학습, 창의성, 성장',
    icon: '🧠',
  },
  social: {
    title: 'Social',
    titleKo: '사회적',
    description: 'Relationships, community, connection, belonging',
    descriptionKo: '관계, 공동체, 연결, 소속감',
    icon: '👥',
  },
  spiritual: {
    title: 'Spiritual',
    titleKo: '영적',
    description: 'Purpose, meaning, values, inner peace',
    descriptionKo: '목적, 의미, 가치, 내적 평화',
    icon: '✨',
  },
  occupational: {
    title: 'Occupational',
    titleKo: '직업적',
    description: 'Work satisfaction, career development, contribution',
    descriptionKo: '업무 만족, 커리어 개발, 기여',
    icon: '💼',
  },
};

export const ERRC_REFLECTION_TYPE_LABELS: Record<ErrcReflectionType, {
  title: string;
  titleKo: string;
  description: string;
}> = {
  weekly_check_in: {
    title: 'Weekly Check-in',
    titleKo: '주간 점검',
    description: 'Regular weekly progress review',
  },
  milestone: {
    title: 'Milestone Achievement',
    titleKo: '마일스톤 달성',
    description: 'Reflection on completing a major item or goal',
  },
  challenge: {
    title: 'Challenge Faced',
    titleKo: '직면한 도전',
    description: 'Documenting obstacles and how you addressed them',
  },
  insight: {
    title: 'New Insight',
    titleKo: '새로운 통찰',
    description: 'Recording discoveries and learnings',
  },
  final_reflection: {
    title: 'Final Reflection',
    titleKo: '최종 성찰',
    description: 'End of ERRC journey comprehensive reflection',
  },
};

export const ERRC_STEP_STATUS_LABELS: Record<ErrcStepStatus, {
  label: string;
  labelKo: string;
  color: string;
}> = {
  not_started: { label: 'Not Started', labelKo: '미시작', color: 'gray' },
  in_progress: { label: 'In Progress', labelKo: '진행 중', color: 'blue' },
  completed: { label: 'Completed', labelKo: '완료', color: 'green' },
  skipped: { label: 'Skipped', labelKo: '건너뜀', color: 'yellow' },
};

export const ERRC_SESSION_STEPS: {
  step: ErrcSessionStep;
  title: string;
  titleKo: string;
  description: string;
}[] = [
  {
    step: 'wellbeing_before',
    title: 'Initial Wellbeing Assessment',
    titleKo: '초기 웰빙 평가',
    description: 'Assess your current wellbeing across 6 dimensions',
  },
  {
    step: 'canvas',
    title: 'ERRC Canvas',
    titleKo: 'ERRC 캔버스',
    description: 'Define what to Eliminate, Reduce, Raise, and Create',
  },
  {
    step: 'actions',
    title: 'Action Planning',
    titleKo: '액션 계획',
    description: 'Create specific action steps for each ERRC item',
  },
  {
    step: 'progress',
    title: 'Track Progress',
    titleKo: '진행 추적',
    description: 'Monitor and update your progress on action steps',
  },
  {
    step: 'journal',
    title: 'Reflection Journal',
    titleKo: '성찰 저널',
    description: 'Document your journey, insights, and challenges',
  },
  {
    step: 'wellbeing_after',
    title: 'Final Wellbeing Assessment',
    titleKo: '최종 웰빙 평가',
    description: 'Reassess your wellbeing to see the impact',
  },
  {
    step: 'results',
    title: 'Results & Summary',
    titleKo: '결과 및 요약',
    description: 'Review your ERRC journey and wellbeing changes',
  },
];

// ============================================================================
// Validation and Helper Functions
// ============================================================================

export function validateWellbeingScore(score: number): boolean {
  return Number.isInteger(score) && score >= 1 && score <= 10;
}

export function validateWellbeingAssessment(
  assessment: Partial<CreateWellbeingAssessmentRequest>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const dimensions: WellbeingDimension[] = [
    'physical', 'emotional', 'intellectual', 'social', 'spiritual', 'occupational'
  ];

  dimensions.forEach(dim => {
    const key = `${dim}_wellbeing` as keyof CreateWellbeingAssessmentRequest;
    const value = assessment[key];
    if (value === undefined) {
      errors.push(`${dim} wellbeing is required`);
    } else if (!validateWellbeingScore(value as number)) {
      errors.push(`${dim} wellbeing must be between 1 and 10`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function calculateWellbeingAverage(scores: WellbeingScores): number {
  const values = Object.values(scores);
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) / 10;
}

export function compareWellbeing(
  before: ErrcWellbeingAssessment,
  after: ErrcWellbeingAssessment
): WellbeingComparison {
  const dimensions: WellbeingDimension[] = [
    'physical', 'emotional', 'intellectual', 'social', 'spiritual', 'occupational'
  ];

  const beforeScores: WellbeingScores = {
    physical: before.physical_wellbeing,
    emotional: before.emotional_wellbeing,
    intellectual: before.intellectual_wellbeing,
    social: before.social_wellbeing,
    spiritual: before.spiritual_wellbeing,
    occupational: before.occupational_wellbeing,
  };

  const afterScores: WellbeingScores = {
    physical: after.physical_wellbeing,
    emotional: after.emotional_wellbeing,
    intellectual: after.intellectual_wellbeing,
    social: after.social_wellbeing,
    spiritual: after.spiritual_wellbeing,
    occupational: after.occupational_wellbeing,
  };

  const changes: Record<WellbeingDimension, number> = {} as Record<WellbeingDimension, number>;
  dimensions.forEach(dim => {
    changes[dim] = afterScores[dim] - beforeScores[dim];
  });

  const averageBefore = calculateWellbeingAverage(beforeScores);
  const averageAfter = calculateWellbeingAverage(afterScores);

  return {
    before: beforeScores,
    after: afterScores,
    changes,
    averageBefore,
    averageAfter,
    overallChange: Math.round((averageAfter - averageBefore) * 10) / 10,
  };
}

export function calculateItemProgress(steps: ErrcActionStep[]): number {
  if (steps.length === 0) return 0;
  const completedSteps = steps.filter(s => s.status === 'completed').length;
  return Math.round((completedSteps / steps.length) * 100);
}

export function getNextErrcStep(currentStep: ErrcSessionStep): ErrcSessionStep | null {
  const stepOrder: ErrcSessionStep[] = [
    'wellbeing_before', 'canvas', 'actions', 'progress', 'journal', 'wellbeing_after', 'results'
  ];
  const currentIndex = stepOrder.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex === stepOrder.length - 1) {
    return null;
  }
  return stepOrder[currentIndex + 1];
}

export function canProceedToNextStep(
  currentStep: ErrcSessionStep,
  session: ErrcSessionFull
): { canProceed: boolean; reason?: string } {
  switch (currentStep) {
    case 'wellbeing_before':
      if (!session.wellbeingBefore) {
        return { canProceed: false, reason: 'Please complete the initial wellbeing assessment' };
      }
      return { canProceed: true };

    case 'canvas':
      const totalItems = session.items.length;
      if (totalItems < 4) {
        return { canProceed: false, reason: 'Please add at least one item to each ERRC category' };
      }
      return { canProceed: true };

    case 'actions':
      const itemsWithSteps = session.items.filter(i => i.actionSteps.length > 0);
      if (itemsWithSteps.length === 0) {
        return { canProceed: false, reason: 'Please add action steps to at least one item' };
      }
      return { canProceed: true };

    case 'progress':
      return { canProceed: true }; // Always can proceed from progress

    case 'journal':
      return { canProceed: true }; // Always can proceed from journal

    case 'wellbeing_after':
      if (!session.wellbeingAfter) {
        return { canProceed: false, reason: 'Please complete the final wellbeing assessment' };
      }
      return { canProceed: true };

    case 'results':
      return { canProceed: false, reason: 'This is the final step' };

    default:
      return { canProceed: false, reason: 'Unknown step' };
  }
}
