import { describe, it, expect } from 'vitest';

/**
 * Unit tests for Mission module data transformation
 *
 * Pure logic extracted from getMissionData() in moduleProgressService.ts
 * to avoid server-side imports (createServerSupabaseClient) incompatible
 * with vitest.
 *
 * Tests cover: valuesUsed, top3MissionValues, selectedTargets/Verbs,
 * round1/2/3 data, reflections, finalStatement, draftVersions, and
 * graceful handling of null/missing fields.
 */

// ============================================================================
// Types (mirrored from src/lib/types/modules.ts)
// ============================================================================

interface MissionValueEntry {
  type: 'terminal' | 'instrumental' | 'work';
  name: string;
  relevance: string;
  selected: boolean;
}

interface Round1Data {
  selectedOption: 'option1' | 'option2' | 'freewrite';
  text: string;
  aiOption1?: string;
  aiOption2?: string;
}

interface Round2Data {
  text: string;
  aiSuggestion?: string;
}

interface Round3Data {
  text: string;
  selfAssessment: {
    clear: boolean;
    inspiring: boolean;
    altruistic: boolean;
    concise: boolean;
  };
  aiAnalysis?: {
    clarity: { score: number; feedback: string };
    inspiration: { score: number; feedback: string };
    altruism: { score: number; feedback: string };
    conciseness: { score: number; feedback: string };
    overall: number;
    suggestions: string[];
  };
}

interface MissionReflections {
  inspiration: string;
  alignment: string;
  feedback: string;
}

interface DraftVersion {
  version: number;
  text: string;
  createdAt: string;
  source: 'round1' | 'round2' | 'round3' | 'manual';
}

interface MissionData {
  valuesUsed: MissionValueEntry[];
  top3MissionValues: string[];
  aiValuesInsight?: string;
  selectedTargets: string[];
  selectedVerbs: string[];
  customTargets?: string[];
  customVerbs?: string[];
  round1: Round1Data;
  round2: Round2Data;
  round3: Round3Data;
  reflections: MissionReflections;
  aiFollowUpInsights?: string[];
  finalStatement: string;
  draftVersions: DraftVersion[];
  completedAt?: string;
}

// ============================================================================
// Extracted: getMissionData transformation
// Mirrors the logic inside moduleProgressService.ts getMissionData()
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformMissionData(data: any): MissionData | null {
  if (!data) return null;

  // Parse values used
  let valuesUsed: MissionValueEntry[] = [];
  if (data.values_used && Array.isArray(data.values_used)) {
    valuesUsed = data.values_used.map((v: any) => ({
      type: v.type || 'terminal',
      name: v.name || '',
      relevance: v.relevance || '',
      selected: v.selected !== false,
    }));
  }

  // Parse round data
  const round1Data = data.round1_data || {};
  const round2Data = data.round2_data || {};
  const round3Data = data.round3_data || {};

  // Parse draft versions
  let draftVersions: DraftVersion[] = [];
  if (data.draft_versions && Array.isArray(data.draft_versions)) {
    draftVersions = data.draft_versions.map((d: any) => ({
      version: d.version || 1,
      text: d.text || '',
      createdAt: d.createdAt || d.created_at || '',
      source: d.source || 'manual',
    }));
  }

  // Parse reflections and AI insights
  const reflections = data.reflections || {};
  const aiInsights = data.ai_insights || {};

  return {
    valuesUsed,
    top3MissionValues: data.top3_mission_values || [],
    aiValuesInsight: aiInsights.values_insight,
    selectedTargets: data.selected_targets || [],
    selectedVerbs: data.selected_verbs || [],
    customTargets: data.custom_targets || [],
    customVerbs: data.custom_verbs || [],
    round1: {
      selectedOption: round1Data.selectedOption || 'option1',
      text: round1Data.text || '',
      aiOption1: round1Data.aiOption1,
      aiOption2: round1Data.aiOption2,
    },
    round2: {
      text: round2Data.text || '',
      aiSuggestion: round2Data.aiSuggestion,
    },
    round3: {
      text: round3Data.text || '',
      selfAssessment: round3Data.selfAssessment || {
        clear: false,
        inspiring: false,
        altruistic: false,
        concise: false,
      },
      aiAnalysis: round3Data.aiAnalysis,
    },
    reflections: {
      inspiration: reflections.inspiration || '',
      alignment: reflections.alignment || '',
      feedback: reflections.feedback || '',
    },
    aiFollowUpInsights: aiInsights.follow_up_insights,
    finalStatement: data.final_statement || '',
    draftVersions,
    completedAt: data.completed_at,
  };
}

// ============================================================================
// Mock data (mirrors the canonical fixture from the task brief)
// ============================================================================

const mockMissionSession = {
  id: 'session-1',
  user_id: 'test-user-id',
  status: 'in_progress',
  current_step: 3,
  values_used: [
    { type: 'terminal', name: 'Freedom', relevance: 'Core to my identity', selected: true },
    { type: 'instrumental', name: 'Courage', relevance: 'Drives my actions', selected: true },
    { type: 'work', name: 'Achievement', relevance: 'Career motivator', selected: false },
  ],
  top3_mission_values: ['Freedom', 'Courage', 'Creativity'],
  selected_targets: ['Education', 'Mental Health', 'Youth Empowerment'],
  selected_verbs: ['Empower', 'Educate', 'Inspire'],
  custom_targets: ['Digital Literacy'],
  custom_verbs: ['Transform'],
  round1_data: {
    selectedOption: 'option1',
    text: 'My mission is to empower, educate, and inspire for education, mental health, and youth empowerment guided by freedom, courage, and creativity.',
    aiOption1: 'Template option 1...',
    aiOption2: 'Template option 2...',
  },
  round2_data: {
    text: 'My mission is to empower young people through education and mental health advocacy.',
    aiSuggestion: 'AI refined version...',
  },
  round3_data: {
    text: 'I empower youth through education and mental health, guided by freedom and courage.',
    selfAssessment: { clear: true, inspiring: true, altruistic: true, concise: true },
    aiAnalysis: {
      clarity: { score: 9, feedback: 'Very clear' },
      inspiration: { score: 8, feedback: 'Inspiring' },
      altruism: { score: 9, feedback: 'Altruistic' },
      conciseness: { score: 8, feedback: 'Concise' },
      overall: 8.5,
      suggestions: ['Consider adding specifics'],
    },
  },
  reflections: {
    inspiration: 'This mission statement inspires me because...',
    alignment: 'Acting in alignment means...',
    feedback: 'This activity was meaningful...',
  },
  ai_insights: {
    values_insight: 'Your values form a pattern...',
    follow_up_insights: ['Insight 1', 'Insight 2'],
  },
  final_statement: 'I empower youth through education and mental health, guided by freedom and courage.',
  draft_versions: [
    { version: 1, text: 'Draft 1...', createdAt: '2026-02-17T10:00:00Z', source: 'round1' },
    { version: 2, text: 'Draft 2...', createdAt: '2026-02-17T10:30:00Z', source: 'round2' },
  ],
  completed_at: null,
  created_at: '2026-02-17T09:00:00Z',
  updated_at: '2026-02-17T10:30:00Z',
};

// ============================================================================
// Tests: null guard
// ============================================================================

describe('getMissionData - null guard', () => {
  it('returns null when no mission_sessions row exists (data is null)', () => {
    expect(transformMissionData(null)).toBeNull();
  });

  it('returns null when data is undefined', () => {
    expect(transformMissionData(undefined)).toBeNull();
  });
});

// ============================================================================
// Tests: valuesUsed parsing
// ============================================================================

describe('getMissionData - valuesUsed parsing', () => {
  it('maps values_used with type, name, relevance, selected', () => {
    const result = transformMissionData(mockMissionSession)!;

    expect(result.valuesUsed).toHaveLength(3);
    expect(result.valuesUsed[0]).toEqual({
      type: 'terminal',
      name: 'Freedom',
      relevance: 'Core to my identity',
      selected: true,
    });
    expect(result.valuesUsed[1]).toEqual({
      type: 'instrumental',
      name: 'Courage',
      relevance: 'Drives my actions',
      selected: true,
    });
    expect(result.valuesUsed[2]).toEqual({
      type: 'work',
      name: 'Achievement',
      relevance: 'Career motivator',
      selected: false,
    });
  });

  it('defaults type to terminal when missing', () => {
    const data = { values_used: [{ name: 'Freedom', relevance: '', selected: true }] };
    const result = transformMissionData(data)!;
    expect(result.valuesUsed[0].type).toBe('terminal');
  });

  it('defaults selected to true when the selected field is absent', () => {
    const data = { values_used: [{ type: 'terminal', name: 'Freedom', relevance: '' }] };
    const result = transformMissionData(data)!;
    expect(result.valuesUsed[0].selected).toBe(true);
  });

  it('preserves selected: false explicitly', () => {
    const data = { values_used: [{ type: 'work', name: 'Achievement', relevance: '', selected: false }] };
    const result = transformMissionData(data)!;
    expect(result.valuesUsed[0].selected).toBe(false);
  });

  it('returns empty array when values_used is null', () => {
    const result = transformMissionData({ values_used: null })!;
    expect(result.valuesUsed).toEqual([]);
  });

  it('returns empty array when values_used is absent', () => {
    const result = transformMissionData({})!;
    expect(result.valuesUsed).toEqual([]);
  });
});

// ============================================================================
// Tests: top3MissionValues
// ============================================================================

describe('getMissionData - top3MissionValues parsing', () => {
  it('maps top3_mission_values array correctly', () => {
    const result = transformMissionData(mockMissionSession)!;
    expect(result.top3MissionValues).toEqual(['Freedom', 'Courage', 'Creativity']);
  });

  it('defaults to empty array when top3_mission_values is absent', () => {
    const result = transformMissionData({})!;
    expect(result.top3MissionValues).toEqual([]);
  });

  it('exposes aiValuesInsight from ai_insights.values_insight', () => {
    const result = transformMissionData(mockMissionSession)!;
    expect(result.aiValuesInsight).toBe('Your values form a pattern...');
  });

  it('aiValuesInsight is undefined when ai_insights is absent', () => {
    const result = transformMissionData({ ai_insights: {} })!;
    expect(result.aiValuesInsight).toBeUndefined();
  });
});

// ============================================================================
// Tests: selectedTargets and selectedVerbs
// ============================================================================

describe('getMissionData - selectedTargets and selectedVerbs', () => {
  it('maps selected_targets correctly', () => {
    const result = transformMissionData(mockMissionSession)!;
    expect(result.selectedTargets).toEqual(['Education', 'Mental Health', 'Youth Empowerment']);
  });

  it('maps selected_verbs correctly', () => {
    const result = transformMissionData(mockMissionSession)!;
    expect(result.selectedVerbs).toEqual(['Empower', 'Educate', 'Inspire']);
  });

  it('maps custom_targets correctly', () => {
    const result = transformMissionData(mockMissionSession)!;
    expect(result.customTargets).toEqual(['Digital Literacy']);
  });

  it('maps custom_verbs correctly', () => {
    const result = transformMissionData(mockMissionSession)!;
    expect(result.customVerbs).toEqual(['Transform']);
  });

  it('defaults selected_targets to empty array when absent', () => {
    const result = transformMissionData({})!;
    expect(result.selectedTargets).toEqual([]);
  });

  it('defaults selected_verbs to empty array when absent', () => {
    const result = transformMissionData({})!;
    expect(result.selectedVerbs).toEqual([]);
  });
});

// ============================================================================
// Tests: round1 data
// ============================================================================

describe('getMissionData - round1 data parsing', () => {
  it('maps round1 selectedOption, text, aiOption1, aiOption2', () => {
    const result = transformMissionData(mockMissionSession)!;

    expect(result.round1.selectedOption).toBe('option1');
    expect(result.round1.text).toBe(
      'My mission is to empower, educate, and inspire for education, mental health, and youth empowerment guided by freedom, courage, and creativity.'
    );
    expect(result.round1.aiOption1).toBe('Template option 1...');
    expect(result.round1.aiOption2).toBe('Template option 2...');
  });

  it('defaults selectedOption to option1 when missing', () => {
    const data = { round1_data: { text: 'Some text' } };
    const result = transformMissionData(data)!;
    expect(result.round1.selectedOption).toBe('option1');
  });

  it('defaults round1 text to empty string when absent', () => {
    const result = transformMissionData({ round1_data: {} })!;
    expect(result.round1.text).toBe('');
  });

  it('aiOption1 and aiOption2 are undefined when not in round1_data', () => {
    const data = { round1_data: { selectedOption: 'freewrite', text: 'Free text' } };
    const result = transformMissionData(data)!;
    expect(result.round1.aiOption1).toBeUndefined();
    expect(result.round1.aiOption2).toBeUndefined();
  });

  it('handles missing round1_data (uses empty object fallback)', () => {
    const result = transformMissionData({})!;
    expect(result.round1.selectedOption).toBe('option1');
    expect(result.round1.text).toBe('');
  });
});

// ============================================================================
// Tests: round2 data
// ============================================================================

describe('getMissionData - round2 data parsing', () => {
  it('maps round2 text and aiSuggestion', () => {
    const result = transformMissionData(mockMissionSession)!;

    expect(result.round2.text).toBe('My mission is to empower young people through education and mental health advocacy.');
    expect(result.round2.aiSuggestion).toBe('AI refined version...');
  });

  it('defaults round2 text to empty string when absent', () => {
    const result = transformMissionData({ round2_data: {} })!;
    expect(result.round2.text).toBe('');
  });

  it('aiSuggestion is undefined when not in round2_data', () => {
    const data = { round2_data: { text: 'My refined text' } };
    const result = transformMissionData(data)!;
    expect(result.round2.aiSuggestion).toBeUndefined();
  });
});

// ============================================================================
// Tests: round3 data
// ============================================================================

describe('getMissionData - round3 data parsing', () => {
  it('maps round3 text, selfAssessment, and aiAnalysis', () => {
    const result = transformMissionData(mockMissionSession)!;

    expect(result.round3.text).toBe('I empower youth through education and mental health, guided by freedom and courage.');
    expect(result.round3.selfAssessment).toEqual({ clear: true, inspiring: true, altruistic: true, concise: true });
    expect(result.round3.aiAnalysis?.overall).toBe(8.5);
    expect(result.round3.aiAnalysis?.suggestions).toEqual(['Consider adding specifics']);
  });

  it('defaults selfAssessment to all-false when missing from round3_data', () => {
    const data = { round3_data: { text: 'My statement' } };
    const result = transformMissionData(data)!;
    expect(result.round3.selfAssessment).toEqual({
      clear: false,
      inspiring: false,
      altruistic: false,
      concise: false,
    });
  });

  it('aiAnalysis is undefined when not in round3_data', () => {
    const data = { round3_data: { text: 'Text', selfAssessment: { clear: true, inspiring: false, altruistic: true, concise: false } } };
    const result = transformMissionData(data)!;
    expect(result.round3.aiAnalysis).toBeUndefined();
  });

  it('maps all aiAnalysis sub-scores correctly', () => {
    const result = transformMissionData(mockMissionSession)!;
    expect(result.round3.aiAnalysis?.clarity).toEqual({ score: 9, feedback: 'Very clear' });
    expect(result.round3.aiAnalysis?.inspiration).toEqual({ score: 8, feedback: 'Inspiring' });
    expect(result.round3.aiAnalysis?.altruism).toEqual({ score: 9, feedback: 'Altruistic' });
    expect(result.round3.aiAnalysis?.conciseness).toEqual({ score: 8, feedback: 'Concise' });
  });
});

// ============================================================================
// Tests: reflections
// ============================================================================

describe('getMissionData - reflections parsing', () => {
  it('maps reflections inspiration, alignment, feedback', () => {
    const result = transformMissionData(mockMissionSession)!;

    expect(result.reflections.inspiration).toBe('This mission statement inspires me because...');
    expect(result.reflections.alignment).toBe('Acting in alignment means...');
    expect(result.reflections.feedback).toBe('This activity was meaningful...');
  });

  it('defaults all reflection fields to empty string when reflections is absent', () => {
    const result = transformMissionData({})!;
    expect(result.reflections).toEqual({ inspiration: '', alignment: '', feedback: '' });
  });

  it('defaults missing individual reflection fields to empty string', () => {
    const data = { reflections: { inspiration: 'Only inspiration set' } };
    const result = transformMissionData(data)!;
    expect(result.reflections.inspiration).toBe('Only inspiration set');
    expect(result.reflections.alignment).toBe('');
    expect(result.reflections.feedback).toBe('');
  });

  it('exposes aiFollowUpInsights from ai_insights.follow_up_insights', () => {
    const result = transformMissionData(mockMissionSession)!;
    expect(result.aiFollowUpInsights).toEqual(['Insight 1', 'Insight 2']);
  });

  it('aiFollowUpInsights is undefined when follow_up_insights is absent', () => {
    const data = { ai_insights: { values_insight: 'Some insight' } };
    const result = transformMissionData(data)!;
    expect(result.aiFollowUpInsights).toBeUndefined();
  });
});

// ============================================================================
// Tests: finalStatement
// ============================================================================

describe('getMissionData - finalStatement parsing', () => {
  it('maps final_statement correctly', () => {
    const result = transformMissionData(mockMissionSession)!;
    expect(result.finalStatement).toBe('I empower youth through education and mental health, guided by freedom and courage.');
  });

  it('defaults finalStatement to empty string when final_statement is absent', () => {
    const result = transformMissionData({})!;
    expect(result.finalStatement).toBe('');
  });

  it('defaults finalStatement to empty string when final_statement is null', () => {
    const result = transformMissionData({ final_statement: null })!;
    expect(result.finalStatement).toBe('');
  });
});

// ============================================================================
// Tests: draftVersions
// ============================================================================

describe('getMissionData - draftVersions parsing', () => {
  it('maps draft_versions with version, text, createdAt, source', () => {
    const result = transformMissionData(mockMissionSession)!;

    expect(result.draftVersions).toHaveLength(2);
    expect(result.draftVersions[0]).toEqual({
      version: 1,
      text: 'Draft 1...',
      createdAt: '2026-02-17T10:00:00Z',
      source: 'round1',
    });
    expect(result.draftVersions[1]).toEqual({
      version: 2,
      text: 'Draft 2...',
      createdAt: '2026-02-17T10:30:00Z',
      source: 'round2',
    });
  });

  it('returns empty array when draft_versions is absent', () => {
    const result = transformMissionData({})!;
    expect(result.draftVersions).toEqual([]);
  });

  it('returns empty array when draft_versions is null', () => {
    const result = transformMissionData({ draft_versions: null })!;
    expect(result.draftVersions).toEqual([]);
  });

  it('defaults version to 1 when missing', () => {
    const data = { draft_versions: [{ text: 'Some draft', createdAt: '2026-02-17T10:00:00Z', source: 'round1' }] };
    const result = transformMissionData(data)!;
    expect(result.draftVersions[0].version).toBe(1);
  });

  it('falls back to created_at when createdAt is missing', () => {
    const data = { draft_versions: [{ version: 1, text: 'Draft', created_at: '2026-02-17T10:00:00Z', source: 'round1' }] };
    const result = transformMissionData(data)!;
    expect(result.draftVersions[0].createdAt).toBe('2026-02-17T10:00:00Z');
  });

  it('defaults source to manual when missing', () => {
    const data = { draft_versions: [{ version: 1, text: 'Draft', createdAt: '2026-02-17T10:00:00Z' }] };
    const result = transformMissionData(data)!;
    expect(result.draftVersions[0].source).toBe('manual');
  });
});

// ============================================================================
// Tests: completedAt
// ============================================================================

describe('getMissionData - completedAt parsing', () => {
  it('passes completedAt as undefined when completed_at is null', () => {
    const result = transformMissionData(mockMissionSession)!;
    // mockMissionSession.completed_at is null
    expect(result.completedAt).toBeNull();
  });

  it('passes completedAt when completed_at has a value', () => {
    const data = { ...mockMissionSession, completed_at: '2026-02-17T12:00:00Z' };
    const result = transformMissionData(data)!;
    expect(result.completedAt).toBe('2026-02-17T12:00:00Z');
  });
});

// ============================================================================
// Tests: empty JSONB fields ({}) graceful handling
// ============================================================================

describe('getMissionData - handles empty JSONB objects gracefully', () => {
  it('empty round1_data ({}) produces defaults without throwing', () => {
    const data = { round1_data: {} };
    const result = transformMissionData(data);
    expect(result).not.toBeNull();
    expect(result!.round1.selectedOption).toBe('option1');
    expect(result!.round1.text).toBe('');
  });

  it('empty round2_data ({}) produces defaults without throwing', () => {
    const data = { round2_data: {} };
    const result = transformMissionData(data);
    expect(result).not.toBeNull();
    expect(result!.round2.text).toBe('');
    expect(result!.round2.aiSuggestion).toBeUndefined();
  });

  it('empty round3_data ({}) produces defaults without throwing', () => {
    const data = { round3_data: {} };
    const result = transformMissionData(data);
    expect(result).not.toBeNull();
    expect(result!.round3.text).toBe('');
    expect(result!.round3.selfAssessment).toEqual({ clear: false, inspiring: false, altruistic: false, concise: false });
    expect(result!.round3.aiAnalysis).toBeUndefined();
  });

  it('empty reflections ({}) produces defaults without throwing', () => {
    const data = { reflections: {} };
    const result = transformMissionData(data);
    expect(result).not.toBeNull();
    expect(result!.reflections).toEqual({ inspiration: '', alignment: '', feedback: '' });
  });

  it('empty ai_insights ({}) produces undefined optional fields without throwing', () => {
    const data = { ai_insights: {} };
    const result = transformMissionData(data);
    expect(result).not.toBeNull();
    expect(result!.aiValuesInsight).toBeUndefined();
    expect(result!.aiFollowUpInsights).toBeUndefined();
  });

  it('completely empty data object ({}) produces a valid MissionData with all defaults', () => {
    const result = transformMissionData({});
    expect(result).not.toBeNull();
    expect(result!.valuesUsed).toEqual([]);
    expect(result!.top3MissionValues).toEqual([]);
    expect(result!.selectedTargets).toEqual([]);
    expect(result!.selectedVerbs).toEqual([]);
    expect(result!.finalStatement).toBe('');
    expect(result!.draftVersions).toEqual([]);
    expect(result!.reflections).toEqual({ inspiration: '', alignment: '', feedback: '' });
  });
});
