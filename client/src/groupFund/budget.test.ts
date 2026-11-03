import { describe, expect, it } from 'vitest';
import { computeBudgetStatus, normalizeBudget } from './budget';

describe('group fund budget', () => {
  it('is hidden when no budget is set (old funds)', () => {
    expect(computeBudgetStatus(undefined, 100, 50)).toBeNull();
    expect(computeBudgetStatus(0, 100, 50)).toBeNull();
    expect(normalizeBudget('')).toBeUndefined();
    expect(normalizeBudget('1500.555')).toBe(1500.56);
  });
  it('within budget when collected covers budget and spend is under it', () => {
    const s = computeBudgetStatus(1000, 1200, 400)!;
    expect(s.state).toBe('within');
    expect(s.remaining).toBe(600);
    expect(s.spentPct).toBe(40);
    expect(s.collectedPct).toBe(100);
  });
  it('over budget shows by how much', () => {
    const s = computeBudgetStatus(1000, 1500, 1250)!;
    expect(s.state).toBe('over');
    expect(s.overBy).toBe(250);
    expect(s.remaining).toBe(-250);
  });
  it('collection short of budget', () => {
    const s = computeBudgetStatus(1000, 600, 300)!;
    expect(s.state).toBe('collection-short');
    expect(s.collectionShortBy).toBe(400);
  });
});
