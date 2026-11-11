import { describe, expect, it } from 'vitest';
import {
  EMPTY_EXPENSE_FILTERS,
  countActiveExpenseFilters,
  filterGroupFundExpenses,
  filterTripExpenses,
  getActiveDatePreset,
  getDatePresetRange,
  hasActiveExpenseFilters,
  isWithinLocalDateRange,
  matchesExpenseQuery,
  summarizeExpenses,
} from './expenseFilters';

const local = (y: number, m: number, d: number, h = 12, min = 0, s = 0, ms = 0) => new Date(y, m - 1, d, h, min, s, ms).getTime();
const f = (patch: Partial<typeof EMPTY_EXPENSE_FILTERS>) => ({ ...EMPTY_EXPENSE_FILTERS, ...patch });

describe('matchesExpenseQuery', () => {
  it('matches every word case-insensitively across fields', () => {
    expect(matchesExpenseQuery('', ['Dinner'])).toBe(true);
    expect(matchesExpenseQuery('din', ['Dinner'])).toBe(true);
    expect(matchesExpenseQuery('DINNER anu', ['Dinner at beach', undefined, 'Anu'])).toBe(true);
    expect(matchesExpenseQuery('dinner ravi', ['Dinner at beach', 'Anu'])).toBe(false);
  });

  it('matches amounts with or without ₹, commas and decimals', () => {
    expect(matchesExpenseQuery('1500', ['Hotel'], 1500)).toBe(true);
    expect(matchesExpenseQuery('₹1,500', ['Hotel'], 1500)).toBe(true);
    expect(matchesExpenseQuery('1500.00', ['Hotel'], 1500)).toBe(true);
    expect(matchesExpenseQuery('250.5', ['Tea'], 250.5)).toBe(true);
    expect(matchesExpenseQuery('999', ['Hotel'], 1500)).toBe(false);
  });

  it('works with Indian-language text', () => {
    expect(matchesExpenseQuery('ഭക്ഷണം', ['രാത്രി ഭക്ഷണം'])).toBe(true);
    expect(matchesExpenseQuery('खाना', ['रात का खाना'])).toBe(true);
  });
});

describe('isWithinLocalDateRange (local calendar days, current TZ)', () => {
  it('is inclusive at both day boundaries', () => {
    expect(isWithinLocalDateRange(local(2026, 11, 1, 0, 0, 0, 0), '2026-11-01', '2026-11-30')).toBe(true);
    expect(isWithinLocalDateRange(local(2026, 11, 30, 23, 59, 59, 999), '2026-11-01', '2026-11-30')).toBe(true);
    expect(isWithinLocalDateRange(local(2026, 10, 31, 23, 59, 59, 999), '2026-11-01', '2026-11-30')).toBe(false);
    expect(isWithinLocalDateRange(local(2026, 12, 1, 0, 0, 0, 0), '2026-11-01', '2026-11-30')).toBe(false);
  });

  it('supports open-ended ranges and swaps a reversed range', () => {
    expect(isWithinLocalDateRange(local(2026, 1, 1), '', '')).toBe(true);
    expect(isWithinLocalDateRange(local(2026, 11, 5), '2026-11-05', '')).toBe(true);
    expect(isWithinLocalDateRange(local(2026, 11, 4, 23, 59), '2026-11-05', '')).toBe(false);
    expect(isWithinLocalDateRange(local(2026, 11, 5, 23, 59), '', '2026-11-05')).toBe(true);
    expect(isWithinLocalDateRange(local(2026, 11, 6, 0, 0), '', '2026-11-05')).toBe(false);
    expect(isWithinLocalDateRange(local(2026, 11, 10), '2026-11-30', '2026-11-01')).toBe(true);
  });

  it('excludes missing dates only when a range is set', () => {
    expect(isWithinLocalDateRange(0, '2026-11-01', '')).toBe(false);
    expect(isWithinLocalDateRange(0, '', '')).toBe(true);
  });

  it('uses the device day, not the UTC day, for early-morning IST expenses', () => {
    // 2026-10-31T20:00Z is 01:30 on Nov 1 in Asia/Kolkata but still Oct 31 in UTC.
    const ts = Date.parse('2026-10-31T20:00:00Z');
    const offset = new Date(ts).getTimezoneOffset();
    if (offset === -330) {
      expect(isWithinLocalDateRange(ts, '2026-11-01', '2026-11-01')).toBe(true);
      expect(isWithinLocalDateRange(ts, '2026-10-31', '2026-10-31')).toBe(false);
    } else if (offset === 0) {
      expect(isWithinLocalDateRange(ts, '2026-10-31', '2026-10-31')).toBe(true);
      expect(isWithinLocalDateRange(ts, '2026-11-01', '2026-11-01')).toBe(false);
    }
  });
});

describe('date presets', () => {
  const now = local(2026, 3, 1, 0, 30); // just after local midnight
  it('computes today, last 7 days, this month and last month in local time', () => {
    expect(getDatePresetRange('today', now)).toEqual({ from: '2026-03-01', to: '2026-03-01' });
    expect(getDatePresetRange('last7', now)).toEqual({ from: '2026-02-23', to: '2026-03-01' });
    expect(getDatePresetRange('thisMonth', now)).toEqual({ from: '2026-03-01', to: '2026-03-31' });
    expect(getDatePresetRange('lastMonth', now)).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(getDatePresetRange('lastMonth', local(2026, 1, 15))).toEqual({ from: '2025-12-01', to: '2025-12-31' });
  });

  it('recognises the active preset', () => {
    expect(getActiveDatePreset(f(getDatePresetRange('thisMonth', now)), now)).toBe('thisMonth');
    expect(getActiveDatePreset(f({ from: '2026-03-02', to: '2026-03-05' }), now)).toBeNull();
  });
});

describe('filterTripExpenses', () => {
  const names = new Map([['m1', 'Anu'], ['m2', 'Ravi']]);
  const expenses = [
    { id: 'a', description: 'Dinner', remark: 'beach shack', amount: 1200, category: 'food', date: local(2026, 11, 1, 0, 5), paidBy: 'm1' },
    { id: 'b', description: 'Taxi', amount: 450, category: 'transport', date: local(2026, 11, 2, 23, 55), paidBy: 'm2' },
    { id: 'c', description: 'Hotel', amount: 5000, category: 'hotel', date: local(2026, 10, 31, 23, 59), paidBy: 'm1' },
  ];

  it('returns everything with no filters, without mutating input', () => {
    const copy = JSON.stringify(expenses);
    expect(filterTripExpenses(expenses, EMPTY_EXPENSE_FILTERS, names)).toHaveLength(3);
    expect(JSON.stringify(expenses)).toBe(copy);
  });

  it('searches description, remark, payer name and amount', () => {
    expect(filterTripExpenses(expenses, f({ query: 'shack' }), names).map(e => e.id)).toEqual(['a']);
    expect(filterTripExpenses(expenses, f({ query: 'ravi' }), names).map(e => e.id)).toEqual(['b']);
    expect(filterTripExpenses(expenses, f({ query: '5000' }), names).map(e => e.id)).toEqual(['c']);
    expect(filterTripExpenses(expenses, f({ query: 'anu' }), { m1: 'Anu' }).map(e => e.id)).toEqual(['a', 'c']);
  });

  it('combines category and date range', () => {
    expect(filterTripExpenses(expenses, f({ from: '2026-11-01', to: '2026-11-02' }), names).map(e => e.id)).toEqual(['a', 'b']);
    expect(filterTripExpenses(expenses, f({ category: 'food', from: '2026-11-01' }), names).map(e => e.id)).toEqual(['a']);
    expect(filterTripExpenses(expenses, f({ category: 'hotel', from: '2026-11-01' }), names)).toEqual([]);
  });
});

describe('filterGroupFundExpenses', () => {
  const expenses = [
    { id: '1', name: 'Snacks', note: 'Diwali', category: 'Food', amount: 300, date: local(2026, 11, 1, 0, 0), createdAt: local(2026, 11, 3) },
    { id: '2', name: 'Cricket bat', category: 'Equipment', amount: 2500, date: 0, createdAt: local(2026, 11, 30, 23, 59, 59) },
    { id: '3', name: 'Fan repair', category: 'Maintenance', amount: 800, date: local(2026, 10, 15), createdAt: local(2026, 10, 15) },
  ];
  const label = (c: string) => ({ Food: 'Food & Snacks', Equipment: 'Equipment' } as Record<string, string>)[c] ?? c;

  it('uses expense date, falling back to createdAt', () => {
    expect(filterGroupFundExpenses(expenses, f({ from: '2026-11-01', to: '2026-11-01' })).map(e => e.id)).toEqual(['1']);
    expect(filterGroupFundExpenses(expenses, f({ from: '2026-11-30', to: '2026-11-30' })).map(e => e.id)).toEqual(['2']);
    expect(filterGroupFundExpenses(expenses, f(getDatePresetRange('thisMonth', local(2026, 11, 11)))).map(e => e.id)).toEqual(['1', '2']);
  });

  it('searches name, note, category (value and label) and amount, and filters by category', () => {
    expect(filterGroupFundExpenses(expenses, f({ query: 'diwali' })).map(e => e.id)).toEqual(['1']);
    expect(filterGroupFundExpenses(expenses, f({ query: 'snacks' }), label).map(e => e.id)).toEqual(['1']);
    expect(filterGroupFundExpenses(expenses, f({ query: '2,500' })).map(e => e.id)).toEqual(['2']);
    expect(filterGroupFundExpenses(expenses, f({ category: 'Maintenance' })).map(e => e.id)).toEqual(['3']);
  });
});

describe('summary helpers', () => {
  it('counts, totals and reports active filters', () => {
    expect(summarizeExpenses([{ amount: 100 }, { amount: 250.5 }])).toEqual({ count: 2, total: 350.5 });
    expect(summarizeExpenses([])).toEqual({ count: 0, total: 0 });
    expect(hasActiveExpenseFilters(EMPTY_EXPENSE_FILTERS)).toBe(false);
    expect(hasActiveExpenseFilters(f({ query: '  ' }))).toBe(false);
    expect(hasActiveExpenseFilters(f({ to: '2026-11-01' }))).toBe(true);
    expect(countActiveExpenseFilters(f({ query: 'x', category: 'food', from: '2026-11-01', to: '2026-11-02' }))).toBe(3);
  });
});

describe('Group Fund category filter options', async () => {
  const { fundExpenseCategoryOptions } = await import('@/groupFund/expenseCategoryOptions');
  it('lists built-in categories first and appends custom ones once', () => {
    const t = (k: string) => `T:${k}`;
    const opts = fundExpenseCategoryOptions(t, [{ category: 'Food' }, { category: 'Decor' }, { category: 'Decor' }, { category: '' }]);
    expect(opts.map(o => o.value)).toEqual(['Food', 'Equipment', 'Maintenance', 'Event', 'Utility', 'Other', 'Decor']);
    expect(opts[0].label).toBe('T:auditFoodSnacks');
    expect(opts[6].label).toBe('Decor');
  });
});
