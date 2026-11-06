import type { CollectPlan, CollectTier, FundEstimate } from './types';

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

export const tierMemberCount = (t: Pick<CollectTier, 'count' | 'memberIds'>) =>
  t.memberIds && t.memberIds.length ? t.memberIds.length : Math.max(0, Math.floor(Number(t.count) || 0));

export interface CollectPlanSummary {
  mode: 'equal' | 'tiers';
  activeMembers: number;
  /** Members covered by the plan (all active members in equal mode). */
  plannedMembers: number;
  /** Members not on any tier (tiers mode only). */
  unassigned: number;
  /** Over-assigned members (tiers cover more than the active count). */
  overAssigned: number;
  perMember: number;
  totalPlanned: number;
  /** totalPlanned - estimate (negative = plan collects less than the estimate). */
  diff: number;
  tiers: { id: string; label: string; members: number; amount: number; subtotal: number }[];
}

export function equalShare(total: number, members: number): number {
  return members > 0 ? Math.ceil((Number(total) / members) * 100) / 100 : 0;
}

export function computeCollectPlan(totalEstimated: number, activeMembers: number, plan?: CollectPlan): CollectPlanSummary {
  const n = Math.max(0, Math.floor(activeMembers || 0));
  const est = r2(totalEstimated);
  if (!plan || plan.mode !== 'tiers') {
    const per = equalShare(est, n);
    const total = r2(per * n);
    return { mode: 'equal', activeMembers: n, plannedMembers: n, unassigned: 0, overAssigned: 0, perMember: per, totalPlanned: total, diff: r2(total - est), tiers: [] };
  }
  const tiers = (plan.tiers || []).map((t, i) => {
    const members = tierMemberCount(t);
    const amount = r2(Math.max(0, Number(t.amount) || 0));
    return { id: t.id, label: t.label?.trim() || `Rate ${i + 1}`, members, amount, subtotal: r2(members * amount) };
  });
  const planned = tiers.reduce((s, t) => s + t.members, 0);
  const totalPlanned = r2(tiers.reduce((s, t) => s + t.subtotal, 0));
  return {
    mode: 'tiers', activeMembers: n, plannedMembers: planned,
    unassigned: Math.max(0, n - planned), overAssigned: Math.max(0, planned - n),
    perMember: planned > 0 ? r2(totalPlanned / planned) : 0,
    totalPlanned, diff: r2(totalPlanned - est), tiers,
  };
}

export function validateTierInput(count: string | number, amount: string | number, memberIds?: string[]): { ok: true; count: number; amount: number } | { ok: false; field: 'count' | 'amount' } {
  const c = memberIds && memberIds.length ? memberIds.length : Math.floor(Number(count));
  if (!Number.isFinite(c) || c <= 0) return { ok: false, field: 'count' };
  const a = Number(amount);
  if (!Number.isFinite(a) || a <= 0) return { ok: false, field: 'amount' };
  return { ok: true, count: c, amount: r2(a) };
}
