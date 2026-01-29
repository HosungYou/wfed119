/**
 * Life Themes Discovery Module Types
 *
 * Based on LifeCraft Chapter 3: Career Construction Interview (Mark Savickas)
 * 6 Questions to discover recurring life themes:
 * 1. Role Models - Who do you admire?
 * 2. Media - What do you enjoy reading/watching?
 * 3. Hobbies - What do you do for fun?
 * 4. Mottos - What phrases resonate with you?
 * 5. Subjects - What did you like/dislike in school?
 * 6. Memories - What are your earliest memories?
 */

// ============================================================================
// Enum Types
// ============================================================================

export type LifeThemesStep =
  | 'role_models'
  | 'media'
  | 'hobbies'
  | 'mottos'
  | 'subjects'
  | 'memories'
  | 'findings'
  | 'followup'
  | 'results';

export type QuestionNumber = 1 | 2 | 3 | 4 | 5 | 6;

export type PatternSource = 'user' | 'ai' | 'combined';

export type AnalysisType =
  | 'pattern_summary'
  | 'theme_suggestion'
  | 'enneagram_insight'
  | 'career_implication'
  | 'final_synthesis';

// ============================================================================
// Response Data Types (for JSONB fields)
// ============================================================================

// Q1: Role Models
export interface RoleModelEntry {
  name: string;
  similarities: string;
  differences: string;
}

// Q2: Media
export interface MediaEntry {
  name: string;
  why: string;
}

// Q3: Hobbies
export interface HobbyEntry {
  hobby: string;
  why: string;
}

// Q4: Mottos
export interface MottoEntry {
  motto: string;
}

// Q5: Subjects
export interface SubjectEntry {
  subject: string;
  reasons: string;
}

export interface SubjectsResponse {
  liked: SubjectEntry[];
  disliked: SubjectEntry[];
}

// Q6: Memories (3 fixed memories)
export interface MemoriesData {
  memory1: string;
  memory2: string;
  memory3: string;
}

// Findings page (AI generates themes + stories mapping)
export interface FindingEntry {
  theme: string;
  relevantStories: string[];
}

export interface FindingsData {
  findings: FindingEntry[];
  aiGenerated: boolean;
  userEdited: boolean;
}

// Follow-up questions (no AI - user writes answers)
export interface FollowUpData {
  enneagramConnection: string;  // How themes relate to Enneagram
  integrationNotes: string;     // Integration/modifications
  themePriorities: string[];    // Ordered list of theme names
  careerGuidance: string;       // How themes guide career
  selfLearning: string;         // What you learned about yourself
}

// Union type for all response data types
export type ResponseData =
  | RoleModelEntry[]
  | MediaEntry[]
  | HobbyEntry[]
  | MottoEntry[]
  | SubjectsResponse
  | MemoriesData
  | FindingsData
  | FollowUpData;

// ============================================================================
// Database Entity Types (matching Supabase schema - snake_case)
// ============================================================================

export interface LifeThemesSession {
  id: string;
  user_id: string;
  status: 'in_progress' | 'completed';
  current_step: LifeThemesStep;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface LifeThemesResponse {
  id: string;
  session_id: string;
  question_number: QuestionNumber;
  response_data: ResponseData;
  identified_patterns: string[] | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface LifeThemesPattern {
  id: string;
  session_id: string;
  pattern_text: string;
  pattern_description: string | null;
  related_questions: QuestionNumber[];
  evidence: string[] | null;
  source: PatternSource;
  confidence_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface LifeTheme {
  id: string;
  session_id: string;
  theme_name: string;
  theme_description: string | null;
  priority_rank: number;
  related_pattern_ids: string[] | null;
  enneagram_connection: string | null;
  personal_reflection: string | null;
  created_at: string;
  updated_at: string;
}

export interface LifeThemesAnalysis {
  id: string;
  session_id: string;
  analysis_type: AnalysisType;
  content: string;
  structured_data: Record<string, unknown> | null;
  created_at: string;
}

// ============================================================================
// Frontend Types (camelCase for React components)
// ============================================================================

export interface LifeThemesSessionFull extends LifeThemesSession {
  responses: LifeThemesResponse[];
  patterns: LifeThemesPattern[];
  themes: LifeTheme[];
  analysis: LifeThemesAnalysis[];
  findings: FindingsData | null;
  followup: FollowUpData | null;
}

export interface QuestionProgress {
  questionNumber: QuestionNumber;
  isCompleted: boolean;
  entryCount: number;
  patternsIdentified: number;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

// Session
export interface CreateLifeThemesSessionRequest {
  // No required fields - session starts fresh
}

export interface UpdateLifeThemesSessionRequest {
  status?: 'in_progress' | 'completed';
  current_step?: LifeThemesStep;
}

// Responses
export interface SaveResponseRequest {
  session_id: string;
  question_number: QuestionNumber;
  response_data: ResponseData;
  identified_patterns?: string[];
  is_completed?: boolean;
}

export interface UpdateResponseRequest {
  response_data?: ResponseData;
  identified_patterns?: string[];
  is_completed?: boolean;
}

// Patterns
export interface CreatePatternRequest {
  session_id: string;
  pattern_text: string;
  pattern_description?: string;
  related_questions: QuestionNumber[];
  evidence?: string[];
  source?: PatternSource;
  confidence_score?: number;
}

export interface UpdatePatternRequest {
  pattern_text?: string;
  pattern_description?: string;
  related_questions?: QuestionNumber[];
  evidence?: string[];
}

// Themes
export interface CreateThemeRequest {
  session_id: string;
  theme_name: string;
  theme_description?: string;
  priority_rank: number;
  related_pattern_ids?: string[];
  enneagram_connection?: string;
  personal_reflection?: string;
}

export interface UpdateThemeRequest {
  theme_name?: string;
  theme_description?: string;
  priority_rank?: number;
  related_pattern_ids?: string[];
  enneagram_connection?: string;
  personal_reflection?: string;
}

export interface ReorderThemesRequest {
  session_id: string;
  theme_ids: string[]; // ordered list of theme IDs
}

// Analysis
export interface GenerateAnalysisRequest {
  session_id: string;
  analysis_type: AnalysisType;
  enneagram_type?: number;
  enneagram_wing?: number;
}

export interface AnalyzePatternRequest {
  session_id: string;
  responses: LifeThemesResponse[];
}

export interface PatternSuggestion {
  pattern_text: string;
  pattern_description: string;
  related_questions: QuestionNumber[];
  evidence: string[];
  confidence_score: number;
}

export interface ThemeSuggestion {
  theme_name: string;
  theme_description: string;
  related_patterns: string[];
  rationale: string;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface LifeThemesState {
  session: LifeThemesSession | null;
  responses: Record<QuestionNumber, LifeThemesResponse | null>;
  patterns: LifeThemesPattern[];
  themes: LifeTheme[];
  analysis: Record<AnalysisType, LifeThemesAnalysis | null>;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Default Values and Constants
// ============================================================================

export const QUESTION_CONFIG: Record<QuestionNumber, {
  step: LifeThemesStep;
  title: string;
  titleKo: string;
  prompt: string;
  promptKo: string;
  subPrompt: string;
  subPromptKo: string;
  minEntries: number;
  maxEntries: number;
}> = {
  1: {
    step: 'role_models',
    title: 'Role Models',
    titleKo: '롤모델',
    prompt: 'Who do you admire? Who would you like to be like?',
    promptKo: '존경하는 사람이 누구입니까? 어떤 사람의 삶을 닮고 싶습니까?',
    subPrompt: 'What makes them admirable? How are you similar or different?',
    subPromptKo: '그 사람의 어떤 점에서 비슷하고 어떻게 다릅니까?',
    minEntries: 1,
    maxEntries: 5,
  },
  2: {
    step: 'media',
    title: 'Media & Content',
    titleKo: '미디어 & 콘텐츠',
    prompt: 'What magazines, books, TV shows, YouTube channels do you enjoy?',
    promptKo: '어떤 잡지, 책, TV 쇼, 유튜브 채널을 즐겨 봅니까?',
    subPrompt: 'Why do you enjoy them? What draws you to this content?',
    subPromptKo: '그 이유는 무엇인가요?',
    minEntries: 1,
    maxEntries: 10,
  },
  3: {
    step: 'hobbies',
    title: 'Hobbies & Free Time',
    titleKo: '취미 & 여가시간',
    prompt: 'What do you do in your free time? What hobbies do you have?',
    promptKo: '자유시간에 어떤 것을 즐겨 합니까? 취미는 무엇인지요?',
    subPrompt: 'What aspects of these activities bring you joy?',
    subPromptKo: '그러한 취미들의 어떤 점이 즐거움을 가져다주는지요?',
    minEntries: 1,
    maxEntries: 10,
  },
  4: {
    step: 'mottos',
    title: 'Mottos & Quotes',
    titleKo: '좌우명 & 명언',
    prompt: 'What phrases, quotes, song lyrics, or mottos resonate with you?',
    promptKo: '좋아하는 문구나 모토, 노래 가사, 혹은 좌우명이 있다면요?',
    subPrompt: 'Why do these words speak to you?',
    subPromptKo: '왜 이 말이 와닿나요?',
    minEntries: 1,
    maxEntries: 5,
  },
  5: {
    step: 'subjects',
    title: 'School Subjects',
    titleKo: '학교 과목',
    prompt: 'What subjects did you like and dislike in school?',
    promptKo: '중고등학생 때 좋아하던 과목 3가지와 싫어했던 과목을 알려주세요.',
    subPrompt: 'Why did you like or dislike them?',
    subPromptKo: '왜 그 과목을 좋아했나요? 싫어한 이유는 무엇 때문인가요?',
    minEntries: 3,
    maxEntries: 6,
  },
  6: {
    step: 'memories',
    title: 'Early Memories',
    titleKo: '어린 시절 기억',
    prompt: 'What are your earliest childhood memories (ages 3-6)?',
    promptKo: '가장 어렸을 적 기억이 무엇입니까? 3살에서 6살 사이에 일어났던 일 중 떠오르는 3가지가 어떤 것인지요?',
    subPrompt: 'Share both positive and negative memories. What feelings do you remember?',
    subPromptKo: '그때의 상황을 기억할 수 있는 한 자세히 공유해주세요 (부정적인 기억이든 긍정적인 기억이든 관계없습니다).',
    minEntries: 1,
    maxEntries: 5,
  },
};

export const LIFE_THEMES_STEPS: {
  step: LifeThemesStep;
  title: string;
  titleKo: string;
  description: string;
  questionNumber?: QuestionNumber;
}[] = [
  { step: 'role_models', title: 'Role Models', titleKo: '롤모델', description: 'Share who you admire', questionNumber: 1 },
  { step: 'media', title: 'Media', titleKo: '미디어', description: 'What you enjoy reading/watching', questionNumber: 2 },
  { step: 'hobbies', title: 'Hobbies', titleKo: '취미', description: 'Your free time activities', questionNumber: 3 },
  { step: 'mottos', title: 'Mottos', titleKo: '좌우명', description: 'Phrases that resonate', questionNumber: 4 },
  { step: 'subjects', title: 'Subjects', titleKo: '과목', description: 'School subjects you liked/disliked', questionNumber: 5 },
  { step: 'memories', title: 'Memories', titleKo: '기억', description: 'Your earliest memories', questionNumber: 6 },
  { step: 'findings', title: 'Findings', titleKo: '발견', description: 'AI-generated themes from your stories' },
  { step: 'followup', title: 'Follow-up', titleKo: '추가 질문', description: 'Reflect on your themes' },
  { step: 'results', title: 'Results', titleKo: '결과', description: 'View your complete analysis' },
];

export const ANALYSIS_TYPE_LABELS: Record<AnalysisType, {
  title: string;
  titleKo: string;
  description: string;
}> = {
  pattern_summary: {
    title: 'Pattern Summary',
    titleKo: '패턴 요약',
    description: 'Overview of all identified patterns',
  },
  theme_suggestion: {
    title: 'Theme Suggestions',
    titleKo: '테마 제안',
    description: 'AI-suggested life themes based on patterns',
  },
  enneagram_insight: {
    title: 'Enneagram Connection',
    titleKo: '에니어그램 연계',
    description: 'How themes relate to your Enneagram type',
  },
  career_implication: {
    title: 'Career Implications',
    titleKo: '커리어 시사점',
    description: 'Career and life direction insights',
  },
  final_synthesis: {
    title: 'Final Synthesis',
    titleKo: '최종 종합',
    description: 'Comprehensive analysis of your life themes',
  },
};


// ============================================================================
// Validation and Helper Functions
// ============================================================================

export function getQuestionByStep(step: LifeThemesStep): QuestionNumber | null {
  const stepConfig = LIFE_THEMES_STEPS.find(s => s.step === step);
  return stepConfig?.questionNumber || null;
}

export function getStepByQuestion(questionNumber: QuestionNumber): LifeThemesStep {
  return QUESTION_CONFIG[questionNumber].step;
}

export function getNextStep(currentStep: LifeThemesStep): LifeThemesStep | null {
  const stepOrder: LifeThemesStep[] = [
    'role_models', 'media', 'hobbies', 'mottos', 'subjects', 'memories',
    'findings', 'followup', 'results'
  ];
  const currentIndex = stepOrder.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex === stepOrder.length - 1) {
    return null;
  }
  return stepOrder[currentIndex + 1];
}

export function calculateProgress(responses: Record<QuestionNumber, LifeThemesResponse | null>): {
  completedQuestions: number;
  totalQuestions: number;
  percentage: number;
} {
  const totalQuestions = 6;
  const completedQuestions = Object.values(responses).filter(r => r?.is_completed).length;
  return {
    completedQuestions,
    totalQuestions,
    percentage: Math.round((completedQuestions / totalQuestions) * 100),
  };
}

export function validateResponse(
  questionNumber: QuestionNumber,
  responseData: ResponseData
): { isValid: boolean; errors: string[] } {
  const config = QUESTION_CONFIG[questionNumber];
  const errors: string[] = [];

  if (questionNumber === 5) {
    // Special handling for subjects (liked/disliked structure)
    const data = responseData as SubjectsResponse;
    if (!data.liked || data.liked.length < 1) {
      errors.push('At least one liked subject is required');
    }
  } else if (questionNumber === 6) {
    // Special handling for memories (fixed 3 fields)
    const data = responseData as MemoriesData;
    if (!data.memory1?.trim()) {
      errors.push('First memory is required');
    }
    if (!data.memory2?.trim()) {
      errors.push('Second memory is required');
    }
    if (!data.memory3?.trim()) {
      errors.push('Third memory is required');
    }
  } else if (questionNumber === 4) {
    // Mottos - array of MottoEntry
    const data = responseData as MottoEntry[];
    if (!Array.isArray(data)) {
      errors.push('Response must be an array');
    } else if (data.length < config.minEntries) {
      errors.push(`At least ${config.minEntries} entries required`);
    } else if (data.length > config.maxEntries) {
      errors.push(`Maximum ${config.maxEntries} entries allowed`);
    }
  } else {
    // All other questions are arrays
    const data = responseData as unknown[];
    if (!Array.isArray(data)) {
      errors.push('Response must be an array');
    } else if (data.length < config.minEntries) {
      errors.push(`At least ${config.minEntries} entries required`);
    } else if (data.length > config.maxEntries) {
      errors.push(`Maximum ${config.maxEntries} entries allowed`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function canProceedToFindings(
  responses: Record<QuestionNumber, LifeThemesResponse | null>
): { canProceed: boolean; missingQuestions: QuestionNumber[] } {
  const required: QuestionNumber[] = [1, 2, 3, 4, 5, 6];
  const missing = required.filter(q => !responses[q]?.is_completed);

  return {
    canProceed: missing.length === 0,
    missingQuestions: missing,
  };
}

/** @deprecated Use canProceedToFindings instead */
export const canProceedToPatterns = canProceedToFindings;

export function countPatternsByQuestion(patterns: LifeThemesPattern[]): Record<QuestionNumber, number> {
  const counts: Record<QuestionNumber, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

  patterns.forEach(pattern => {
    pattern.related_questions.forEach(q => {
      counts[q]++;
    });
  });

  return counts;
}
