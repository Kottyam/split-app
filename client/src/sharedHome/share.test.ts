import { describe, expect, it } from 'vitest';
import { createSharedHomeSnapshot, decodeSharedHomeSnapshot, encodeSharedHomeSnapshot } from './share';
import type { SharedHome } from './types';

function home(): SharedHome {
  const now = Date.now();
  const first = `shared-home-member-a`;
  const second = `shared-home-member-b`;
  return {
    id: 'home-1', type: 'shared_home', name: 'Kochi Flat', homeType: 'flat', startDate: now - 86_400_000 * 10, managerMemberId: first,
    members: [
      { id: first, name: 'Asha', mobileNumber: '9000000001', moveInDate: now - 86_400_000 * 10, isActive: true, roomAssignments: [], createdAt: now },
      { id: second, name: 'Ravi', mobileNumber: '9000000002', moveInDate: now - 86_400_000 * 10, isActive: true, roomAssignments: [], createdAt: now },
    ],
    rooms: [{ id: 'room-1', name: 'Room 1', memberIds: [first, second], createdAt: now }],
    rentPeriods: [], recurringRules: [], settlements: [], months: {}, monthlyBudgets: { [new Date(now).toISOString().slice(0, 7)]: { amount: 30000, warningThreshold: 0.8, createdAt: now, updatedAt: now } }, budgetSettings: { useSameBudgetEveryMonth: true, defaultAmount: 30000, warningThreshold: 0.8, updatedAt: now }, activity: [], createdAt: now, updatedAt: now,
    expenses: [{ id: 'expense-1', kind: 'bill', name: 'Wi-Fi', category: 'Internet', amount: 1000, date: now, paidBy: first, sharedBy: [first, second], splitMethod: 'equal', shares: { [first]: 500, [second]: 500 }, status: 'active', createdAt: now, updatedAt: now }],
  };
}

describe('Shared Home sharing', () => {
  it('round-trips compact snapshots and restores member-indexed shares', () => {
    const encoded = encodeSharedHomeSnapshot(createSharedHomeSnapshot(home(), 'full-group'));
    const decoded = decodeSharedHomeSnapshot(encoded);
    expect(decoded?.home.name).toBe('Kochi Flat');
    expect(decoded?.home.expenses[0]?.shares).toEqual({ 'shared-home-member-0': 500, 'shared-home-member-1': 500 });
    expect(decoded?.home.monthlyBudgets?.[new Date().toISOString().slice(0, 7)]?.amount).toBe(30000);
    expect(decoded?.home.budgetSettings?.useSameBudgetEveryMonth).toBe(true);
    expect(encoded.length).toBeLessThan(JSON.stringify(home()).length);
  });

  it('redacts mobile numbers from shared snapshots while preserving local member data', () => {
    const source = home();
    const decoded = decodeSharedHomeSnapshot(encodeSharedHomeSnapshot(createSharedHomeSnapshot(source, 'full-group')));
    expect(source.members[0]?.mobileNumber).toBe('9000000001');
    expect(decoded?.home.members[0]?.mobileNumber).toBe('');
    expect(decoded?.home.members[1]?.mobileNumber).toBe('');
  });

  it('filters a current-month snapshot to the current month while preserving view-only data', () => {
    const decoded = decodeSharedHomeSnapshot(encodeSharedHomeSnapshot(createSharedHomeSnapshot(home(), 'current-month')));
    expect(decoded?.type).toBe('shared_home');
    expect(decoded?.home.expenses).toHaveLength(1);
  });
});
