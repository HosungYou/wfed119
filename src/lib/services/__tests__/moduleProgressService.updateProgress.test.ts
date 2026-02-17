import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModuleProgressService } from '../moduleProgressService';

// Mock the supabase-server module
const mockUpsert = vi.fn();
const mockMaybeSingle = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: vi.fn().mockImplementation(async () => ({
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
    },
  })),
}));

describe('ModuleProgressService.updateProgress', () => {
  let service: ModuleProgressService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ModuleProgressService('test-user-id');

    // Default mock chain setup
    const createMockChain = () => {
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        filter: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: mockMaybeSingle,
        upsert: mockUpsert.mockResolvedValue({ error: null }),
      };
      return chain;
    };

    mockFrom.mockImplementation(() => createMockChain());
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  });

  it('should auto-set status to in_progress when currentStage provided without status', async () => {
    // Simulate no existing record
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    await service.updateProgress('values', { currentStage: 'terminal' });

    // The upsert call should include status: 'in_progress'
    expect(mockUpsert).toHaveBeenCalled();
    const upsertArg = mockUpsert.mock.calls[0][0];
    expect(upsertArg.status).toBe('in_progress');
    expect(upsertArg.current_stage).toBe('terminal');
  });

  it('should auto-set status to in_progress when existing record is not_started', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { status: 'not_started' },
      error: null,
    });

    await service.updateProgress('values', { currentStage: 'instrumental' });

    expect(mockUpsert).toHaveBeenCalled();
    const upsertArg = mockUpsert.mock.calls[0][0];
    expect(upsertArg.status).toBe('in_progress');
  });

  it('should NOT override completed status when updating stage', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { status: 'completed' },
      error: null,
    });

    await service.updateProgress('values', { currentStage: 'work' });

    expect(mockUpsert).toHaveBeenCalled();
    const upsertArg = mockUpsert.mock.calls[0][0];
    // Should NOT have status set (preserving completed)
    expect(upsertArg.status).toBeUndefined();
  });

  it('should NOT override in_progress status when updating stage', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { status: 'in_progress' },
      error: null,
    });

    await service.updateProgress('values', { currentStage: 'instrumental' });

    expect(mockUpsert).toHaveBeenCalled();
    const upsertArg = mockUpsert.mock.calls[0][0];
    // Should NOT have status set (preserving in_progress)
    expect(upsertArg.status).toBeUndefined();
  });

  it('should pass completionPercentage when provided', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    await service.updateProgress('values', {
      currentStage: 'terminal',
      completionPercentage: 33,
    });

    expect(mockUpsert).toHaveBeenCalled();
    const upsertArg = mockUpsert.mock.calls[0][0];
    expect(upsertArg.completion_percentage).toBe(33);
  });

  it('should set completed_at and 100% when status is completed', async () => {
    // Mock all the queries that syncIntegratedProfile will make
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    await service.updateProgress('values', { status: 'completed' });

    expect(mockUpsert).toHaveBeenCalled();
    // Find the upsert call to module_progress (first call should be it)
    const upsertCalls = mockUpsert.mock.calls;
    const moduleProgressUpsert = upsertCalls.find((call: any) => call[0].module_id === 'values');

    expect(moduleProgressUpsert).toBeDefined();
    const upsertArg = moduleProgressUpsert[0];
    expect(upsertArg.status).toBe('completed');
    expect(upsertArg.completion_percentage).toBe(100);
    expect(upsertArg.completed_at).toBeDefined();
  });
});
