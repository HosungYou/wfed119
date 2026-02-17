import { describe, it, expect } from 'vitest';

// ============================================================================
// Extracted Logic Under Test
//
// We cannot import ModuleProgressService directly because it calls
// createServerSupabaseClient() at module load time.  Instead we extract the
// pure data-transformation logic from getLifeRolesData() and
// deriveProgressFromExistingData() into local helper functions and test those
// in isolation.
// ============================================================================

// ---------------------------------------------------------------------------
// Types (mirrored from modules.ts to avoid importing the server module)
// ---------------------------------------------------------------------------

interface LifeRolesRole {
  id: string;
  entity: string;
  role: string;
  category: 'personal' | 'professional' | 'community' | 'health';
  importance: 1 | 2 | 3 | 4 | 5;
}

interface WellbeingReflection {
  reflection: string;
  currentLevel: number;
  goals: string;
}

interface RainbowSlot {
  roleId: string;
  roleName: string;
  ageStart: number;
  ageEnd: number;
  intensity: number;
}

interface RainbowData {
  currentAge: number;
  slots: RainbowSlot[];
  notes?: string;
}

interface Commitment {
  roleId: string;
  roleName: string;
  commitment: string;
  currentTimePercentage: number;
  desiredTimePercentage: number;
  gapAnalysis: string;
}

interface BalanceAssessment {
  currentBalance: 'balanced' | 'moderately_imbalanced' | 'severely_imbalanced';
  suggestedAdjustments: string[];
  notes: string;
}

interface LifeRolesData {
  roles: LifeRolesRole[];
  wellbeingReflections: Record<string, WellbeingReflection>;
  rainbowData: RainbowData;
  commitments: Commitment[];
  wellbeingCommitments: Record<string, string>;
  balanceAssessment: BalanceAssessment;
  completedAt?: string;
}

type ModuleStatus = 'not_started' | 'in_progress' | 'completed';

interface ModuleProgress {
  moduleId: string;
  status: ModuleStatus;
  completionPercentage: number;
  currentStage?: string;
  lastUpdatedAt: string;
  completedAt?: string;
}

// ---------------------------------------------------------------------------
// Extracted: getLifeRolesData transformation
// Mirrors the logic inside moduleProgressService.ts getLifeRolesData()
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformLifeRolesData(data: any): LifeRolesData {
  const roles = (data.life_roles || []).map((r: any) => ({
    id: r.id || '',
    entity: r.entity || '',
    role: r.role || '',
    category: r.category || 'personal',
    importance: r.importance || 3,
  }));

  const wellbeingReflections: Record<string, WellbeingReflection> = {};
  if (data.wellbeing_reflections && typeof data.wellbeing_reflections === 'object') {
    for (const [key, val] of Object.entries(data.wellbeing_reflections as Record<string, any>)) {
      wellbeingReflections[key] = {
        reflection: val?.reflection || '',
        currentLevel: val?.currentLevel || 5,
        goals: val?.goals || '',
      };
    }
  }

  const rainbowData: RainbowData = {
    currentAge: data.rainbow_data?.currentAge || 25,
    slots: data.rainbow_data?.slots || [],
  };

  const commitments = (data.role_commitments || []).map((c: any) => ({
    roleId: c.roleId || '',
    roleName: c.roleName || '',
    commitment: c.commitment || '',
    currentTimePercentage: c.currentTimePct || 0,
    desiredTimePercentage: c.desiredTimePct || 0,
    gapAnalysis: c.gapAnalysis || '',
  }));

  const wellbeingCommitments: Record<string, string> = data.wellbeing_commitments || {};

  const reflection = data.reflection || {};
  const balanceAssessment: BalanceAssessment = {
    currentBalance: reflection.balanceAssessment || 'balanced',
    suggestedAdjustments: reflection.aiSummary?.suggestedAdjustments || [],
    notes: reflection.lessonsLearned || '',
  };

  return {
    roles,
    wellbeingReflections,
    rainbowData,
    commitments,
    wellbeingCommitments,
    balanceAssessment,
    completedAt: data.completed_at,
  };
}

// ---------------------------------------------------------------------------
// Extracted: deriveProgressFromExistingData - life-roles block
// Mirrors the life-roles section inside deriveProgressFromExistingData()
// ---------------------------------------------------------------------------

function deriveLifeRolesProgress(
  lifeRolesRow: { status: string; current_step: number; updated_at: string } | null
): ModuleProgress | null {
  if (!lifeRolesRow) return null;

  const isCompleted = lifeRolesRow.status === 'completed';
  const stepPct = Math.min(100, Math.round((lifeRolesRow.current_step / 5) * 100));

  return {
    moduleId: 'life-roles',
    status: isCompleted ? 'completed' : 'in_progress',
    completionPercentage: isCompleted ? 100 : stepPct,
    currentStage: undefined,
    lastUpdatedAt: lifeRolesRow.updated_at || new Date().toISOString(),
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('getLifeRolesData - data transformation', () => {
  // -------------------------------------------------------------------------
  // 1. Roles array
  // -------------------------------------------------------------------------

  it('maps life_roles JSONB array to roles with correct fields', () => {
    const raw = {
      life_roles: [
        { id: 'r1', entity: 'Family', role: 'Son', category: 'personal', importance: 5 },
        { id: 'r2', entity: 'Workplace', role: 'Team Lead', category: 'professional', importance: 4 },
      ],
    };

    const result = transformLifeRolesData(raw);

    expect(result.roles).toHaveLength(2);
    expect(result.roles[0]).toEqual({ id: 'r1', entity: 'Family', role: 'Son', category: 'personal', importance: 5 });
    expect(result.roles[1]).toEqual({ id: 'r2', entity: 'Workplace', role: 'Team Lead', category: 'professional', importance: 4 });
  });

  it('handles empty life_roles array', () => {
    const raw = { life_roles: [] };
    const result = transformLifeRolesData(raw);
    expect(result.roles).toEqual([]);
  });

  it('handles null life_roles (treats as empty)', () => {
    const raw = { life_roles: null };
    const result = transformLifeRolesData(raw);
    expect(result.roles).toEqual([]);
  });

  it('sets default category to personal when category is missing', () => {
    const raw = { life_roles: [{ id: 'r1', entity: 'Church', role: 'Member' }] };
    const result = transformLifeRolesData(raw);
    expect(result.roles[0].category).toBe('personal');
  });

  it('sets default importance to 3 when importance is missing', () => {
    const raw = { life_roles: [{ id: 'r1', entity: 'Friend', role: 'Best Friend' }] };
    const result = transformLifeRolesData(raw);
    expect(result.roles[0].importance).toBe(3);
  });

  // -------------------------------------------------------------------------
  // 2. Wellbeing Reflections
  // -------------------------------------------------------------------------

  it('maps wellbeing_reflections object with all fields correctly', () => {
    const raw = {
      wellbeing_reflections: {
        physical: { reflection: 'I exercise daily', currentLevel: 8, goals: 'Run a marathon' },
        emotional: { reflection: 'Feeling balanced', currentLevel: 7, goals: 'Meditate more' },
      },
    };

    const result = transformLifeRolesData(raw);

    expect(result.wellbeingReflections.physical).toEqual({
      reflection: 'I exercise daily',
      currentLevel: 8,
      goals: 'Run a marathon',
    });
    expect(result.wellbeingReflections.emotional).toEqual({
      reflection: 'Feeling balanced',
      currentLevel: 7,
      goals: 'Meditate more',
    });
  });

  it('handles empty wellbeing_reflections (produces empty object)', () => {
    const raw = { wellbeing_reflections: {} };
    const result = transformLifeRolesData(raw);
    expect(result.wellbeingReflections).toEqual({});
  });

  it('sets default currentLevel to 5 when currentLevel is missing from a reflection entry', () => {
    const raw = {
      wellbeing_reflections: {
        spiritual: { reflection: 'Prayer time', goals: 'Read scripture' },
      },
    };
    const result = transformLifeRolesData(raw);
    expect(result.wellbeingReflections.spiritual.currentLevel).toBe(5);
  });

  it('handles missing reflection and goals fields in wellbeing entries (defaults to empty string)', () => {
    const raw = {
      wellbeing_reflections: {
        social: { currentLevel: 6 },
      },
    };
    const result = transformLifeRolesData(raw);
    expect(result.wellbeingReflections.social.reflection).toBe('');
    expect(result.wellbeingReflections.social.goals).toBe('');
  });

  it('handles missing wellbeing_reflections entirely (produces empty object)', () => {
    const raw = {};
    const result = transformLifeRolesData(raw);
    expect(result.wellbeingReflections).toEqual({});
  });

  // -------------------------------------------------------------------------
  // 3. Rainbow Data
  // -------------------------------------------------------------------------

  it('maps rainbow_data with currentAge and slots', () => {
    const raw = {
      rainbow_data: {
        currentAge: 35,
        slots: [
          { roleId: 'r1', roleName: 'Parent', ageStart: 30, ageEnd: 50, intensity: 5 },
        ],
      },
    };

    const result = transformLifeRolesData(raw);

    expect(result.rainbowData.currentAge).toBe(35);
    expect(result.rainbowData.slots).toHaveLength(1);
    expect(result.rainbowData.slots[0]).toEqual({ roleId: 'r1', roleName: 'Parent', ageStart: 30, ageEnd: 50, intensity: 5 });
  });

  it('handles empty rainbow_data (sets defaults)', () => {
    const raw = { rainbow_data: null };
    const result = transformLifeRolesData(raw);
    expect(result.rainbowData.currentAge).toBe(25);
    expect(result.rainbowData.slots).toEqual([]);
  });

  it('sets default currentAge to 25 when rainbow_data is absent', () => {
    const raw = {};
    const result = transformLifeRolesData(raw);
    expect(result.rainbowData.currentAge).toBe(25);
  });

  // -------------------------------------------------------------------------
  // 4. Commitments
  // -------------------------------------------------------------------------

  it('maps role_commitments correctly with all fields', () => {
    const raw = {
      role_commitments: [
        {
          roleId: 'r1',
          roleName: 'Parent',
          commitment: 'Be present at dinner',
          currentTimePct: 20,
          desiredTimePct: 35,
          gapAnalysis: 'Need 15% more time',
        },
      ],
    };

    const result = transformLifeRolesData(raw);

    expect(result.commitments).toHaveLength(1);
    expect(result.commitments[0]).toEqual({
      roleId: 'r1',
      roleName: 'Parent',
      commitment: 'Be present at dinner',
      currentTimePercentage: 20,
      desiredTimePercentage: 35,
      gapAnalysis: 'Need 15% more time',
    });
  });

  it('handles empty role_commitments array', () => {
    const raw = { role_commitments: [] };
    const result = transformLifeRolesData(raw);
    expect(result.commitments).toEqual([]);
  });

  it('maps wellbeing_commitments as Record<string, string>', () => {
    const raw = {
      wellbeing_commitments: {
        physical: 'Exercise 3x per week',
        emotional: 'Journal daily',
      },
    };

    const result = transformLifeRolesData(raw);

    expect(result.wellbeingCommitments).toEqual({
      physical: 'Exercise 3x per week',
      emotional: 'Journal daily',
    });
  });

  // -------------------------------------------------------------------------
  // 5. Balance Assessment
  // -------------------------------------------------------------------------

  it('extracts balanceAssessment from reflection JSONB', () => {
    const raw = {
      reflection: {
        balanceAssessment: 'moderately_imbalanced',
        aiSummary: { suggestedAdjustments: ['Reduce work hours', 'Increase family time'] },
        lessonsLearned: 'I need to delegate more',
      },
    };

    const result = transformLifeRolesData(raw);

    expect(result.balanceAssessment.currentBalance).toBe('moderately_imbalanced');
    expect(result.balanceAssessment.suggestedAdjustments).toEqual(['Reduce work hours', 'Increase family time']);
    expect(result.balanceAssessment.notes).toBe('I need to delegate more');
  });

  it('handles missing reflection data (all balance fields get defaults)', () => {
    const raw = {};
    const result = transformLifeRolesData(raw);
    expect(result.balanceAssessment.currentBalance).toBe('balanced');
    expect(result.balanceAssessment.suggestedAdjustments).toEqual([]);
    expect(result.balanceAssessment.notes).toBe('');
  });

  it('defaults currentBalance to balanced when balanceAssessment key is absent in reflection', () => {
    const raw = { reflection: { lessonsLearned: 'Some notes' } };
    const result = transformLifeRolesData(raw);
    expect(result.balanceAssessment.currentBalance).toBe('balanced');
  });

  // -------------------------------------------------------------------------
  // 6. completedAt
  // -------------------------------------------------------------------------

  it('sets completedAt from completed_at column when present', () => {
    const raw = { completed_at: '2026-01-15T10:00:00Z' };
    const result = transformLifeRolesData(raw);
    expect(result.completedAt).toBe('2026-01-15T10:00:00Z');
  });

  it('leaves completedAt as undefined when completed_at is absent', () => {
    const raw = {};
    const result = transformLifeRolesData(raw);
    expect(result.completedAt).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // 7. Full valid data → all required fields
  // -------------------------------------------------------------------------

  it('full valid data produces all required LifeRolesData fields', () => {
    const raw = {
      life_roles: [
        { id: 'r1', entity: 'Family', role: 'Spouse', category: 'personal', importance: 5 },
      ],
      wellbeing_reflections: {
        physical: { reflection: 'Active', currentLevel: 8, goals: 'Run 5k' },
      },
      rainbow_data: { currentAge: 40, slots: [] },
      role_commitments: [
        { roleId: 'r1', roleName: 'Spouse', commitment: 'Date night weekly', currentTimePct: 10, desiredTimePct: 20, gapAnalysis: '+10%' },
      ],
      wellbeing_commitments: { physical: 'Daily walk' },
      reflection: {
        balanceAssessment: 'balanced',
        aiSummary: { suggestedAdjustments: [] },
        lessonsLearned: '',
      },
      completed_at: '2026-02-01T08:00:00Z',
    };

    const result = transformLifeRolesData(raw);

    expect(result).toHaveProperty('roles');
    expect(result).toHaveProperty('wellbeingReflections');
    expect(result).toHaveProperty('rainbowData');
    expect(result).toHaveProperty('commitments');
    expect(result).toHaveProperty('wellbeingCommitments');
    expect(result).toHaveProperty('balanceAssessment');
    expect(result).toHaveProperty('completedAt');
    // Spot-check values
    expect(result.roles[0].entity).toBe('Family');
    expect(result.rainbowData.currentAge).toBe(40);
    expect(result.commitments[0].currentTimePercentage).toBe(10);
  });
});

// ============================================================================
// deriveProgressFromExistingData – life-roles block
// ============================================================================

describe('deriveProgressFromExistingData - life-roles block', () => {
  it('returns in_progress when session exists but status is not completed', () => {
    const row = { status: 'in_progress', current_step: 2, updated_at: '2026-01-10T00:00:00Z' };
    const result = deriveLifeRolesProgress(row);

    expect(result).not.toBeNull();
    expect(result!.moduleId).toBe('life-roles');
    expect(result!.status).toBe('in_progress');
  });

  it('returns completed when status is completed', () => {
    const row = { status: 'completed', current_step: 5, updated_at: '2026-01-20T00:00:00Z' };
    const result = deriveLifeRolesProgress(row);

    expect(result!.status).toBe('completed');
    expect(result!.completionPercentage).toBe(100);
  });

  it('calculates correct completion percentage from current_step (step 3 of 5 = 60%)', () => {
    const row = { status: 'in_progress', current_step: 3, updated_at: '2026-01-12T00:00:00Z' };
    const result = deriveLifeRolesProgress(row);

    expect(result!.completionPercentage).toBe(60);
  });

  it('calculates correct completion percentage from current_step (step 1 of 5 = 20%)', () => {
    const row = { status: 'in_progress', current_step: 1, updated_at: '2026-01-11T00:00:00Z' };
    const result = deriveLifeRolesProgress(row);

    expect(result!.completionPercentage).toBe(20);
  });

  it('caps completion percentage at 100 even when current_step exceeds 5', () => {
    const row = { status: 'in_progress', current_step: 10, updated_at: '2026-01-13T00:00:00Z' };
    const result = deriveLifeRolesProgress(row);

    expect(result!.completionPercentage).toBe(100);
  });

  it('does not include life-roles progress when no session row exists (returns null)', () => {
    const result = deriveLifeRolesProgress(null);
    expect(result).toBeNull();
  });

  it('sets moduleId to life-roles', () => {
    const row = { status: 'in_progress', current_step: 2, updated_at: '2026-01-10T00:00:00Z' };
    const result = deriveLifeRolesProgress(row);

    expect(result!.moduleId).toBe('life-roles');
  });

  it('preserves lastUpdatedAt from the database row', () => {
    const updatedAt = '2026-01-15T12:30:00Z';
    const row = { status: 'in_progress', current_step: 2, updated_at: updatedAt };
    const result = deriveLifeRolesProgress(row);

    expect(result!.lastUpdatedAt).toBe(updatedAt);
  });

  it('step 0 produces 0% completion', () => {
    const row = { status: 'in_progress', current_step: 0, updated_at: '2026-01-10T00:00:00Z' };
    const result = deriveLifeRolesProgress(row);

    expect(result!.completionPercentage).toBe(0);
  });

  it('step 2 of 5 produces 40%', () => {
    const row = { status: 'in_progress', current_step: 2, updated_at: '2026-01-10T00:00:00Z' };
    const result = deriveLifeRolesProgress(row);

    expect(result!.completionPercentage).toBe(40);
  });

  it('step 4 of 5 produces 80%', () => {
    const row = { status: 'in_progress', current_step: 4, updated_at: '2026-01-10T00:00:00Z' };
    const result = deriveLifeRolesProgress(row);

    expect(result!.completionPercentage).toBe(80);
  });

  it('completed row always returns 100% regardless of current_step', () => {
    const row = { status: 'completed', current_step: 3, updated_at: '2026-01-20T00:00:00Z' };
    const result = deriveLifeRolesProgress(row);

    expect(result!.completionPercentage).toBe(100);
    expect(result!.status).toBe('completed');
  });
});
