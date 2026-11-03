export type BudgetState = 'within' | 'over' | 'collection-short';

export interface BudgetStatus {
  budget: number;
  collected: number;
  expenses: number;
  /** Budget left to spend (negative when over budget). */
  remaining: number;
  overBy: number;
  collectionShortBy: number;
  spentPct: number;
  collectedPct: number;
  state: BudgetState;
}

/** Returns null when no (positive) budget is set, so callers can hide budget UI. */
export function normalizeBudget(value: unknown): number | undefined {
  const n = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : undefined;
}

export function computeBudgetStatus(budget: number | undefined | null, collected: number, expenses: number): BudgetStatus | null {
  const b = normalizeBudget(budget);
  if (!b) return null;
  const c = Math.max(0, Number(collected) || 0);
  const e = Math.max(0, Number(expenses) || 0);
  const overBy = Math.max(0, e - b);
  const collectionShortBy = Math.max(0, b - c);
  const state: BudgetState = overBy > 0 ? 'over' : collectionShortBy > 0 ? 'collection-short' : 'within';
  const pct = (v: number) => Math.min(100, Math.round((v / b) * 1000) / 10);
  return { budget: b, collected: c, expenses: e, remaining: b - e, overBy, collectionShortBy, spentPct: pct(e), collectedPct: pct(c), state };
}
