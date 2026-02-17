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
}

function buildPrefillRoles(missionSession: MissionSession | null): any[] {
  if (!missionSession) return [];
  if (!missionSession.life_roles || !Array.isArray(missionSession.life_roles) || missionSession.life_roles.length === 0) return [];
  return missionSession.life_roles.map((r: any, i: number) => ({
    id: r.id || `prefill_${i}`,
    entity: r.entity || '',
    role: r.role || '',
    source: 'mission',
  }));
}

function isValidStep(step: number): boolean {
  return Number.isInteger(step) && step >= 1 && step <= 4;
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
    { id: 'f1', entity: 'Family', entityKo: '가족', role: 'Caring Family Member', roleKo: '돌보는 가족 구성원', source: 'template' },
    { id: 'f2', entity: 'Workplace', entityKo: '직장', role: 'Dedicated Professional', roleKo: '헌신적인 전문가', source: 'template' },
    { id: 'f3', entity: 'Friends', entityKo: '친구', role: 'Supportive Friend', roleKo: '지지하는 친구', source: 'template' },
    { id: 'f4', entity: 'Community', entityKo: '지역사회', role: 'Active Contributor', roleKo: '적극적인 기여자', source: 'template' },
    { id: 'f5', entity: 'Self', entityKo: '자신', role: 'Lifelong Learner', roleKo: '평생 학습자', source: 'template' },
    { id: 'f6', entity: 'Partner', entityKo: '파트너', role: 'Loving Partner', roleKo: '사랑하는 파트너', source: 'template' },
    { id: 'f7', entity: 'School', entityKo: '학교', role: 'Engaged Student', roleKo: '열정적인 학생', source: 'template' },
  ];
}

function isValidLifeRole(role: any): boolean {
  return !!role && typeof role.entity === 'string' && role.entity.trim().length > 0
    && typeof role.role === 'string' && role.role.trim().length > 0;
}

function generateFallbackCommitments(lifeRoles: any[]) {
  const roleCommitments: Record<string, string> = {};
  (lifeRoles || []).forEach((r: any) => {
    if (r?.role) {
      roleCommitments[r.role] = `Dedicate quality time each week to fulfill my role as ${r.role} with intention and care.`;
    }
  });
  return { roleCommitments };
}

function generateFallbackAssessment(context: any) {
  const roleCount = context.lifeRoles?.length || 0;
  const commitmentCount = context.roleCommitments?.length || 0;
  return {
    balanceAssessment: roleCount > 3 && commitmentCount > 2 ? 'balanced' : 'moderately_imbalanced',
    suggestedAdjustments: [
      'Review your time allocation to ensure it matches your desired percentages.',
      'Consider which roles energize you most and prioritize them.',
      'Build small daily habits to support your role commitments.',
    ],
    summary: 'Your life roles reflect a thoughtful approach to balancing multiple responsibilities.',
    summaryKo: '당신의 삶의 역할은 여러 책임의 균형을 맞추는 사려 깊은 접근을 반영합니다.',
    strengthAreas: ['Role awareness', 'Commitment clarity'],
    growthAreas: ['Time balance'],
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

  it('maps mission roles with entity, role, and source fields', () => {
    const result = buildPrefillRoles({ life_roles: [{ entity: 'Family', role: 'Parent' }] });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ entity: 'Family', role: 'Parent', source: 'mission' });
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

describe('Life Roles Session - step validation', () => {
  it('accepts steps 1-4', () => {
    for (let i = 1; i <= 4; i++) expect(isValidStep(i)).toBe(true);
  });

  it('rejects 0, 5, 6, negative, non-integer', () => {
    expect(isValidStep(0)).toBe(false);
    expect(isValidStep(5)).toBe(false);
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

  it('returns only roleCommitments with no wellbeing dimension keys', () => {
    const result = generateFallbackCommitments([{ role: 'Parent' }]);
    expect(result).toHaveProperty('roleCommitments');
    expect(result).not.toHaveProperty('wellbeingCommitments');
    const keys = Object.keys(result);
    expect(keys).toEqual(['roleCommitments']);
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
