import type { GroupFundExpense } from './types';

/** Two saves of the same expense this close together are an accidental double tap, not two expenses. */
const DOUBLE_SUBMIT_WINDOW_MS = 3000;

const signature = (e: GroupFundExpense) => JSON.stringify([e.name?.trim().toLowerCase(), e.category, Number(e.amount), (e.note ?? '').trim()]);

/**
 * Active (not cancelled) expenses, each listed once. Removes repeated entries with the same id
 * (left behind by merges/syncs) and accidental double-submits (identical expense saved within a
 * few seconds). Used for the in-app list, totals and the PDF so they always agree.
 */
export function getActiveFundExpenses(expenses: GroupFundExpense[] | undefined): GroupFundExpense[] {
  const seenIds = new Set<string>();
  const lastBySignature = new Map<string, number[]>();
  const out: GroupFundExpense[] = [];
  for (const e of expenses ?? []) {
    if (!e || e.status === 'cancelled') continue;
    if (e.id && seenIds.has(e.id)) continue;
    const sig = signature(e);
    const created = Number(e.createdAt ?? e.date ?? 0);
    const times = lastBySignature.get(sig) ?? [];
    if (created && times.some(t => Math.abs(t - created) <= DOUBLE_SUBMIT_WINDOW_MS)) continue;
    if (e.id) seenIds.add(e.id);
    lastBySignature.set(sig, [...times, created]);
    out.push(e);
  }
  return out;
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/**
 * Whether an expense belongs to a collection period label. Uses the expense date (falls back to
 * createdAt) in the device's local time. Monthly ("November 2026"), yearly ("Year 2026") and daily
 * ("Nov 5, 2026") labels are matched; one-time and other cycle labels keep every expense.
 */
export function expenseMatchesPeriod(expense: GroupFundExpense, period: string): boolean {
  const when = Number(expense.date || expense.createdAt);
  if (!period || !Number.isFinite(when) || when <= 0) return true;
  const d = new Date(when);
  const label = period.trim();
  const month = /^([A-Za-z]+) (\d{4})$/.exec(label);
  if (month && MONTHS.includes(month[1].toLowerCase())) return d.getMonth() === MONTHS.indexOf(month[1].toLowerCase()) && d.getFullYear() === Number(month[2]);
  const year = /^Year (\d{4})$/.exec(label);
  if (year) return d.getFullYear() === Number(year[1]);
  const day = /^([A-Za-z]{3}) (\d{1,2}), (\d{4})$/.exec(label);
  if (day) { const m = MONTHS.findIndex(x => x.startsWith(day[1].toLowerCase())); if (m >= 0) return d.getFullYear() === Number(day[3]) && d.getMonth() === m && d.getDate() === Number(day[2]); }
  return true;
}

const expenseTime = (e: GroupFundExpense) => {
  const n = Number(e.date || e.createdAt);
  return Number.isFinite(n) ? n : 0;
};

/** Expenses sorted by their date ('desc' = newest first for the list, 'asc' = chronological for the PDF). Stable for equal dates. */
export function sortExpensesByDate(expenses: GroupFundExpense[], order: 'asc' | 'desc' = 'desc'): GroupFundExpense[] {
  return expenses
    .map((e, i) => ({ e, i }))
    .sort((a, b) => (order === 'asc' ? expenseTime(a.e) - expenseTime(b.e) : expenseTime(b.e) - expenseTime(a.e)) || a.i - b.i)
    .map(x => x.e);
}

/** yyyy-mm-dd for a date input, in the device's local time. */
export function toDateInputValue(ms: number = Date.now()): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Timestamp for a yyyy-mm-dd date input. Today keeps the current time; other days use local noon so
 * the expense stays on the chosen day/month in any timezone. Invalid input returns undefined.
 */
export function expenseDateFromInput(value: string, now: number = Date.now()): number | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!m) return undefined;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
  if (d.getMonth() !== Number(m[2]) - 1) return undefined;
  if (toDateInputValue(now) === value) return now;
  return d.getTime();
}
