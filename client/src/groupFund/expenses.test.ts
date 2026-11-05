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

import { expenseMatchesPeriod } from './expenses';
describe('expenseMatchesPeriod (month filter for the Group Fund PDF)', () => {
  const at = (y: number, m: number, d: number, h = 12) => exp('x', { date: new Date(y, m, d, h).getTime(), createdAt: 1 });
  it('keeps only expenses from the selected month', () => {
    expect(expenseMatchesPeriod(at(2026, 10, 5), 'November 2026')).toBe(true);
    expect(expenseMatchesPeriod(at(2026, 9, 31, 23), 'November 2026')).toBe(false);
    expect(expenseMatchesPeriod(at(2025, 10, 5), 'November 2026')).toBe(false);
    expect(expenseMatchesPeriod(at(2026, 10, 1, 0), 'November 2026')).toBe(true);
  });
  it('falls back to createdAt when there is no date', () => {
    expect(expenseMatchesPeriod(exp('y', { date: undefined as unknown as number, createdAt: new Date(2026, 1, 3).getTime() }), 'February 2026')).toBe(true);
    expect(expenseMatchesPeriod(exp('y', { date: undefined as unknown as number, createdAt: new Date(2026, 1, 3).getTime() }), 'March 2026')).toBe(false);
  });
  it('handles yearly and daily labels and keeps all for one-time funds', () => {
    expect(expenseMatchesPeriod(at(2026, 4, 2), 'Year 2026')).toBe(true);
    expect(expenseMatchesPeriod(at(2026, 4, 2), 'Year 2025')).toBe(false);
    expect(expenseMatchesPeriod(at(2026, 10, 5), 'Nov 5, 2026')).toBe(true);
    expect(expenseMatchesPeriod(at(2026, 10, 6), 'Nov 5, 2026')).toBe(false);
    expect(expenseMatchesPeriod(at(2020, 0, 1), 'One-time')).toBe(true);
  });
});

import { sortExpensesByDate, toDateInputValue, expenseDateFromInput, expenseMatchesPeriod } from './expenses';
describe('expense dates', () => {
  it('sorts newest first and chronological', () => {
    const l = [exp('a', { date: 2 }), exp('b', { date: 3 }), exp('c', { date: 1 })];
    expect(sortExpensesByDate(l, 'desc').map(e => e.id)).toEqual(['b', 'a', 'c']);
    expect(sortExpensesByDate(l, 'asc').map(e => e.id)).toEqual(['c', 'a', 'b']);
  });
  it('falls back to createdAt when date missing', () => {
    const l = [exp('a', { date: 0 as any, createdAt: 5 }), exp('b', { date: 3 })];
    expect(sortExpensesByDate(l, 'desc').map(e => e.id)).toEqual(['a', 'b']);
  });
  it('round-trips a date input and keeps the chosen month', () => {
    const ms = expenseDateFromInput('2026-10-31', new Date(2026, 10, 5, 9).getTime())!;
    expect(toDateInputValue(ms)).toBe('2026-10-31');
    expect(expenseMatchesPeriod(exp('x', { date: ms }), 'October 2026')).toBe(true);
    expect(expenseMatchesPeriod(exp('x', { date: ms }), 'November 2026')).toBe(false);
  });
  it('uses now for today and rejects invalid input', () => {
    const now = new Date(2026, 10, 5, 9, 30).getTime();
    expect(expenseDateFromInput(toDateInputValue(now), now)).toBe(now);
    expect(expenseDateFromInput('2026-02-30')).toBeUndefined();
    expect(expenseDateFromInput('')).toBeUndefined();
  });
});
