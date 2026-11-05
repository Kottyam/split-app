import { describe, expect, it } from 'vitest';
import { computeEstimateSummary, validateEstimateInput } from './estimates';
import { mergeSnapshots } from '@/lib/editSync';
import { decodeFundSnapshot, encodeFundSnapshot } from '@/share/fundShare';

const est = (id: string, name: string, amount: number, category?: string) => ({ id, name, amount, category, createdAt: 1 });

describe('fund estimates', () => {
  it('returns null with no estimates', () => {
    expect(computeEstimateSummary([], 100, 50, 3)).toBeNull();
    expect(computeEstimateSummary(undefined, 100, 50, 3)).toBeNull();
  });
  it('summarises estimate vs collected vs spent', () => {
    const s = computeEstimateSummary([est('a', 'Hotel', 6000, 'Stay'), est('b', 'Bus', 1500, 'Travel'), est('c', 'Lunch', 1500, 'Food')], 4000, 2000, 3, 8000)!;
    expect(s.totalEstimated).toBe(9000);
    expect(s.toCollect).toBe(5000);
    expect(s.remainingEstimate).toBe(7000);
    expect(s.perMember).toBe(3000);
    expect(s.overBudgetBy).toBe(1000);
    expect(s.byCategory[0]).toEqual({ category: 'Stay', amount: 6000 });
  });
  it('validates input', () => {
    expect(validateEstimateInput(' ', '10')).toEqual({ ok: false, field: 'name' });
    expect(validateEstimateInput('Food', '0')).toEqual({ ok: false, field: 'amount' });
    expect(validateEstimateInput(' Food ', '12.345')).toEqual({ ok: true, name: 'Food', amount: 12.35 });
  });
  it('merges estimates added on both sides via edit-sync', () => {
    const base: any = { id: 'f', type: 'group_fund', estimates: [est('a', 'Hotel', 100)] };
    const owner = { ...base, estimates: [...base.estimates, est('b', 'Bus', 50)] };
    const edited = { ...base, estimates: [{ ...base.estimates[0], amount: 120 }, est('c', 'Food', 30)] };
    const { merged, conflicts } = mergeSnapshots(base, owner, edited);
    expect(conflicts).toEqual([]);
    expect((merged as any).estimates.map((e: any) => [e.id, e.amount]).sort()).toEqual([['a', 120], ['b', 50], ['c', 30]]);
  });
  it('round-trips estimates through the short share link', () => {
    const fund: any = { id: 'f', name: 'Goa', purpose: 'Trip', members: [], contributions: [], expenses: [], createdAt: 0, estimates: [est('a', 'Hotel', 6000, 'Stay')] };
    const snap = decodeFundSnapshot(encodeFundSnapshot(fund))!;
    expect(snap.estimates).toEqual([{ name: 'Hotel', amount: 6000, category: 'Stay' }]);
  });
});
