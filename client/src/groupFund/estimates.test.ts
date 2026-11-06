import { describe, expect, it } from 'vitest';
import { computeCollectPlan, computeEstimateSummary, validateEstimateInput, validateTierInput } from './estimates';
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
  it('equal plan: estimate ÷ members, rounded up to paise', () => {
    const p = computeCollectPlan(10000, 3);
    expect(p.mode).toBe('equal');
    expect(p.perMember).toBe(3333.34);
    expect(p.totalPlanned).toBe(10000.02);
    expect(computeCollectPlan(40000, 40).perMember).toBe(1000);
    expect(computeCollectPlan(5000, 0).perMember).toBe(0);
  });
  it('tier plan: 20 @ X + 20 @ Y vs estimate', () => {
    const p = computeCollectPlan(50000, 40, { mode: 'tiers', tiers: [{ id: 'a', label: 'Adults', count: 20, amount: 1500 }, { id: 'b', count: 20, amount: 800 }] });
    expect(p.totalPlanned).toBe(46000);
    expect(p.diff).toBe(-4000);
    expect(p.plannedMembers).toBe(40);
    expect(p.unassigned).toBe(0);
    expect(p.tiers.map(t => [t.label, t.subtotal])).toEqual([['Adults', 30000], ['Rate 2', 16000]]);
  });
  it('tier plan uses picked members count and flags unassigned/over', () => {
    const p = computeCollectPlan(1000, 5, { mode: 'tiers', tiers: [{ id: 'a', count: 99, amount: 300, memberIds: ['m1', 'm2'] }] });
    expect(p.plannedMembers).toBe(2);
    expect(p.unassigned).toBe(3);
    expect(p.totalPlanned).toBe(600);
    expect(computeCollectPlan(100, 2, { mode: 'tiers', tiers: [{ id: 'a', count: 3, amount: 10 }] }).overAssigned).toBe(1);
  });
  it('validates tier input', () => {
    expect(validateTierInput('', '100')).toEqual({ ok: false, field: 'count' });
    expect(validateTierInput('2', '0')).toEqual({ ok: false, field: 'amount' });
    expect(validateTierInput('', '100', ['x', 'y'])).toEqual({ ok: true, count: 2, amount: 100 });
  });
  it('round-trips the tier plan through the share link', () => {
    const fund: any = { id: 'f', name: 'Goa', purpose: 'Trip', members: [], contributions: [], expenses: [], createdAt: 0, estimates: [est('a', 'Hotel', 6000)], collectPlan: { mode: 'tiers', tiers: [{ id: 'x', label: 'Kids', count: 4, amount: 500 }] } };
    expect(decodeFundSnapshot(encodeFundSnapshot(fund))!.collectPlan).toEqual({ mode: 'tiers', tiers: [{ id: '0', label: 'Kids', count: 4, amount: 500 }] });
    expect(decodeFundSnapshot(encodeFundSnapshot({ ...fund, collectPlan: undefined }))!.collectPlan).toBeUndefined();
  });
});
