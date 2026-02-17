import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModuleProgressService } from '../moduleProgressService';

// Table-specific mock results
let tableResults: Record<string, { data: unknown; error: unknown }> = {};

function createTableChain(tableName: string) {
  const result = tableResults[tableName] || { data: null, error: null };
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'order', 'limit', 'filter'];
  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  chain.single = vi.fn().mockResolvedValue(result);
  chain.maybeSingle = vi.fn().mockResolvedValue(result);

  // For queries that don't use .single() - make chain itself resolve
  const promise = Promise.resolve(result);
  chain.then = promise.then.bind(promise);
  chain.catch = promise.catch.bind(promise);

  return chain;
}

vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: vi.fn().mockImplementation(async () => ({
    from: vi.fn().mockImplementation((tableName: string) => createTableChain(tableName)),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
    },
  })),
}));

describe('ModuleProgressService.getAllProgress - derived progress override', () => {
  let service: ModuleProgressService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ModuleProgressService('test-user-id');
    tableResults = {};
  });

  it('should use derived data when no module_progress record exists', async () => {
    // No module_progress records
    tableResults['module_progress'] = { data: [], error: null };
    // But value_results exist (2 sets completed)
    tableResults['value_results'] = {
      data: [
        { value_set: 'terminal', updated_at: '2024-01-01' },
        { value_set: 'instrumental', updated_at: '2024-01-02' },
      ],
      error: null,
    };
    // Other tables empty
    tableResults['strength_discovery_results'] = { data: null, error: { code: 'PGRST116' } };
    tableResults['enneagram_sessions'] = { data: null, error: { code: 'PGRST116' } };
    tableResults['life_themes_results'] = { data: null, error: { code: 'PGRST116' } };
    tableResults['vision_statements'] = { data: null, error: { code: 'PGRST116' } };
    tableResults['swot_analyses'] = { data: null, error: { code: 'PGRST116' } };
    tableResults['goal_roles'] = { data: [], error: null };
    tableResults['errc_canvas'] = { data: null, error: { code: 'PGRST116' } };

    const progress = await service.getAllProgress();
    const valuesProgress = progress.find(p => p.moduleId === 'values');

    expect(valuesProgress).toBeDefined();
    expect(valuesProgress?.status).toBe('in_progress');
    expect(valuesProgress?.completionPercentage).toBe(67); // 2/3 sets
  });

  it('should upgrade not_started to in_progress from derived data', async () => {
    // Stale module_progress record with not_started
    tableResults['module_progress'] = {
      data: [{
        module_id: 'values',
        status: 'not_started',
        completed_at: null,
        updated_at: '2024-01-01',
        current_stage: 'terminal',
        completion_percentage: 0,
      }],
      error: null,
    };
    // But derived data shows progress
    tableResults['value_results'] = {
      data: [
        { value_set: 'terminal', updated_at: '2024-01-01' },
        { value_set: 'instrumental', updated_at: '2024-01-02' },
      ],
      error: null,
    };
    tableResults['strength_discovery_results'] = { data: null, error: { code: 'PGRST116' } };
    tableResults['enneagram_sessions'] = { data: null, error: { code: 'PGRST116' } };
    tableResults['life_themes_results'] = { data: null, error: { code: 'PGRST116' } };
    tableResults['vision_statements'] = { data: null, error: { code: 'PGRST116' } };
    tableResults['swot_analyses'] = { data: null, error: { code: 'PGRST116' } };
    tableResults['goal_roles'] = { data: [], error: null };
    tableResults['errc_canvas'] = { data: null, error: { code: 'PGRST116' } };

    const progress = await service.getAllProgress();
    const valuesProgress = progress.find(p => p.moduleId === 'values');

    expect(valuesProgress).toBeDefined();
    // Should be upgraded from not_started to in_progress
    expect(valuesProgress?.status).toBe('in_progress');
    expect(valuesProgress?.completionPercentage).toBe(67);
  });

  it('should NOT downgrade completed to in_progress', async () => {
    // module_progress says completed
    tableResults['module_progress'] = {
      data: [{
        module_id: 'values',
        status: 'completed',
        completed_at: '2024-01-03',
        updated_at: '2024-01-03',
        current_stage: 'work',
        completion_percentage: 100,
      }],
      error: null,
    };
    // derived data also shows something
    tableResults['value_results'] = {
      data: [
        { value_set: 'terminal', updated_at: '2024-01-01' },
        { value_set: 'instrumental', updated_at: '2024-01-02' },
      ],
      error: null,
    };
    tableResults['strength_discovery_results'] = { data: null, error: { code: 'PGRST116' } };
    tableResults['enneagram_sessions'] = { data: null, error: { code: 'PGRST116' } };
    tableResults['life_themes_results'] = { data: null, error: { code: 'PGRST116' } };
    tableResults['vision_statements'] = { data: null, error: { code: 'PGRST116' } };
    tableResults['swot_analyses'] = { data: null, error: { code: 'PGRST116' } };
    tableResults['goal_roles'] = { data: [], error: null };
    tableResults['errc_canvas'] = { data: null, error: { code: 'PGRST116' } };

    const progress = await service.getAllProgress();
    const valuesProgress = progress.find(p => p.moduleId === 'values');

    expect(valuesProgress).toBeDefined();
    // Should stay completed - no downgrade
    expect(valuesProgress?.status).toBe('completed');
    expect(valuesProgress?.completionPercentage).toBe(100);
  });

  it('should derive completed when all 3 value sets exist', async () => {
    tableResults['module_progress'] = { data: [], error: null };
    tableResults['value_results'] = {
      data: [
        { value_set: 'terminal', updated_at: '2024-01-01' },
        { value_set: 'instrumental', updated_at: '2024-01-02' },
        { value_set: 'work', updated_at: '2024-01-03' },
      ],
      error: null,
    };
    tableResults['strength_discovery_results'] = { data: null, error: { code: 'PGRST116' } };
    tableResults['enneagram_sessions'] = { data: null, error: { code: 'PGRST116' } };
    tableResults['life_themes_results'] = { data: null, error: { code: 'PGRST116' } };
    tableResults['vision_statements'] = { data: null, error: { code: 'PGRST116' } };
    tableResults['swot_analyses'] = { data: null, error: { code: 'PGRST116' } };
    tableResults['goal_roles'] = { data: [], error: null };
    tableResults['errc_canvas'] = { data: null, error: { code: 'PGRST116' } };

    const progress = await service.getAllProgress();
    const valuesProgress = progress.find(p => p.moduleId === 'values');

    expect(valuesProgress).toBeDefined();
    expect(valuesProgress?.status).toBe('completed');
    expect(valuesProgress?.completionPercentage).toBe(100);
  });
});
