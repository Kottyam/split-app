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
