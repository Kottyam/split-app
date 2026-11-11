import { toLocalDateKey } from './localDate';

/**
 * View-only search + filter helpers for expense lists (Trips and Group Funds).
 * These never mutate data and are not used for balances, totals elsewhere, or PDFs.
 * Dates are compared as local calendar days (yyyy-mm-dd in the device time zone).
 */

export interface ExpenseFilterState {
  /** Free-text query; every whitespace-separated word must match some field. */
  query: string;
  /** Category value, or '' for all categories. */
  category: string;
  /** Inclusive local start day, yyyy-mm-dd, or ''. */
  from: string;
  /** Inclusive local end day, yyyy-mm-dd, or ''. */
  to: string;
}

export const EMPTY_EXPENSE_FILTERS: ExpenseFilterState = { query: '', category: '', from: '', to: '' };

export type DatePreset = 'today' | 'last7' | 'thisMonth' | 'lastMonth';

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

const normalize = (value: string) => value.toLocaleLowerCase().replace(/[₹,]/g, '').trim();

export function hasActiveExpenseFilters(filters: ExpenseFilterState): boolean {
  return Boolean(filters.query.trim() || filters.category || filters.from || filters.to);
}

/** Number of active filter groups (text, category, date range) for a compact badge. */
export function countActiveExpenseFilters(filters: ExpenseFilterState): number {
  return (filters.query.trim() ? 1 : 0) + (filters.category ? 1 : 0) + (filters.from || filters.to ? 1 : 0);
}

/** Text forms of an amount a user might type: 1500, 1500.5, 1500.50. */
function amountForms(amount: number | undefined): string[] {
  if (amount === undefined || amount === null || !Number.isFinite(Number(amount))) return [];
  const n = Number(amount);
  return Array.from(new Set([String(n), n.toFixed(2)]));
}

/**
 * True when every word of the query appears in at least one of the text fields or amount forms.
 * Case-insensitive; ₹ and thousands separators in the query are ignored.
 */
export function matchesExpenseQuery(query: string, fields: Array<string | undefined | null>, amount?: number): boolean {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = [...fields.filter((f): f is string => typeof f === 'string' && f.length > 0).map(normalize), ...amountForms(amount)];
  return words.every(word => haystack.some(text => text.includes(word)));
}

/** Inclusive local-day range check. A reversed range (from after to) is treated as swapped. */
export function isWithinLocalDateRange(timestamp: number, from: string, to: string): boolean {
  let start = DATE_KEY.test(from) ? from : '';
  let end = DATE_KEY.test(to) ? to : '';
  if (!start && !end) return true;
  if (!Number.isFinite(timestamp) || timestamp <= 0) return false;
  if (start && end && start > end) [start, end] = [end, start];
  const day = toLocalDateKey(timestamp);
  if (start && day < start) return false;
  if (end && day > end) return false;
  return true;
}

/** from/to day keys for a quick preset, relative to `now` in local time. */
export function getDatePresetRange(preset: DatePreset, now: number | Date = Date.now()): { from: string; to: string } {
  const today = typeof now === 'number' ? new Date(now) : new Date(now.getTime());
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();
  switch (preset) {
    case 'today':
      return { from: toLocalDateKey(today), to: toLocalDateKey(today) };
    case 'last7':
      return { from: toLocalDateKey(new Date(y, m, d - 6, 12)), to: toLocalDateKey(today) };
    case 'thisMonth':
      return { from: toLocalDateKey(new Date(y, m, 1, 12)), to: toLocalDateKey(new Date(y, m + 1, 0, 12)) };
    case 'lastMonth':
      return { from: toLocalDateKey(new Date(y, m - 1, 1, 12)), to: toLocalDateKey(new Date(y, m, 0, 12)) };
  }
}

export function getActiveDatePreset(filters: ExpenseFilterState, now: number | Date = Date.now()): DatePreset | null {
  const presets: DatePreset[] = ['today', 'last7', 'thisMonth', 'lastMonth'];
  return presets.find(p => {
    const r = getDatePresetRange(p, now);
    return r.from === filters.from && r.to === filters.to;
  }) ?? null;
}

export interface FilterableTripExpense {
  description: string;
  remark?: string;
  amount: number;
  category: string;
  date: number;
  paidBy: string;
}

/** Trips: search description, remark, payer name and amount; category; local date range. */
export function filterTripExpenses<T extends FilterableTripExpense>(
  expenses: T[],
  filters: ExpenseFilterState,
  memberNames: ReadonlyMap<string, string> | Record<string, string> = {},
): T[] {
  const nameOf = (id: string) => (memberNames instanceof Map ? memberNames.get(id) : (memberNames as Record<string, string>)[id]);
  return expenses.filter(e =>
    (!filters.category || e.category === filters.category)
    && isWithinLocalDateRange(Number(e.date), filters.from, filters.to)
    && matchesExpenseQuery(filters.query, [e.description, e.remark, nameOf(e.paidBy)], e.amount));
}

export interface FilterableFundExpense {
  name: string;
  note?: string;
  category: string;
  amount: number;
  date?: number;
  createdAt?: number;
}

/** Group Fund date: the expense date, else when it was recorded. */
export const fundExpenseTime = (e: FilterableFundExpense) => Number(e.date || e.createdAt || 0);

/** Group Funds: search name, note, category value and amount; category; local date range (date, else createdAt). */
export function filterGroupFundExpenses<T extends FilterableFundExpense>(
  expenses: T[],
  filters: ExpenseFilterState,
  categoryLabel?: (category: string) => string,
): T[] {
  return expenses.filter(e =>
    (!filters.category || e.category === filters.category)
    && isWithinLocalDateRange(fundExpenseTime(e), filters.from, filters.to)
    && matchesExpenseQuery(filters.query, [e.name, e.note, e.category, categoryLabel?.(e.category)], e.amount));
}

export function summarizeExpenses(expenses: Array<{ amount: number }>): { count: number; total: number } {
  return { count: expenses.length, total: expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) };
}
