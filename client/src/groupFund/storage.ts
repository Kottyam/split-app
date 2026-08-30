import type { GroupFund } from './types';

const STORAGE_KEY = 'kharcha_group_funds';

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
