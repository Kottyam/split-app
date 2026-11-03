import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { GroupFund } from '@/groupFund/types';
import { buildShortShareUrl } from './origin';

export interface SharedFundSnapshot {
  name: string;
  purpose: string;
  description: string;
  upiId: string;
  startingBalance: number;
  targetAmount: number;
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
  for (const c of fund.contributions || []) if (c.status === 'Paid') paid.set(c.memberId, (paid.get(c.memberId) || 0) + c.amount);
  const members = (fund.members || []).map(m => [m.name, r2(paid.get(m.id) || 0), m.isActive === false ? 0 : 1]);
  const expenses = (fund.expenses || []).filter(e => e.status !== 'cancelled').map(e => [e.name, r2(e.amount), Math.floor((e.date || 0) / DAY) - base]);
  const purpose = fund.purpose === 'Other' && fund.customPurpose ? fund.customPurpose : fund.purpose;
  const payload = [1, fund.name, purpose || '', fund.description || '', fund.paymentConfig?.upiId?.trim() || '', r2(fund.startingBalance || 0), r2(fund.targetAmount || 0), base, members, expenses];
  return compressToEncodedURIComponent(JSON.stringify(payload));
}

export function decodeFundSnapshot(encoded: string): SharedFundSnapshot | null {
  try {
    const raw = JSON.parse(decompressFromEncodedURIComponent(encoded) || 'null');
    if (!Array.isArray(raw) || raw[0] !== 1) return null;
    const [, name, purpose, description, upiId, startingBalance, targetAmount, base, members, expenses] = raw;
    return {
      name: String(name || ''), purpose: String(purpose || ''), description: String(description || ''), upiId: String(upiId || ''),
      startingBalance: Number(startingBalance) || 0, targetAmount: Number(targetAmount) || 0, createdAt: (Number(base) || 0) * DAY,
      members: (Array.isArray(members) ? members : []).map((m: any[]) => ({ name: String(m[0] || ''), paid: Number(m[1]) || 0, active: m[2] !== 0 })),
      expenses: (Array.isArray(expenses) ? expenses : []).map((e: any[]) => ({ name: String(e[0] || ''), amount: Number(e[1]) || 0, date: ((Number(base) || 0) + (Number(e[2]) || 0)) * DAY })),
    };
  } catch { return null; }
}

export function generateFundShareLink(fund: GroupFund): string {
  return buildShortShareUrl('f', encodeFundSnapshot(fund));
}
