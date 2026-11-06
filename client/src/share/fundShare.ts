import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { GroupFund } from '@/groupFund/types';
import { isCountedTowardCollected } from '@/groupFund/collection';
import { buildShortShareUrl } from './origin';

export interface SharedFundSnapshot {
  name: string;
  purpose: string;
  description: string;
  upiId: string;
  startingBalance: number;
  targetAmount: number;
  budgetAmount?: number;
  estimates?: { name: string; amount: number; category?: string }[];
  collectPlan?: { mode: 'equal' | 'tiers'; tiers: { id: string; label?: string; count: number; amount: number }[]; plannedCount?: number };
  members: { name: string; paid: number; active: boolean }[];
  expenses: { name: string; amount: number; date: number }[];
  createdAt: number;
}

const DAY = 86400000;
const r2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

/** Compact array payload: [1, name, purpose, desc, upi, start, target, baseDay, members, expenses]. */
export function encodeFundSnapshot(fund: GroupFund): string {
  const base = Math.floor((fund.createdAt || 0) / DAY);
  const paid = new Map<string, number>();
  for (const c of fund.contributions || []) if (isCountedTowardCollected(c)) paid.set(c.memberId, (paid.get(c.memberId) || 0) + c.amount);
  const members = (fund.members || []).map(m => [m.name, r2(paid.get(m.id) || 0), m.isActive === false ? 0 : 1]);
  const expenses = (fund.expenses || []).filter(e => e.status !== 'cancelled').map(e => [e.name, r2(e.amount), Math.floor((e.date || 0) / DAY) - base]);
  const purpose = fund.purpose === 'Other' && fund.customPurpose ? fund.customPurpose : fund.purpose;
  const payload = [1, fund.name, purpose || '', fund.description || '', fund.paymentConfig?.upiId?.trim() || '', r2(fund.startingBalance || 0), r2(fund.targetAmount || 0), base, members, expenses, r2(fund.budgetAmount || 0), (fund.estimates || []).filter(e => e.amount > 0).map(e => [e.name, r2(e.amount), e.category || '']), fund.collectPlan?.mode === 'tiers' ? (fund.collectPlan.tiers || []).map(t => [t.label || '', t.count || t.memberIds?.length || 0, r2(t.amount)]) : 0, Math.max(0, Math.floor(Number(fund.collectPlan?.plannedCount) || 0))];
  return compressToEncodedURIComponent(JSON.stringify(payload));
}

export function decodeFundSnapshot(encoded: string): SharedFundSnapshot | null {
  try {
    const raw = JSON.parse(decompressFromEncodedURIComponent(encoded) || 'null');
    if (!Array.isArray(raw) || raw[0] !== 1) return null;
    const [, name, purpose, description, upiId, startingBalance, targetAmount, base, members, expenses, budgetAmount, estimates, tiers, plannedRaw] = raw;
    const plannedCount = Math.max(0, Math.floor(Number(plannedRaw) || 0));
    return {
      name: String(name || ''), purpose: String(purpose || ''), description: String(description || ''), upiId: String(upiId || ''),
      startingBalance: Number(startingBalance) || 0, targetAmount: Number(targetAmount) || 0, createdAt: (Number(base) || 0) * DAY, budgetAmount: Number(budgetAmount) > 0 ? Number(budgetAmount) : undefined,
      members: (Array.isArray(members) ? members : []).map((m: any[]) => ({ name: String(m[0] || ''), paid: Number(m[1]) || 0, active: m[2] !== 0 })),
      estimates: Array.isArray(estimates) && estimates.length ? estimates.map((e: any[]) => ({ name: String(e[0] || ''), amount: Number(e[1]) || 0, ...(e[2] ? { category: String(e[2]) } : {}) })) : undefined,
      collectPlan: Array.isArray(tiers)
        ? { mode: 'tiers' as const, tiers: tiers.map((t: any[], i: number) => ({ id: String(i), ...(t[0] ? { label: String(t[0]) } : {}), count: Number(t[1]) || 0, amount: Number(t[2]) || 0 })), ...(plannedCount ? { plannedCount } : {}) }
        : plannedCount ? { mode: 'equal' as const, tiers: [], plannedCount } : undefined,
      expenses: (Array.isArray(expenses) ? expenses : []).map((e: any[]) => ({ name: String(e[0] || ''), amount: Number(e[1]) || 0, date: ((Number(base) || 0) + (Number(e[2]) || 0)) * DAY })),
    };
  } catch { return null; }
}

export function generateFundShareLink(fund: GroupFund): string {
  return buildShortShareUrl('f', encodeFundSnapshot(fund));
}
