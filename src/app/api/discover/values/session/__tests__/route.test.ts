import { describe, it, expect } from 'vitest';

/**
 * Unit tests for the values session completion logic
 * Testing the isCompleted() helper function behavior
 * (extracted from src/app/api/discover/values/session/route.ts)
 */

// Reproduce the isCompleted logic from the route
function isCompleted(result: { top3: unknown } | null | undefined): boolean {
  if (!result) return false;
  const top3 = result.top3;
  if (Array.isArray(top3) && top3.length >= 3) return true;
  return false;
}

describe('Values Session - isCompleted logic', () => {
  it('should return true when top3 has exactly 3 items', () => {
    expect(isCompleted({ top3: ['Family Security', 'Freedom', 'Wisdom'] })).toBe(true);
  });

  it('should return true when top3 has more than 3 items', () => {
    expect(isCompleted({ top3: ['A', 'B', 'C', 'D'] })).toBe(true);
  });

  it('should return false when top3 has fewer than 3 items', () => {
    expect(isCompleted({ top3: ['A', 'B'] })).toBe(false);
  });

  it('should return false when top3 is empty', () => {
    expect(isCompleted({ top3: [] })).toBe(false);
  });

  it('should return false when top3 is null', () => {
    expect(isCompleted({ top3: null })).toBe(false);
  });

  it('should return false when result is null', () => {
    expect(isCompleted(null)).toBe(false);
  });

  it('should return false when result is undefined', () => {
    expect(isCompleted(undefined)).toBe(false);
  });

  it('should return false when top3 is not an array', () => {
    expect(isCompleted({ top3: 'not an array' })).toBe(false);
  });
});

describe('Values Session - completion status aggregation', () => {
  // Test the aggregation logic used by the page component
  function countCompletedSets(sessionData: {
    terminal_completed: boolean;
    instrumental_completed: boolean;
    work_completed: boolean;
  }): number {
    return [
      sessionData.terminal_completed,
      sessionData.instrumental_completed,
      sessionData.work_completed,
    ].filter(Boolean).length;
  }

  function calculatePercent(completedSets: number): number {
    const effective = Math.max(completedSets, 1);
    return Math.min(100, Math.round((effective / 3) * 100));
  }

  it('should count 0 when nothing is completed', () => {
    expect(countCompletedSets({
      terminal_completed: false,
      instrumental_completed: false,
      work_completed: false,
    })).toBe(0);
  });

  it('should count 1 when one set is completed', () => {
    expect(countCompletedSets({
      terminal_completed: true,
      instrumental_completed: false,
      work_completed: false,
    })).toBe(1);
  });

  it('should count 3 when all sets are completed', () => {
    expect(countCompletedSets({
      terminal_completed: true,
      instrumental_completed: true,
      work_completed: true,
    })).toBe(3);
  });

  it('should calculate 33% for 1 completed set', () => {
    expect(calculatePercent(1)).toBe(33);
  });

  it('should calculate 67% for 2 completed sets', () => {
    expect(calculatePercent(2)).toBe(67);
  });

  it('should calculate 100% for 3 completed sets', () => {
    expect(calculatePercent(3)).toBe(100);
  });

  it('should ensure minimum 33% (effective = max(0,1))', () => {
    // Even with 0 completed, effective is 1 (current save counts)
    expect(calculatePercent(0)).toBe(33);
  });
});
