import { describe, expect, it } from 'vitest';
import { getActiveFundExpenses } from './expenses';
import type { GroupFundExpense } from './types';

const exp = (id: string, extra: Partial<GroupFundExpense> = {}): GroupFundExpense => ({
  id, fundId: 'f1', name: 'Tea', category: 'Food', amount: 100, date: 1_000_000, status: 'active', createdAt: 1_000_000, updatedAt: 1_000_000, ...extra,
} as GroupFundExpense);

describe('getActiveFundExpenses (Group Fund list, totals and PDF)', () => {
  it('lists an expense saved twice with the same id only once', () => {
    const list = getActiveFundExpenses([exp('a'), exp('b', { name: 'Bus', amount: 500 }), exp('a')]);
    expect(list.map(e => e.id)).toEqual(['a', 'b']);
  });
  it('drops an accidental double submit of the same expense', () => {
    expect(getActiveFundExpenses([exp('a'), exp('a2', { createdAt: 1_000_900 })]).map(e => e.id)).toEqual(['a']);
  });
  it('keeps genuinely separate identical expenses added later', () => {
    expect(getActiveFundExpenses([exp('a'), exp('a2', { createdAt: 1_000_000 + 60_000 })])).toHaveLength(2);
  });
  it('skips cancelled expenses', () => {
    expect(getActiveFundExpenses([exp('a', { status: 'cancelled' }), exp('b', { name: 'Bus' })]).map(e => e.id)).toEqual(['b']);
  });
});
