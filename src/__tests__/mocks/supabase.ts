/**
 * Supabase Mock Factory
 * Creates chainable mock objects that mimic Supabase query builder
 */

type MockResult = { data: unknown; error: unknown };

export function createMockSupabaseClient(overrides: Record<string, MockResult> = {}) {
  const defaultResult: MockResult = { data: null, error: null };

  // Create a chainable query builder
  function createQueryBuilder(tableName: string): Record<string, unknown> {
    const result = overrides[tableName] || defaultResult;

    const builder: Record<string, (...args: unknown[]) => Record<string, unknown>> = {};
    const chainMethods = [
      'select', 'insert', 'update', 'upsert', 'delete',
      'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
      'like', 'ilike', 'is', 'in', 'contains',
      'order', 'limit', 'range', 'filter',
    ];

    for (const method of chainMethods) {
      builder[method] = (..._args: unknown[]) => builder;
    }

    // Terminal methods return the result
    builder.single = () => Promise.resolve(result) as unknown as Record<string, unknown>;
    builder.maybeSingle = () => Promise.resolve(result) as unknown as Record<string, unknown>;
    builder.then = ((resolve: (value: MockResult) => void) => resolve(result)) as unknown as (...args: unknown[]) => Record<string, unknown>;

    // Make the builder itself thenable (for await without .single())
    Object.defineProperty(builder, 'then', {
      value: (resolve: (value: MockResult) => void) => {
        resolve(result);
        return Promise.resolve(result);
      },
      configurable: true,
    });

    return builder;
  }

  return {
    from: (tableName: string) => createQueryBuilder(tableName),
    auth: {
      getUser: () => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
      getSession: () => Promise.resolve({
        data: { session: { user: { id: 'test-user-id' } } },
        error: null,
      }),
    },
  };
}

/**
 * Helper to create mock results for specific tables
 */
export function mockTableResult(data: unknown, error: unknown = null): MockResult {
  return { data, error };
}
