/**
 * Module Types and Interfaces for WFED119 LifeCraft
 *
 * Module Dependency Chain:
 * Values → Strengths → Vision → SWOT → Dreams
 *
 * Each module can inject data from prerequisite modules.
 */

export type ModuleId =
  | 'values'
  | 'strengths'
  | 'vision'
  | 'swot'
  | 'goals'
  | 'dreams'
  | 'enneagram'
  | 'errc'
  | 'life-themes';

export type ModuleStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed';

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
  description: string;
  route: string;
  dependencies: ModuleDependency[];
  stages?: string[];
  requiredForCompletion?: string[];
}

// Module dependency configuration
export const MODULE_CONFIGS: Record<ModuleId, ModuleConfig> = {
  values: {
    id: 'values',
    name: 'Values Discovery',
    description: 'Identify your terminal, instrumental, and work values',
    route: '/discover/values',
    dependencies: [],
    stages: ['terminal', 'instrumental', 'work'],
    requiredForCompletion: ['terminal', 'instrumental', 'work'],
  },
  strengths: {
    id: 'strengths',
    name: 'Strengths Assessment',
    description: 'Discover your unique strengths through AI conversation',
    route: '/discover/strengths',
    dependencies: [
      { moduleId: 'values', required: false, dataFields: ['top3Values', 'valueThemes'] }
    ],
    stages: ['conversation', 'analysis', 'summary'],
  },
  vision: {
    id: 'vision',
    name: 'Vision Statement',
    description: 'Craft your personal vision statement',
    route: '/discover/vision',
    dependencies: [
      { moduleId: 'values', required: true, dataFields: ['top3Values', 'valueThemes'] },
      { moduleId: 'strengths', required: false, dataFields: ['topStrengths', 'strengthsSummary'] }
    ],
    stages: ['time-horizon', 'step1', 'step2', 'step3'],
  },
  swot: {
    id: 'swot',
    name: 'SWOT Analysis',
    description: 'Strategic self-analysis with goal setting',
    route: '/discover/swot',
    dependencies: [
      { moduleId: 'vision', required: true, dataFields: ['visionStatement'] },
      { moduleId: 'values', required: false, dataFields: ['top3Values'] },
      { moduleId: 'strengths', required: false, dataFields: ['topStrengths'] }
    ],
    stages: ['analysis', 'strategy', 'prioritization', 'goals', 'action', 'reflection'],
  },
  goals: {
    id: 'goals',
    name: 'Goal Setting (OKR)',
    description: 'OKR-based role-focused goal setting with core principles',
    route: '/discover/goals',
    dependencies: [
      { moduleId: 'swot', required: true, dataFields: ['strategies', 'goals'] },
      { moduleId: 'vision', required: true, dataFields: ['visionStatement'] },
      { moduleId: 'values', required: false, dataFields: ['top3Values'] },
      { moduleId: 'strengths', required: false, dataFields: ['topStrengths'] }
    ],
    stages: ['roles', 'objectives', 'key-results', 'actions', 'reflection'],
    requiredForCompletion: ['roles', 'objectives', 'key-results'],
  },
  dreams: {
    id: 'dreams',
    name: 'Life Dreams Matrix',
    description: 'Map your dreams across life stages and wellbeing areas',
    route: '/discover/dreams',
    dependencies: [
      { moduleId: 'values', required: false, dataFields: ['top3Values'] },
      { moduleId: 'vision', required: false, dataFields: ['visionStatement'] },
      { moduleId: 'swot', required: false, dataFields: ['goals', 'strategies'] }
    ],
    stages: ['dreams', 'categories', 'timeline', 'integration'],
  },
  enneagram: {
    id: 'enneagram',
    name: 'Enneagram Assessment',
    description: 'Discover your Enneagram personality type',
    route: '/discover/enneagram',
    dependencies: [],
    stages: ['assessment', 'results'],
  },
  errc: {
    id: 'errc',
    name: 'ERRC Action Plan',
    description: 'Strategic life optimization using Eliminate-Reduce-Raise-Create framework',
    route: '/discover/errc',
    dependencies: [
      { moduleId: 'swot', required: false, dataFields: ['strategies', 'goals', 'errc'] },
      { moduleId: 'values', required: false, dataFields: ['top3Values'] },
    ],
    stages: ['wellbeing_before', 'canvas', 'actions', 'progress', 'journal', 'wellbeing_after', 'results'],
    requiredForCompletion: ['wellbeing_before', 'canvas', 'wellbeing_after'],
  },
  'life-themes': {
    id: 'life-themes',
    name: 'Life Themes Discovery',
    description: 'Discover recurring themes in your life through 6 reflective questions',
    route: '/discover/life-themes',
    dependencies: [
      { moduleId: 'enneagram', required: false, dataFields: ['type', 'wing'] },
      { moduleId: 'values', required: false, dataFields: ['top3Values'] },
    ],
    stages: ['role-models', 'media', 'hobbies', 'mottos', 'subjects', 'memories', 'patterns', 'themes', 'results'],
    requiredForCompletion: ['role-models', 'media', 'hobbies', 'mottos', 'subjects', 'memories', 'themes'],
  },
};

// Module dependency order for sequential completion
export const MODULE_ORDER: ModuleId[] = [
  'values',
  'strengths',
  'enneagram',
  'life-themes',
  'vision',
  'swot',
  'goals',
  'dreams',
  'errc',
];

// Get prerequisites for a module
export function getModulePrerequisites(moduleId: ModuleId): ModuleId[] {
  const config = MODULE_CONFIGS[moduleId];
  return config.dependencies
    .filter(dep => dep.required)
    .map(dep => dep.moduleId);
}

// Get optional data sources for a module
export function getOptionalDataSources(moduleId: ModuleId): ModuleId[] {
  const config = MODULE_CONFIGS[moduleId];
  return config.dependencies
    .filter(dep => !dep.required)
    .map(dep => dep.moduleId);
}

// Check if module can be started based on prerequisites
export function canStartModule(
  moduleId: ModuleId,
  completedModules: Set<ModuleId>
): { canStart: boolean; missingPrerequisites: ModuleId[] } {
  const prerequisites = getModulePrerequisites(moduleId);
  const missing = prerequisites.filter(prereq => !completedModules.has(prereq));

  return {
    canStart: missing.length === 0,
    missingPrerequisites: missing,
  };
}

// Data injection types for cross-module data flow
export interface ValuesData {
  terminalTop3: string[];
  instrumentalTop3: string[];
  workTop3: string[];
  valueThemes: string[];
  completedSets: ('terminal' | 'instrumental' | 'work')[];
}

export interface StrengthsData {
  topStrengths: Array<{ name: string; description: string; score?: number }>;
  strengthsSummary: string;
  conversationInsights?: string[];
}

export interface VisionData {
  timeHorizon: '3-year' | '5-year' | '10-year';
  coreAspiration: string;
  visionStatement: string;
  roleVisions?: Record<string, string>;
}

export interface SwotData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  strategies: {
    so: string[];
    wo: string[];
    st: string[];
    wt: string[];
  };
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
    reinforce: string[];
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

export interface DreamsData {
  dreams: Array<{
    id: string;
    title: string;
    lifeStage: string;
    wellbeingArea: string;
  }>;
  categorizedDreams: Record<string, string[]>;
}

export interface ModuleDataMap {
  values: ValuesData;
  strengths: StrengthsData;
  vision: VisionData;
  swot: SwotData;
  goals: GoalSettingData;
  dreams: DreamsData;
  enneagram: Record<string, unknown>;
}

// Cross-module context for data injection
export interface CrossModuleContext {
  userId: string;
  availableData: Partial<ModuleDataMap>;
  completedModules: ModuleId[];
  currentModule: ModuleId;
}
