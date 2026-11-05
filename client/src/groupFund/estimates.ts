import type { FundEstimate } from './types';

export const ESTIMATE_CATEGORIES = ['Travel', 'Stay', 'Food', 'Tickets', 'Shopping', 'Other'] as const;

const r2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

export interface EstimateSummary {
  totalEstimated: number;
  collected: number;
  expenses: number;
  budget?: number;
  /** Still to collect to cover the estimate (0 when collected >= estimate). */
  toCollect: number;
  /** Estimate left after actual spend (negative = spent beyond estimate). */
  remainingEstimate: number;
  perMember: number;
  byCategory: { category: string; amount: number }[];
  /** Estimate total minus budget (positive = estimate exceeds budget). */
  overBudgetBy: number;
}

export function validateEstimateInput(name: string, amount: string | number): { ok: true; name: string; amount: number } | { ok: false; field: 'name' | 'amount' } {
  const trimmed = String(name || '').trim();
  if (!trimmed) return { ok: false, field: 'name' };
  const n = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (!Number.isFinite(n) || n <= 0) return { ok: false, field: 'amount' };
  return { ok: true, name: trimmed, amount: r2(n) };
}

export function computeEstimateSummary(estimates: FundEstimate[] | undefined, collected: number, expenses: number, activeMembers: number, budget?: number): EstimateSummary | null {
  const list = (estimates || []).filter(e => Number(e.amount) > 0);
  if (list.length === 0) return null;
  const totalEstimated = r2(list.reduce((s, e) => s + Number(e.amount), 0));
  const cats = new Map<string, number>();
  for (const e of list) {
    const c = e.category?.trim() || 'Other';
    cats.set(c, r2((cats.get(c) || 0) + Number(e.amount)));
  }
  const c = Math.max(0, Number(collected) || 0);
  const x = Math.max(0, Number(expenses) || 0);
  const b = Number(budget) > 0 ? Number(budget) : undefined;
  return {
    totalEstimated,
    collected: r2(c),
    expenses: r2(x),
    budget: b,
    toCollect: r2(Math.max(0, totalEstimated - c)),
    remainingEstimate: r2(totalEstimated - x),
    perMember: activeMembers > 0 ? Math.ceil((totalEstimated / activeMembers) * 100) / 100 : 0,
    byCategory: Array.from(cats, ([category, amount]) => ({ category, amount })).sort((a, b2) => b2.amount - a.amount),
    overBudgetBy: b ? r2(Math.max(0, totalEstimated - b)) : 0,
  };
}

