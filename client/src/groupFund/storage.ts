import type { GroupFund } from './types';

const STORAGE_KEY = 'kharcha_group_funds';

/** Merge contribution history so a stale Group Fund snapshot cannot erase payments saved since it was loaded. */
export function mergeContributionHistory(
  updatedContributions: GroupFund['contributions'],
  latestContributions: GroupFund['contributions'],
): GroupFund['contributions'] {
  const merged = new Map<string, GroupFund['contributions'][number]>();
  for (const contribution of latestContributions) merged.set(contribution.id, contribution);
  for (const contribution of updatedContributions) {
    const latest = merged.get(contribution.id);
    if (!latest || (contribution.updatedAt ?? contribution.createdAt) >= (latest.updatedAt ?? latest.createdAt)) {
      merged.set(contribution.id, contribution);
    }
  }
  return Array.from(merged.values()).sort((a, b) => b.date - a.date);
}

export function getGroupFunds(): GroupFund[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load group funds:', err);
    return [];
  }
}

export function saveGroupFunds(funds: GroupFund[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(funds));
  } catch (err) {
    console.error('Failed to save group funds:', err);
  }
}

export function getGroupFundById(id: string): GroupFund | undefined {
  return getGroupFunds().find(f => f.id === id);
}

export function saveGroupFund(fund: GroupFund): void {
  const funds = getGroupFunds();
  const index = funds.findIndex(f => f.id === fund.id);
  const updated = { ...fund, updatedAt: Date.now() };
  if (index >= 0) {
    funds[index] = updated;
  } else {
    funds.unshift(updated);
  }
  saveGroupFunds(funds);
}

export function deleteGroupFund(id: string): void {
  const funds = getGroupFunds().filter(f => f.id !== id);
  saveGroupFunds(funds);
}
