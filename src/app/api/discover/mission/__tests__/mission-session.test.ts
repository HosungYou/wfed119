import { describe, it, expect } from 'vitest';

/**
 * Unit tests for the Mission Session API (v3.5 - 4-step flow)
 *
 * Pure logic extracted from src/app/api/discover/mission/session/route.ts
 * to avoid Next.js server-side imports incompatible with vitest.
 */

// ============================================================================
// Extracted: step validation (PATCH handler)
// ============================================================================

function isValidMissionStep(step: number): boolean {
  return step >= 1 && step <= 4;
}

// ============================================================================
// Extracted: build update object from request body
// Mirrors the updateData construction in PATCH handler
// ============================================================================

function buildMissionUpdateData(body: Record<string, unknown>): Record<string, unknown> {
  const updateData: Record<string, unknown> = {};

  // Core fields
  if (body.current_step !== undefined) updateData.current_step = body.current_step;
  if (body.status !== undefined) updateData.status = body.status;

  // Step 1: Values
  if (body.values_used !== undefined) updateData.values_used = body.values_used;
  if (body.top3_mission_values !== undefined) updateData.top3_mission_values = body.top3_mission_values;
  if (body.ai_insights !== undefined) updateData.ai_insights = body.ai_insights;

  // Step 2: Mission Components
  if (body.selected_targets !== undefined) updateData.selected_targets = body.selected_targets;
  if (body.selected_verbs !== undefined) updateData.selected_verbs = body.selected_verbs;
  if (body.custom_targets !== undefined) updateData.custom_targets = body.custom_targets;
  if (body.custom_verbs !== undefined) updateData.custom_verbs = body.custom_verbs;

  // Step 3: Mission Drafting (3 rounds)
  if (body.round1_data !== undefined) updateData.round1_data = body.round1_data;
  if (body.round2_data !== undefined) updateData.round2_data = body.round2_data;
  if (body.round3_data !== undefined) updateData.round3_data = body.round3_data;
  if (body.draft_versions !== undefined) updateData.draft_versions = body.draft_versions;
  if (body.final_statement !== undefined) updateData.final_statement = body.final_statement;

  // Step 4: Reflections
  if (body.reflections !== undefined) updateData.reflections = body.reflections;

  // Legacy fields
  if (body.purpose_answers !== undefined) updateData.purpose_answers = body.purpose_answers;
  if (body.ai_conversation !== undefined) updateData.ai_conversation = body.ai_conversation;

  // Handle completion
  if (body.status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  return updateData;
}

// ============================================================================
// Extracted: new session defaults (GET handler - create branch)
// ============================================================================

function buildNewSessionDefaults(userId: string): Record<string, unknown> {
  return {
    user_id: userId,
    status: 'in_progress',
    current_step: 1,
    values_used: [],
    top3_mission_values: [],
    selected_targets: [],
    selected_verbs: [],
    custom_targets: [],
    custom_verbs: [],
    round1_data: {},
    round2_data: {},
    round3_data: {},
    reflections: {},
    ai_insights: {},
    draft_versions: [],
    purpose_answers: {},
    ai_conversation: [],
  };
}

// ============================================================================
// Tests: Step Validation
// ============================================================================

describe('Mission Session - step validation', () => {
  it('accepts step 1 (first step)', () => {
    expect(isValidMissionStep(1)).toBe(true);
  });

  it('accepts step 2', () => {
    expect(isValidMissionStep(2)).toBe(true);
  });

  it('accepts step 3', () => {
    expect(isValidMissionStep(3)).toBe(true);
  });

  it('accepts step 4 (final step)', () => {
    expect(isValidMissionStep(4)).toBe(true);
  });

  it('rejects step 5 (old 5-step flow)', () => {
    expect(isValidMissionStep(5)).toBe(false);
  });

  it('rejects step 0', () => {
    expect(isValidMissionStep(0)).toBe(false);
  });

  it('rejects negative steps', () => {
    expect(isValidMissionStep(-1)).toBe(false);
  });

  it('rejects step 6 and higher', () => {
    expect(isValidMissionStep(6)).toBe(false);
    expect(isValidMissionStep(100)).toBe(false);
  });
});

// ============================================================================
// Tests: New Session Defaults
// ============================================================================

describe('Mission Session - GET creates session with correct v3.5 defaults', () => {
  const defaults = buildNewSessionDefaults('test-user-id');

  it('sets current_step to 1', () => {
    expect(defaults.current_step).toBe(1);
  });

  it('sets status to in_progress', () => {
    expect(defaults.status).toBe('in_progress');
  });

  it('initializes values_used as empty array', () => {
    expect(defaults.values_used).toEqual([]);
  });

  it('initializes top3_mission_values as empty array', () => {
    expect(defaults.top3_mission_values).toEqual([]);
  });

  it('initializes selected_targets as empty array', () => {
    expect(defaults.selected_targets).toEqual([]);
  });

  it('initializes selected_verbs as empty array', () => {
    expect(defaults.selected_verbs).toEqual([]);
  });

  it('initializes custom_targets as empty array', () => {
    expect(defaults.custom_targets).toEqual([]);
  });

  it('initializes custom_verbs as empty array', () => {
    expect(defaults.custom_verbs).toEqual([]);
  });

  it('initializes round1_data as empty object', () => {
    expect(defaults.round1_data).toEqual({});
  });

  it('initializes round2_data as empty object', () => {
    expect(defaults.round2_data).toEqual({});
  });

  it('initializes round3_data as empty object', () => {
    expect(defaults.round3_data).toEqual({});
  });

  it('initializes reflections as empty object', () => {
    expect(defaults.reflections).toEqual({});
  });

  it('initializes ai_insights as empty object', () => {
    expect(defaults.ai_insights).toEqual({});
  });

  it('initializes draft_versions as empty array', () => {
    expect(defaults.draft_versions).toEqual([]);
  });

  it('sets user_id correctly', () => {
    expect(defaults.user_id).toBe('test-user-id');
  });
});

// ============================================================================
// Tests: PATCH - Step 1 fields
// ============================================================================

describe('Mission Session - PATCH step 1 saves values fields', () => {
  it('includes values_used when provided', () => {
    const body = {
      current_step: 1,
      values_used: [
        { type: 'terminal', name: 'Freedom', relevance: 'Core to identity', selected: true },
      ],
      top3_mission_values: ['Freedom', 'Courage', 'Creativity'],
      ai_insights: { values_insight: 'Your values pattern...', follow_up_insights: [] },
    };
    const update = buildMissionUpdateData(body);

    expect(update.current_step).toBe(1);
    expect(update.values_used).toEqual(body.values_used);
    expect(update.top3_mission_values).toEqual(['Freedom', 'Courage', 'Creativity']);
    expect(update.ai_insights).toEqual(body.ai_insights);
  });

  it('does not include step 2-4 fields when only step 1 fields are provided', () => {
    const body = {
      current_step: 1,
      values_used: [{ type: 'terminal', name: 'Freedom', relevance: '', selected: true }],
    };
    const update = buildMissionUpdateData(body);

    expect(update).not.toHaveProperty('selected_targets');
    expect(update).not.toHaveProperty('selected_verbs');
    expect(update).not.toHaveProperty('round1_data');
    expect(update).not.toHaveProperty('reflections');
  });
});

// ============================================================================
// Tests: PATCH - Step 2 fields
// ============================================================================

describe('Mission Session - PATCH step 2 saves mission component fields', () => {
  it('includes selected_targets and selected_verbs when provided', () => {
    const body = {
      current_step: 2,
      selected_targets: ['Education', 'Mental Health', 'Youth Empowerment'],
      selected_verbs: ['Empower', 'Educate', 'Inspire'],
      custom_targets: ['Digital Literacy'],
      custom_verbs: ['Transform'],
    };
    const update = buildMissionUpdateData(body);

    expect(update.current_step).toBe(2);
    expect(update.selected_targets).toEqual(['Education', 'Mental Health', 'Youth Empowerment']);
    expect(update.selected_verbs).toEqual(['Empower', 'Educate', 'Inspire']);
    expect(update.custom_targets).toEqual(['Digital Literacy']);
    expect(update.custom_verbs).toEqual(['Transform']);
  });

  it('handles custom_targets and custom_verbs as empty arrays', () => {
    const body = {
      current_step: 2,
      selected_targets: ['Education'],
      selected_verbs: ['Empower'],
      custom_targets: [],
      custom_verbs: [],
    };
    const update = buildMissionUpdateData(body);

    expect(update.custom_targets).toEqual([]);
    expect(update.custom_verbs).toEqual([]);
  });
});

// ============================================================================
// Tests: PATCH - Step 3 fields
// ============================================================================

describe('Mission Session - PATCH step 3 saves round data and draft versions', () => {
  it('saves round1_data with selectedOption, text, and AI options', () => {
    const round1 = {
      selectedOption: 'option1',
      text: 'My mission is to empower youth...',
      aiOption1: 'Template option 1...',
      aiOption2: 'Template option 2...',
    };
    const body = { current_step: 3, round1_data: round1 };
    const update = buildMissionUpdateData(body);

    expect(update.round1_data).toEqual(round1);
  });

  it('saves round2_data with text and aiSuggestion', () => {
    const round2 = {
      text: 'My mission is to empower young people...',
      aiSuggestion: 'AI refined version...',
    };
    const body = { current_step: 3, round2_data: round2 };
    const update = buildMissionUpdateData(body);

    expect(update.round2_data).toEqual(round2);
  });

  it('saves round3_data with text, selfAssessment, and aiAnalysis', () => {
    const round3 = {
      text: 'I empower youth through education...',
      selfAssessment: { clear: true, inspiring: true, altruistic: true, concise: true },
      aiAnalysis: {
        clarity: { score: 9, feedback: 'Very clear' },
        inspiration: { score: 8, feedback: 'Inspiring' },
        altruism: { score: 9, feedback: 'Altruistic' },
        conciseness: { score: 8, feedback: 'Concise' },
        overall: 8.5,
        suggestions: ['Consider adding specifics'],
      },
    };
    const body = { current_step: 3, round3_data: round3 };
    const update = buildMissionUpdateData(body);

    expect(update.round3_data).toEqual(round3);
  });

  it('saves final_statement when provided', () => {
    const body = {
      current_step: 3,
      final_statement: 'I empower youth through education, guided by freedom and courage.',
    };
    const update = buildMissionUpdateData(body);

    expect(update.final_statement).toBe('I empower youth through education, guided by freedom and courage.');
  });

  it('saves draft_versions array', () => {
    const drafts = [
      { version: 1, text: 'Draft 1...', createdAt: '2026-02-17T10:00:00Z', source: 'round1' },
      { version: 2, text: 'Draft 2...', createdAt: '2026-02-17T10:30:00Z', source: 'round2' },
    ];
    const body = { current_step: 3, draft_versions: drafts };
    const update = buildMissionUpdateData(body);

    expect(update.draft_versions).toEqual(drafts);
    expect((update.draft_versions as unknown[]).length).toBe(2);
  });
});

// ============================================================================
// Tests: PATCH - Step 4 fields
// ============================================================================

describe('Mission Session - PATCH step 4 saves reflections and completes session', () => {
  it('saves reflections with inspiration, alignment, feedback', () => {
    const reflections = {
      inspiration: 'This mission statement inspires me because...',
      alignment: 'Acting in alignment means...',
      feedback: 'This activity was meaningful...',
    };
    const body = { current_step: 4, reflections };
    const update = buildMissionUpdateData(body);

    expect(update.reflections).toEqual(reflections);
  });

  it('sets status to completed when status=completed is provided', () => {
    const body = {
      current_step: 4,
      status: 'completed',
      reflections: { inspiration: '...', alignment: '...', feedback: '...' },
    };
    const update = buildMissionUpdateData(body);

    expect(update.status).toBe('completed');
    expect(update.completed_at).toBeDefined();
    expect(typeof update.completed_at).toBe('string');
  });

  it('completed_at is a valid ISO timestamp', () => {
    const body = { status: 'completed' };
    const update = buildMissionUpdateData(body);

    const ts = new Date(update.completed_at as string);
    expect(isNaN(ts.getTime())).toBe(false);
  });

  it('does not set completed_at when status is in_progress', () => {
    const body = { current_step: 4, status: 'in_progress' };
    const update = buildMissionUpdateData(body);

    expect(update.completed_at).toBeUndefined();
  });
});

// ============================================================================
// Tests: PATCH - Partial updates
// ============================================================================

describe('Mission Session - PATCH partial update behavior', () => {
  it('only includes fields that are explicitly provided', () => {
    const body = { current_step: 2, selected_targets: ['Education'] };
    const update = buildMissionUpdateData(body);

    expect(Object.keys(update)).toEqual(['current_step', 'selected_targets']);
  });

  it('empty body produces empty update object', () => {
    const update = buildMissionUpdateData({});
    expect(Object.keys(update)).toHaveLength(0);
  });

  it('handles updating only status without step', () => {
    const body = { status: 'in_progress' };
    const update = buildMissionUpdateData(body);

    expect(update.status).toBe('in_progress');
    expect(update.current_step).toBeUndefined();
  });

  it('handles all fields together in a single update', () => {
    const body = {
      current_step: 3,
      status: 'in_progress',
      values_used: [{ type: 'terminal', name: 'Freedom', relevance: '', selected: true }],
      top3_mission_values: ['Freedom'],
      selected_targets: ['Education'],
      selected_verbs: ['Empower'],
      custom_targets: [],
      custom_verbs: [],
      round1_data: { selectedOption: 'option1', text: 'Draft...' },
      round2_data: { text: 'Refined...' },
      round3_data: { text: 'Final...', selfAssessment: { clear: true, inspiring: false, altruistic: true, concise: false } },
      draft_versions: [],
      final_statement: 'My final statement',
      reflections: { inspiration: '', alignment: '', feedback: '' },
      ai_insights: { values_insight: 'Insight...' },
    };
    const update = buildMissionUpdateData(body);

    expect(update.current_step).toBe(3);
    expect(update.values_used).toBeDefined();
    expect(update.selected_targets).toBeDefined();
    expect(update.round1_data).toBeDefined();
    expect(update.final_statement).toBe('My final statement');
    expect(update.reflections).toBeDefined();
  });
});
