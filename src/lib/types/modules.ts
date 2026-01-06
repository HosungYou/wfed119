/**
 * Module Types and Interfaces for WFED119 LifeCraft
 *
 * PHASE 2 UPDATE (2026-01-06):
 * - Linear (순차적 강제) progression: 10 modules must be completed in sequence
 * - Dreams integrated into Vision module as Step 4
 * - NEW: Mission Statement module (Part 2)
 * - NEW: Career Options module (Part 2)
 * - Full cross-module data integration with AI insights
 *
 * Module Order (Linear Progression):
 * Part 1 - Self-Discovery:
 *   1. Values → 2. Strengths → 3. Enneagram → 4. Life Themes
 * Part 2 - Vision & Mission:
 *   5. Vision (includes Dreams Matrix) → 6. Mission Statement → 7. Career Options
 * Part 3 - Strategic Analysis:
 *   8. SWOT
 * Part 4 - Goal Setting:
 *   9. Goals → 10. ERRC
 */

// ============================================================================
// Module ID Types (10 modules, linear order)
// ============================================================================

export type ModuleId =
  | 'values'
  | 'strengths'
  | 'enneagram'
  | 'life-themes'
  | 'vision'
  | 'mission'         // NEW: Mission Statement
  | 'career-options'  // NEW: Career Options
  | 'swot'
  | 'goals'
  | 'errc';

export type ModuleStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed';

// Part grouping for UI display
export type ModulePart =
  | 'self-discovery'    // Part 1: Modules 1-4
  | 'vision-mission'    // Part 2: Module 5
  | 'strategic-analysis' // Part 3: Module 6
  | 'goal-setting';     // Part 4: Modules 7-8

// ============================================================================
// Module Order (Linear Progression - STRICT)
// ============================================================================

export const MODULE_ORDER: ModuleId[] = [
  'values',         // 1: Part 1 - Self-Discovery
  'strengths',      // 2: Part 1 - Self-Discovery
  'enneagram',      // 3: Part 1 - Self-Discovery
  'life-themes',    // 4: Part 1 - Self-Discovery
  'vision',         // 5: Part 2 - Vision & Mission (includes Dreams as Step 4)
  'mission',        // 6: Part 2 - Mission Statement (NEW)
  'career-options', // 7: Part 2 - Career Options (NEW)
  'swot',           // 8: Part 3 - Strategic Analysis
  'goals',          // 9: Part 4 - Goal Setting
  'errc',           // 10: Part 4 - Action Optimization
];

// Module to Part mapping
export const MODULE_PARTS: Record<ModuleId, ModulePart> = {
  'values': 'self-discovery',
  'strengths': 'self-discovery',
  'enneagram': 'self-discovery',
  'life-themes': 'self-discovery',
  'vision': 'vision-mission',
  'mission': 'vision-mission',
  'career-options': 'vision-mission',
  'swot': 'strategic-analysis',
  'goals': 'goal-setting',
  'errc': 'goal-setting',
};

// Part display names (Korean)
export const PART_NAMES: Record<ModulePart, { en: string; ko: string }> = {
  'self-discovery': { en: 'Self-Discovery', ko: '자기 발견' },
  'vision-mission': { en: 'Vision & Mission', ko: '비전 & 미션' },
  'strategic-analysis': { en: 'Strategic Analysis', ko: '전략 분석' },
  'goal-setting': { en: 'Goal Setting', ko: '목표 설정' },
};

// ============================================================================
// Module Progress Types
// ============================================================================

export interface ModuleProgress {
  moduleId: ModuleId;
  status: ModuleStatus;
  completedAt?: string;
  lastUpdatedAt: string;
  currentStage?: string;
  completionPercentage: number;
}

export interface ModuleDependency {
  moduleId: ModuleId;
  required: boolean;
  dataFields: string[];
}

export interface ModuleConfig {
  id: ModuleId;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  route: string;
  part: ModulePart;
  order: number;
  dependencies: ModuleDependency[];
  stages?: string[];
  requiredForCompletion?: string[];
  estimatedMinutes?: number;
}

// ============================================================================
// Module Configuration (10 Modules)
// ============================================================================

export const MODULE_CONFIGS: Record<ModuleId, ModuleConfig> = {
  values: {
    id: 'values',
    name: 'Values Discovery',
    nameKo: '가치관 발견',
    description: 'Identify your terminal, instrumental, and work values',
    descriptionKo: '당신의 궁극적 가치, 도구적 가치, 직업 가치를 발견합니다',
    route: '/discover/values',
    part: 'self-discovery',
    order: 1,
    dependencies: [], // First module - no prerequisites
    stages: ['terminal', 'instrumental', 'work'],
    requiredForCompletion: ['terminal', 'instrumental', 'work'],
    estimatedMinutes: 30,
  },
  strengths: {
    id: 'strengths',
    name: 'Strengths Assessment',
    nameKo: '강점 발견',
    description: 'Discover your unique strengths through AI conversation',
    descriptionKo: 'AI 대화를 통해 당신만의 고유한 강점을 발견합니다',
    route: '/discover/strengths',
    part: 'self-discovery',
    order: 2,
    dependencies: [
      { moduleId: 'values', required: true, dataFields: ['top3Values', 'valueThemes'] }
    ],
    stages: ['conversation', 'analysis', 'summary'],
    estimatedMinutes: 45,
  },
  enneagram: {
    id: 'enneagram',
    name: 'Enneagram Assessment',
    nameKo: '에니어그램 진단',
    description: 'Discover your Enneagram personality type',
    descriptionKo: '에니어그램 성격 유형을 진단합니다',
    route: '/discover/enneagram',
    part: 'self-discovery',
    order: 3,
    dependencies: [
      { moduleId: 'strengths', required: true, dataFields: ['topStrengths'] }
    ],
    stages: ['assessment', 'results'],
    estimatedMinutes: 20,
  },
  'life-themes': {
    id: 'life-themes',
    name: 'Life Themes Discovery',
    nameKo: '생애 주제 발견',
    description: 'Discover recurring themes in your life through Career Construction Interview',
    descriptionKo: '커리어 구성 인터뷰를 통해 삶의 반복되는 주제를 발견합니다',
    route: '/discover/life-themes',
    part: 'self-discovery',
    order: 4,
    dependencies: [
      { moduleId: 'enneagram', required: true, dataFields: ['type', 'wing', 'instinct'] },
      { moduleId: 'values', required: false, dataFields: ['top3Values'] },
      { moduleId: 'strengths', required: false, dataFields: ['topStrengths'] },
    ],
    stages: ['role-models', 'media', 'hobbies', 'mottos', 'subjects', 'memories', 'patterns', 'themes', 'results'],
    requiredForCompletion: ['role-models', 'media', 'hobbies', 'mottos', 'subjects', 'memories', 'themes'],
    estimatedMinutes: 60,
  },
  vision: {
    id: 'vision',
    name: 'Vision & Dreams',
    nameKo: '비전 & 꿈',
    description: 'Craft your vision statement with integrated dreams matrix',
    descriptionKo: '꿈 매트릭스와 함께 비전 선언문을 작성합니다',
    route: '/discover/vision',
    part: 'vision-mission',
    order: 5,
    dependencies: [
      { moduleId: 'life-themes', required: true, dataFields: ['themes', 'patterns'] },
      { moduleId: 'values', required: true, dataFields: ['top3Values', 'valueThemes'] },
      { moduleId: 'strengths', required: true, dataFields: ['topStrengths', 'strengthsSummary'] },
      { moduleId: 'enneagram', required: false, dataFields: ['type', 'wing'] }
    ],
    // Dreams is now Step 4 within Vision
    stages: ['time-horizon', 'future-imagery', 'core-aspirations', 'dreams-matrix', 'vision-statement'],
    requiredForCompletion: ['time-horizon', 'core-aspirations', 'dreams-matrix', 'vision-statement'],
    estimatedMinutes: 45,
  },
  mission: {
    id: 'mission',
    name: 'Mission Statement',
    nameKo: '사명 선언문',
    description: 'Craft your personal mission statement based on your values and vision',
    descriptionKo: '가치관과 비전을 바탕으로 개인 사명 선언문을 작성합니다',
    route: '/discover/mission',
    part: 'vision-mission',
    order: 6,
    dependencies: [
      { moduleId: 'vision', required: true, dataFields: ['visionStatement', 'coreAspirations'] },
      { moduleId: 'values', required: true, dataFields: ['top3Values', 'valueThemes'] },
      { moduleId: 'strengths', required: false, dataFields: ['topStrengths'] },
      { moduleId: 'life-themes', required: false, dataFields: ['themes'] }
    ],
    stages: ['values-review', 'purpose-questions', 'mission-draft', 'mission-refinement'],
    requiredForCompletion: ['values-review', 'purpose-questions', 'mission-draft'],
    estimatedMinutes: 30,
  },
  'career-options': {
    id: 'career-options',
    name: 'Career Options',
    nameKo: '커리어 옵션',
    description: 'Explore career options aligned with your strengths, values, and vision',
    descriptionKo: '강점, 가치관, 비전에 맞는 커리어 옵션을 탐색합니다',
    route: '/discover/career-options',
    part: 'vision-mission',
    order: 7,
    dependencies: [
      { moduleId: 'mission', required: true, dataFields: ['missionStatement'] },
      { moduleId: 'vision', required: true, dataFields: ['visionStatement'] },
      { moduleId: 'values', required: true, dataFields: ['workTop3'] },
      { moduleId: 'strengths', required: true, dataFields: ['topStrengths'] },
      { moduleId: 'enneagram', required: false, dataFields: ['type', 'wing'] }
    ],
    stages: ['holland-code', 'career-exploration', 'career-research', 'career-comparison'],
    requiredForCompletion: ['holland-code', 'career-exploration', 'career-comparison'],
    estimatedMinutes: 45,
  },
  swot: {
    id: 'swot',
    name: 'SWOT Analysis',
    nameKo: 'SWOT 분석',
    description: 'Strategic self-analysis with AI-powered auto-fill and priority strategies',
    descriptionKo: 'AI 자동 입력과 우선순위 전략을 포함한 전략적 자기분석',
    route: '/discover/swot',
    part: 'strategic-analysis',
    order: 8,
    dependencies: [
      { moduleId: 'vision', required: true, dataFields: ['visionStatement', 'dreams'] },
      { moduleId: 'values', required: true, dataFields: ['top3Values'] },
      { moduleId: 'strengths', required: true, dataFields: ['topStrengths'] },
      { moduleId: 'enneagram', required: false, dataFields: ['type', 'wing'] },
      { moduleId: 'life-themes', required: false, dataFields: ['themes'] }
    ],
    stages: ['analysis', 'strategy', 'prioritization', 'goals', 'action', 'reflection'],
    requiredForCompletion: ['analysis', 'strategy', 'prioritization'],
    estimatedMinutes: 60,
  },
  goals: {
    id: 'goals',
    name: 'Goal Setting (OKR)',
    nameKo: '목표 설정 (OKR)',
    description: 'OKR-based role-focused goal setting with life roles',
    descriptionKo: 'OKR 기반 역할 중심 목표 설정을 진행합니다',
    route: '/discover/goals',
    part: 'goal-setting',
    order: 9,
    dependencies: [
      { moduleId: 'swot', required: true, dataFields: ['strategies', 'priorityStrategies'] },
      { moduleId: 'vision', required: true, dataFields: ['visionStatement', 'timeHorizon'] },
      { moduleId: 'values', required: true, dataFields: ['top3Values'] },
      { moduleId: 'strengths', required: false, dataFields: ['topStrengths'] }
    ],
    stages: ['roles', 'objectives', 'key-results', 'actions', 'reflection'],
    requiredForCompletion: ['roles', 'objectives', 'key-results'],
    estimatedMinutes: 45,
  },
  errc: {
    id: 'errc',
    name: 'ERRC Action Plan',
    nameKo: 'ERRC 실행 계획',
    description: 'Strategic life optimization with Wellbeing Wheel assessment',
    descriptionKo: '웰빙 휠 진단과 함께 전략적 인생 최적화를 실행합니다',
    route: '/discover/errc',
    part: 'goal-setting',
    order: 10,
    dependencies: [
      { moduleId: 'goals', required: true, dataFields: ['roles', 'objectives', 'keyResults'] },
      { moduleId: 'swot', required: true, dataFields: ['strategies', 'errc'] },
      { moduleId: 'values', required: false, dataFields: ['top3Values'] },
      { moduleId: 'strengths', required: false, dataFields: ['topStrengths'] },
    ],
    stages: ['wellbeing_before', 'canvas', 'actions', 'progress', 'journal', 'wellbeing_after', 'results'],
    requiredForCompletion: ['wellbeing_before', 'canvas', 'wellbeing_after'],
    estimatedMinutes: 60,
  },
};

// ============================================================================
// Linear Progression Functions (Strict Enforcement)
// ============================================================================

/**
 * Get the index of a module in the linear progression
 */
export function getModuleIndex(moduleId: ModuleId): number {
  return MODULE_ORDER.indexOf(moduleId);
}

/**
 * Get all modules that must be completed before starting this module
 * (Linear progression: ALL previous modules required)
 */
export function getLinearPrerequisites(moduleId: ModuleId): ModuleId[] {
  const moduleIndex = getModuleIndex(moduleId);
  if (moduleIndex <= 0) return [];
  return MODULE_ORDER.slice(0, moduleIndex);
}

/**
 * Check if a module can be started based on LINEAR progression
 * (All previous modules must be completed)
 */
export function canStartModuleLinear(
  moduleId: ModuleId,
  completedModules: Set<ModuleId>
): { canStart: boolean; missingPrerequisites: ModuleId[] } {
  const moduleIndex = getModuleIndex(moduleId);

  // First module can always start
  if (moduleIndex === 0) {
    return { canStart: true, missingPrerequisites: [] };
  }

  // Check all previous modules are completed
  const requiredModules = MODULE_ORDER.slice(0, moduleIndex);
  const missing = requiredModules.filter(m => !completedModules.has(m));

  return {
    canStart: missing.length === 0,
    missingPrerequisites: missing,
  };
}

/**
 * Get the next module to complete in the linear progression
 */
export function getNextModule(completedModules: Set<ModuleId>): ModuleId | null {
  for (const moduleId of MODULE_ORDER) {
    if (!completedModules.has(moduleId)) {
      return moduleId;
    }
  }
  return null; // All completed
}

/**
 * Get progress percentage based on completed modules
 */
export function getOverallProgress(completedModules: Set<ModuleId>): number {
  return Math.round((completedModules.size / MODULE_ORDER.length) * 100);
}

/**
 * Get current part based on next module to complete
 */
export function getCurrentPart(completedModules: Set<ModuleId>): ModulePart | null {
  const nextModule = getNextModule(completedModules);
  if (!nextModule) return null;
  return MODULE_PARTS[nextModule];
}

// ============================================================================
// Legacy Compatibility Functions (Deprecated)
// ============================================================================

/**
 * @deprecated Use getLinearPrerequisites for linear progression
 * Get prerequisites for a module based on config (not linear)
 */
export function getModulePrerequisites(moduleId: ModuleId): ModuleId[] {
  const config = MODULE_CONFIGS[moduleId];
  return config.dependencies
    .filter(dep => dep.required)
    .map(dep => dep.moduleId);
}

/**
 * @deprecated Use canStartModuleLinear for linear progression
 * Get optional data sources for a module
 */
export function getOptionalDataSources(moduleId: ModuleId): ModuleId[] {
  const config = MODULE_CONFIGS[moduleId];
  return config.dependencies
    .filter(dep => !dep.required)
    .map(dep => dep.moduleId);
}

/**
 * @deprecated Use canStartModuleLinear for linear progression
 * Check if module can be started based on prerequisites (not linear)
 */
export function canStartModule(
  moduleId: ModuleId,
  completedModules: Set<ModuleId>
): { canStart: boolean; missingPrerequisites: ModuleId[] } {
  // Redirect to linear enforcement
  return canStartModuleLinear(moduleId, completedModules);
}

// ============================================================================
// Data Types for Cross-Module Integration
// ============================================================================

export interface ValuesData {
  terminalTop3: string[];
  instrumentalTop3: string[];
  workTop3: string[];
  valueThemes: string[];
  completedSets: ('terminal' | 'instrumental' | 'work')[];
}

export interface StrengthsData {
  topStrengths: Array<{ name: string; description: string; category?: string; evidence?: string }>;
  strengthsSummary: string;
  conversationInsights?: string[];
}

export interface EnneagramData {
  type: number; // 1-9
  wing: number; // 1-9
  instinct: 'sp' | 'so' | 'sx';
  confidence: 'high' | 'medium' | 'low';
  description?: string;
}

export interface LifeThemesData {
  themes: Array<{
    theme: string;
    description: string;
    rank: number;
    patterns: string[];
    evidenceFromQuestions: string[];
  }>;
  roleModels: string[];
  favoriteMedia: string[];
  hobbies: string[];
  mottos: string[];
  favoriteSubjects: string[];
  earlyMemories: string[];
}

export interface VisionData {
  timeHorizon: '3-year' | '5-year' | '10-year';
  futureImagery: string;
  coreAspirations: string[];
  visionStatement: string;
  roleVisions?: Record<string, string>;
  // Dreams integrated as Step 4
  dreams: Array<{
    id: string;
    dream: string;
    category: string;
    lifeStage: 'immediate' | '1-3years' | '5years' | '10years+';
    wellbeingDimension?: string;
    createdAt: string;
  }>;
  dreamsByLifeStage: {
    immediate: string[];
    '1-3years': string[];
    '5years': string[];
    '10years+': string[];
  };
  dreamsByWellbeing: {
    physical: string[];
    emotional: string[];
    intellectual: string[];
    social: string[];
    spiritual: string[];
    occupational: string[];
    economic: string[];
  };
  dreamsAnalysis?: string;
  dreamsCompleted: boolean;
}

export interface SwotData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  strategies: {
    so: string[]; // Strengths x Opportunities
    wo: string[]; // Weaknesses x Opportunities
    st: string[]; // Strengths x Threats
    wt: string[]; // Weaknesses x Threats
  };
  priorityStrategies: Array<{
    strategy: string;
    type: 'SO' | 'WO' | 'ST' | 'WT';
    impact: number;
    feasibility: number;
    priorityScore: number;
  }>;
  goals: Array<{
    number: number;
    roleResponsibility: string;
    actionPlan: string;
    criteria: string;
    deadline?: string;
  }>;
  errc?: {
    eliminate: string[];
    reduce: string[];
    raise: string[];
    create: string[];
  };
}

export interface GoalSettingData {
  roles: Array<{
    id: string;
    roleNumber: number;
    roleName: string;
    roleDescription: string;
    percentageAllocation: number;
    isWellbeing: boolean;
  }>;
  objectives: Array<{
    id: string;
    roleId: string;
    objectiveText: string;
    relatedSwotStrategies: string[];
  }>;
  keyResults: Array<{
    id: string;
    objectiveId: string;
    keyResultNumber: number;
    keyResultText: string;
    successCriteria: string;
    deadline?: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
    progressPercentage: number;
  }>;
  actionPlans: Array<{
    id: string;
    keyResultId: string;
    actionNumber: number;
    actionText: string;
    dueDate?: string;
    isCompleted: boolean;
  }>;
  reflections: Array<{
    reflectionType: 'identity_alignment' | 'deliberation' | 'incompleteness' | 'diversity' | 'connectivity' | 'feasibility' | 'execution_ease';
    reflectionText: string;
  }>;
  totalPercentage: number;
}

export interface ErrcData {
  wellbeingBefore: {
    physical: number;
    emotional: number;
    intellectual: number;
    social: number;
    spiritual: number;
    occupational: number;
    economic: number;
  };
  wellbeingAfter?: {
    physical: number;
    emotional: number;
    intellectual: number;
    social: number;
    spiritual: number;
    occupational: number;
    economic: number;
  };
  canvas: {
    eliminate: string[];
    reduce: string[];
    raise: string[];
    create: string[];
  };
  actions: Array<{
    id: string;
    category: 'eliminate' | 'reduce' | 'raise' | 'create';
    action: string;
    dueDate?: string;
    isCompleted: boolean;
  }>;
  journal: Array<{
    date: string;
    entry: string;
    category?: string;
  }>;
}

// ============================================================================
// Mission Statement Data (NEW)
// ============================================================================

export interface MissionData {
  // Step 1: Values Review
  valuesUsed: Array<{
    type: 'terminal' | 'instrumental' | 'work';
    name: string;
    relevance: string;
  }>;

  // Step 2: Purpose Questions
  purposeAnswers: {
    whatDoYouDo: string;       // What do you do?
    forWhom: string;           // For whom?
    howDoYouDoIt: string;      // How do you do it?
    whatImpact: string;        // What impact do you want to make?
    whyDoesItMatter: string;   // Why does it matter to you?
  };

  // Step 3: Mission Draft
  draftVersions: Array<{
    version: number;
    text: string;
    createdAt: string;
    aiGenerated: boolean;
  }>;

  // Step 4: Final Mission
  finalStatement: string;
  completedAt?: string;
}

// ============================================================================
// Career Options Data (NEW)
// ============================================================================

export interface CareerOptionsData {
  // Step 1: Holland Code Assessment
  hollandCode: {
    primary: 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
    secondary?: 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
    tertiary?: 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
    scores: {
      realistic: number;    // R
      investigative: number; // I
      artistic: number;     // A
      social: number;       // S
      enterprising: number; // E
      conventional: number; // C
    };
  };

  // Step 2: Career Exploration
  suggestedCareers: Array<{
    title: string;
    description: string;
    matchScore: number;
    relatedValues: string[];
    relatedStrengths: string[];
    hollandMatch: string[];
    aiSuggested: boolean;
  }>;

  // Step 3: Career Research
  exploredCareers: Array<{
    id: string;
    title: string;
    industry: string;
    description: string;
    responsibilities: string[];
    requiredSkills: string[];
    salaryRange?: string;
    growthOutlook?: string;
    educationRequired?: string;
    personalNotes: string;
    pros: string[];
    cons: string[];
    interestLevel: 1 | 2 | 3 | 4 | 5;
  }>;

  // Step 4: Career Comparison
  comparisonMatrix: {
    careers: string[];
    criteria: Array<{
      criterion: string;
      weight: number;
      scores: Record<string, number>;
    }>;
    rankings: Array<{
      career: string;
      totalScore: number;
      rank: number;
    }>;
  };

  // Final Selection
  topCareerChoices: Array<{
    career: string;
    reason: string;
    nextSteps: string[];
  }>;
  notes?: string;
  completedAt?: string;
}

// ============================================================================
// Module Data Map (All 10 Modules)
// ============================================================================

export interface ModuleDataMap {
  values: ValuesData;
  strengths: StrengthsData;
  enneagram: EnneagramData;
  'life-themes': LifeThemesData;
  vision: VisionData;
  mission: MissionData;
  'career-options': CareerOptionsData;
  swot: SwotData;
  goals: GoalSettingData;
  errc: ErrcData;
}

// ============================================================================
// Cross-Module Context
// ============================================================================

export interface CrossModuleContext {
  userId: string;
  availableData: Partial<ModuleDataMap>;
  completedModules: ModuleId[];
  currentModule: ModuleId;
  nextModule: ModuleId | null;
  overallProgress: number;
  currentPart: ModulePart | null;
}

// ============================================================================
// Integrated Profile Types (for user_integrated_profiles table)
// ============================================================================

export interface IntegratedProfile {
  userId: string;

  // Part 1 Summary
  topValues: Array<{ type: 'terminal' | 'instrumental' | 'work'; name: string; description?: string }>;
  topStrengths: Array<{ category?: string; name: string; evidence?: string }>;
  enneagramType?: number;
  enneagramWing?: number;
  enneagramInstinct?: string;
  lifeThemes: Array<{ theme: string; description?: string; rank: number; patterns?: string[] }>;

  // Part 2 Summary
  missionStatement?: string;
  visionStatement?: string;
  timeHorizon?: string;
  dreams: Array<{ dream: string; category?: string; lifeStage?: string; wellbeingDimension?: string }>;
  coreAspirations: string[];

  // Part 3-4 Summary
  swotSummary: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  priorityStrategies: Array<{ strategy: string; type: string; impact: number; feasibility: number }>;
  lifeRoles: Array<{ role: string; allocation: number; objectives?: string[] }>;
  keyObjectives: Array<{ objective: string; role?: string; keyResults?: string[] }>;
  errcActions: {
    eliminate: string[];
    reduce: string[];
    raise: string[];
    create: string[];
  };
  wellbeingScores?: {
    physical: number;
    emotional: number;
    intellectual: number;
    social: number;
    spiritual: number;
    occupational: number;
    economic: number;
  };

  // AI Insights
  aiCareerInsights?: string;
  aiStrengthPatterns?: string;
  aiValueAlignment?: string;
  aiRecommendedActions: Array<{ action: string; priority: 'high' | 'medium' | 'low'; relatedModules: ModuleId[] }>;
  aiPersonalitySummary?: string;
  aiGrowthAreas: Array<{ area: string; suggestion: string }>;

  // Metadata
  modulesCompleted: ModuleId[];
  profileCompleteness: number;
  lastAiAnalysisAt?: string;
  createdAt: string;
  updatedAt: string;
}
