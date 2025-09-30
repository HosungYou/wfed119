// Type definitions for value layout - no longer dependent on Prisma
export const layoutBuckets = ['very_important', 'important', 'somewhat_important', 'not_important'] as const;
export type LayoutBucket = (typeof layoutBuckets)[number];

export type ValueSet = 'terminal' | 'instrumental' | 'work';

export type ValueLayout = Record<LayoutBucket, string[]>;

export const emptyLayout: ValueLayout = {
  very_important: [],
  important: [],
  somewhat_important: [],
  not_important: [],
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

export const isValueLayout = (value: unknown): value is ValueLayout => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<LayoutBucket, unknown>;
  return layoutBuckets.every((bucket) => isStringArray(candidate[bucket]));
};

// Updated to accept any JSON value (Supabase uses standard JSON types)
export const parseLayout = (value: unknown): ValueLayout | null =>
  isValueLayout(value) ? value : null;

export const normalizeTop3 = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
