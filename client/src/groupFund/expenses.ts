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
