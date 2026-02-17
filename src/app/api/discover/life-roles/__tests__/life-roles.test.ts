import { describe, it, expect } from 'vitest';

/**
 * Unit tests for Life Roles module pure logic
 * Logic extracted from route files (Next.js server imports incompatible with vitest)
 */

// ---------------------------------------------------------------------------
// Reproduced: session pre-fill logic
// ---------------------------------------------------------------------------

interface MissionSession {
  life_roles?: any[] | null;
  wellbeing_reflections?: Record<string, any> | null;
  role_commitments?: any[] | null;
}

function buildPrefillRoles(missionSession: MissionSession | null): any[] {
  if (!missionSession) return [];
  if (!missionSession.life_roles || !Array.isArray(missionSession.life_roles) || missionSession.life_roles.length === 0) return [];
  return missionSession.life_roles.map((r: any, i: number) => ({
    id: r.id || `prefill_${i}`,
    entity: r.entity || '',
    role: r.role || '',
    category: 'personal',
    importance: 3,
    source: 'mission',
  }));
}

function buildPrefillWellbeing(missionSession: MissionSession | null): Record<string, any> {
  if (!missionSession?.wellbeing_reflections) return {};
  if (Object.keys(missionSession.wellbeing_reflections).length === 0) return {};
  const wr: Record<string, any> = {};
  for (const [key, val] of Object.entries(missionSession.wellbeing_reflections)) {
    if (typeof val === 'string' && val.trim()) {
      wr[key] = { reflection: val, currentLevel: 5, goals: '' };
    } else if (typeof val === 'object' && val !== null) {
      wr[key] = val;
    }
  }
  return wr;
}

function isValidStep(step: number): boolean {
  return Number.isInteger(step) && step >= 1 && step <= 5;
}

// ---------------------------------------------------------------------------
// Reproduced: prerequisites logic
// ---------------------------------------------------------------------------

function computeHasMission(data: { status?: string; final_statement?: string | null } | null): boolean {
  return data?.status === 'completed' || !!data?.final_statement;
}

function computeHasValues(data: Array<{ value_set: string; top3: any[] }> | null): boolean {
  return !!(data && data.length > 0 && data.some(v => v.top3 && v.top3.length > 0));
}

function computeHasEnneagram(data: { primary_type?: string | null } | null): boolean {
  return !!data?.primary_type;
}

// ---------------------------------------------------------------------------
// Reproduced: AI fallback generators
// ---------------------------------------------------------------------------

function generateFallbackRoles() {
  return [
    { id: 'f1', entity: 'Family', entityKo: '가족', role: 'Caring Family Member', roleKo: '돌보는 가족 구성원', category: 'personal', source: 'template' },
    { id: 'f2', entity: 'Workplace', entityKo: '직장', role: 'Dedicated Professional', roleKo: '헌신적인 전문가', category: 'professional', source: 'template' },
    { id: 'f3', entity: 'Friends', entityKo: '친구', role: 'Supportive Friend', roleKo: '지지하는 친구', category: 'personal', source: 'template' },
    { id: 'f4', entity: 'Community', entityKo: '지역사회', role: 'Active Contributor', roleKo: '적극적인 기여자', category: 'community', source: 'template' },
    { id: 'f5', entity: 'Self', entityKo: '자신', role: 'Lifelong Learner', roleKo: '평생 학습자', category: 'health', source: 'template' },
    { id: 'f6', entity: 'Partner', entityKo: '파트너', role: 'Loving Partner', roleKo: '사랑하는 파트너', category: 'personal', source: 'template' },
    { id: 'f7', entity: 'School', entityKo: '학교', role: 'Engaged Student', roleKo: '열정적인 학생', category: 'professional', source: 'template' },
  ];
}

function isValidLifeRole(role: any): boolean {
  return !!role && typeof role.entity === 'string' && role.entity.trim().length > 0
    && typeof role.role === 'string' && role.role.trim().length > 0;
}

function getFallbackQuestions(dimension: string) {
  const fallbacks: Record<string, any[]> = {
    physical: [
      { question: 'How does your current physical routine support your life roles?', questionKo: '현재의 신체 활동이 삶의 역할을 어떻게 지원하고 있나요?' },
      { question: 'What one physical habit would most improve your energy?', questionKo: '어떤 신체적 습관이 에너지를 가장 향상시킬까요?' },
      { question: 'How do you manage stress across your different life roles?', questionKo: '다양한 삶의 역할에서 스트레스를 어떻게 관리하나요?' },
    ],
    intellectual: [
      { question: 'What are you currently learning that connects to your life purpose?', questionKo: '현재 삶의 목적과 연결되는 무엇을 배우고 있나요?' },
      { question: 'How does intellectual growth serve your most important roles?', questionKo: '지적 성장이 가장 중요한 역할을 어떻게 지원하나요?' },
      { question: 'What mental challenge would push you toward your vision?', questionKo: '어떤 지적 도전이 비전을 향해 나아가게 할까요?' },
    ],
    social_emotional: [
      { question: 'Which relationships currently need more attention?', questionKo: '현재 어떤 관계에 더 많은 관심이 필요한가요?' },
      { question: 'How do you express empathy and care in your daily roles?', questionKo: '일상적인 역할에서 공감과 돌봄을 어떻게 표현하나요?' },
      { question: 'What emotional skill would most improve your relationships?', questionKo: '어떤 감정적 기술이 관계를 가장 향상시킬까요?' },
    ],
    spiritual: [
      { question: 'What practices help you connect with your deeper sense of purpose?', questionKo: '어떤 실천이 더 깊은 목적 의식과 연결되도록 도와주나요?' },
      { question: 'How does your spiritual life influence how you show up in your roles?', questionKo: '영적 생활이 역할 수행에 어떤 영향을 미치나요?' },
      { question: 'What brings you inner peace amid competing life demands?', questionKo: '경쟁하는 삶의 요구 속에서 내면의 평화를 가져다주는 것은?' },
    ],
    financial: [
      { question: 'How does your financial situation support or limit your life roles?', questionKo: '재정 상황이 삶의 역할을 어떻게 지원하거나 제한하나요?' },
      { question: 'What financial habits would best align with your values?', questionKo: '어떤 재정 습관이 가치관에 가장 부합할까요?' },
      { question: 'How do you balance financial responsibility with meaningful investment?', questionKo: '재정적 책임과 의미 있는 투자 사이에서 어떻게 균형을 잡나요?' },
    ],
  };
  return fallbacks[dimension] || fallbacks.physical;
}

function generateFallbackCommitments(lifeRoles: any[]) {
  const roleCommitments: Record<string, string> = {};
  (lifeRoles || []).forEach((r: any) => {
    if (r?.role) {
      roleCommitments[r.role] = `Dedicate quality time each week to fulfill my role as ${r.role} with intention and care.`;
    }
  });
  return {
    roleCommitments,
    wellbeingCommitments: {
      physical: 'Exercise at least 3 times per week and prioritize 7-8 hours of sleep nightly.',
      intellectual: 'Read or learn something new for 30 minutes daily to stimulate intellectual growth.',
      social_emotional: 'Connect meaningfully with loved ones weekly and practice active listening.',
      spiritual: 'Set aside 15 minutes daily for meditation, reflection, or spiritual practice.',
      financial: 'Review budget monthly and save at least 10% of income toward future goals.',
    },
  };
}

function generateFallbackAssessment(context: any) {
  const roleCount = context.lifeRoles?.length || 0;
  const commitmentCount = context.roleCommitments?.length || 0;
  return {
    balanceAssessment: roleCount > 3 && commitmentCount > 2 ? 'balanced' : 'moderately_imbalanced',
    suggestedAdjustments: [
      'Review your time allocation to ensure it matches your desired percentages.',
      'Consider which roles energize you most and prioritize them.',
      'Build small daily habits to support your wellbeing commitments.',
    ],
    summary: 'Your life roles reflect a thoughtful approach to balancing multiple responsibilities.',
    summaryKo: '당신의 삶의 역할은 여러 책임의 균형을 맞추는 사려 깊은 접근을 반영합니다.',
    strengthAreas: ['Role awareness', 'Commitment clarity'],
    growthAreas: ['Time balance', 'Wellbeing integration'],
  };
}

// ===========================================================================
// TESTS
// ===========================================================================

describe('Life Roles Session - pre-fill roles from mission', () => {
  it('returns empty array when missionSession is null', () => {
    expect(buildPrefillRoles(null)).toEqual([]);
  });

  it('returns empty array when life_roles is null', () => {
    expect(buildPrefillRoles({ life_roles: null })).toEqual([]);
  });

  it('returns empty array when life_roles is empty', () => {
    expect(buildPrefillRoles({ life_roles: [] })).toEqual([]);
  });

  it('maps mission roles with defaults', () => {
    const result = buildPrefillRoles({ life_roles: [{ entity: 'Family', role: 'Parent' }] });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ entity: 'Family', role: 'Parent', category: 'personal', importance: 3, source: 'mission' });
  });

  it('preserves existing id', () => {
    const result = buildPrefillRoles({ life_roles: [{ id: 'x1', entity: 'Work', role: 'Dev' }] });
    expect(result[0].id).toBe('x1');
  });

  it('generates prefill_N id when no id', () => {
    const result = buildPrefillRoles({ life_roles: [{ entity: 'A', role: 'B' }] });
    expect(result[0].id).toBe('prefill_0');
  });

  it('falls back to empty strings for missing fields', () => {
    const result = buildPrefillRoles({ life_roles: [{}] });
    expect(result[0].entity).toBe('');
    expect(result[0].role).toBe('');
  });
});

describe('Life Roles Session - pre-fill wellbeing', () => {
  it('returns empty object when null', () => {
    expect(buildPrefillWellbeing(null)).toEqual({});
  });

  it('returns empty object when empty', () => {
    expect(buildPrefillWellbeing({ wellbeing_reflections: {} })).toEqual({});
  });

  it('converts string to structured format', () => {
    const result = buildPrefillWellbeing({ wellbeing_reflections: { physical: 'I exercise daily' } });
    expect(result.physical).toEqual({ reflection: 'I exercise daily', currentLevel: 5, goals: '' });
  });

  it('passes through object reflections', () => {
    const obj = { reflection: 'test', currentLevel: 7, goals: 'run' };
    const result = buildPrefillWellbeing({ wellbeing_reflections: { physical: obj } });
    expect(result.physical).toEqual(obj);
  });

  it('skips empty/whitespace strings', () => {
    const result = buildPrefillWellbeing({ wellbeing_reflections: { a: '', b: '   ', c: 'valid' } });
    expect(result.a).toBeUndefined();
    expect(result.b).toBeUndefined();
    expect(result.c).toBeDefined();
  });
});

describe('Life Roles Session - step validation', () => {
  it('accepts steps 1-5', () => {
    for (let i = 1; i <= 5; i++) expect(isValidStep(i)).toBe(true);
  });

  it('rejects 0, 6, negative, non-integer', () => {
    expect(isValidStep(0)).toBe(false);
    expect(isValidStep(6)).toBe(false);
    expect(isValidStep(-1)).toBe(false);
    expect(isValidStep(2.5)).toBe(false);
  });
});

describe('Life Roles Prerequisites', () => {
  it('hasMission: true when completed', () => {
    expect(computeHasMission({ status: 'completed' })).toBe(true);
  });

  it('hasMission: true when final_statement present', () => {
    expect(computeHasMission({ final_statement: 'My mission' })).toBe(true);
  });

  it('hasMission: false when in_progress and no statement', () => {
    expect(computeHasMission({ status: 'in_progress', final_statement: null })).toBe(false);
  });

  it('hasMission: false when null', () => {
    expect(computeHasMission(null)).toBe(false);
  });

  it('hasValues: true when data has top3', () => {
    expect(computeHasValues([{ value_set: 'terminal', top3: ['A', 'B'] }])).toBe(true);
  });

  it('hasValues: false when empty', () => {
    expect(computeHasValues([])).toBe(false);
    expect(computeHasValues(null)).toBe(false);
    expect(computeHasValues([{ value_set: 'x', top3: [] }])).toBe(false);
  });

  it('hasEnneagram: true/false based on primary_type', () => {
    expect(computeHasEnneagram({ primary_type: '4' })).toBe(true);
    expect(computeHasEnneagram({ primary_type: null })).toBe(false);
    expect(computeHasEnneagram(null)).toBe(false);
  });
});

describe('AI Fallback - generateFallbackRoles', () => {
  it('returns 7 template roles', () => {
    expect(generateFallbackRoles()).toHaveLength(7);
  });

  it('all have entity, role, Korean translations, and source=template', () => {
    for (const s of generateFallbackRoles()) {
      expect(s.entity).toBeTruthy();
      expect(s.role).toBeTruthy();
      expect(s.entityKo).toBeTruthy();
      expect(s.roleKo).toBeTruthy();
      expect(s.source).toBe('template');
    }
  });

  it('covers all 4 categories', () => {
    const cats = generateFallbackRoles().map(s => s.category);
    expect(cats).toContain('personal');
    expect(cats).toContain('professional');
    expect(cats).toContain('community');
    expect(cats).toContain('health');
  });
});

describe('Life Role data validation', () => {
  it('valid role passes', () => {
    expect(isValidLifeRole({ entity: 'Family', role: 'Parent' })).toBe(true);
  });

  it('fails without entity or role', () => {
    expect(isValidLifeRole({ role: 'Parent' })).toBe(false);
    expect(isValidLifeRole({ entity: 'Family' })).toBe(false);
    expect(isValidLifeRole({ entity: '', role: 'X' })).toBe(false);
    expect(isValidLifeRole({ entity: 'X', role: '' })).toBe(false);
    expect(isValidLifeRole(null)).toBe(false);
  });

  it('minimum 4 roles for Step 1 (fallback has 7)', () => {
    expect(generateFallbackRoles().length >= 4).toBe(true);
  });
});

describe('AI Fallback - getFallbackQuestions', () => {
  const dims = ['physical', 'intellectual', 'social_emotional', 'spiritual', 'financial'];

  it('returns 3 questions per dimension', () => {
    for (const d of dims) expect(getFallbackQuestions(d)).toHaveLength(3);
  });

  it('falls back to physical for unknown dimension', () => {
    expect(getFallbackQuestions('unknown')).toEqual(getFallbackQuestions('physical'));
  });

  it('every question has EN and KO text', () => {
    for (const q of getFallbackQuestions('spiritual')) {
      expect(q.question).toBeTruthy();
      expect(q.questionKo).toBeTruthy();
    }
  });
});

describe('AI Fallback - generateFallbackCommitments', () => {
  it('empty roles → empty roleCommitments', () => {
    expect(generateFallbackCommitments([]).roleCommitments).toEqual({});
  });

  it('generates commitment per role', () => {
    const result = generateFallbackCommitments([{ role: 'Parent' }, { role: 'Engineer' }]);
    expect(Object.keys(result.roleCommitments)).toHaveLength(2);
    expect(result.roleCommitments['Parent']).toContain('Parent');
  });

  it('skips roles without role field', () => {
    const result = generateFallbackCommitments([{ entity: 'X' }, { role: 'Y' }]);
    expect(Object.keys(result.roleCommitments)).toHaveLength(1);
  });

  it('handles null input', () => {
    expect(generateFallbackCommitments(null as any).roleCommitments).toEqual({});
  });

  it('returns all 5 wellbeing dimensions', () => {
    const wc = generateFallbackCommitments([]).wellbeingCommitments;
    for (const d of ['physical', 'intellectual', 'social_emotional', 'spiritual', 'financial']) {
      expect(wc[d]).toBeTruthy();
    }
  });
});

describe('AI Fallback - generateFallbackAssessment', () => {
  it('balanced when >3 roles and >2 commitments', () => {
    expect(generateFallbackAssessment({ lifeRoles: [1, 2, 3, 4], roleCommitments: [1, 2, 3] }).balanceAssessment).toBe('balanced');
  });

  it('moderately_imbalanced when <4 roles', () => {
    expect(generateFallbackAssessment({ lifeRoles: [1, 2], roleCommitments: [1, 2, 3] }).balanceAssessment).toBe('moderately_imbalanced');
  });

  it('moderately_imbalanced when <3 commitments', () => {
    expect(generateFallbackAssessment({ lifeRoles: [1, 2, 3, 4], roleCommitments: [1] }).balanceAssessment).toBe('moderately_imbalanced');
  });

  it('moderately_imbalanced for empty context', () => {
    expect(generateFallbackAssessment({}).balanceAssessment).toBe('moderately_imbalanced');
  });

  it('always returns 3 adjustments, summary, summaryKo, strengthAreas, growthAreas', () => {
    const r = generateFallbackAssessment({});
    expect(r.suggestedAdjustments).toHaveLength(3);
    expect(r.summary.length).toBeGreaterThan(0);
    expect(r.summaryKo.length).toBeGreaterThan(0);
    expect(r.strengthAreas.length).toBeGreaterThan(0);
    expect(r.growthAreas.length).toBeGreaterThan(0);
  });
});
