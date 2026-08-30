import { describe, expect, it } from 'vitest';
import { buildSharedHomeViewReport } from './SharedHomeSharedView';
import type { SharedHome } from '@/sharedHome/types';

function fixture(): SharedHome {
  const memberA = 'member-a';
  const memberB = 'member-b';
  return {
    id: 'home-1',
    type: 'shared_home',
    name: 'Green View',
    homeType: 'flat',
    startDate: Date.UTC(2026, 0, 1),
    members: [
      { id: memberA, name: 'Anu', mobileNumber: '', moveInDate: Date.UTC(2026, 0, 1), isActive: true, roomAssignments: [], createdAt: 1 },
      { id: memberB, name: 'Manu', mobileNumber: '', moveInDate: Date.UTC(2026, 0, 1), isActive: true, roomAssignments: [], createdAt: 1 },
    ],
    rooms: [],
    rentPeriods: [{ id: 'rent-1', monthKey: '2026-01', totalRent: 1000, config: { totalRent: 1000, startDate: Date.UTC(2026, 0, 1), frequency: 'monthly', splitMethod: 'equal-person', stayDayBasis: 'calendar', autoGenerate: true }, allocations: { [memberA]: 500, [memberB]: 500 }, calculation: [], createdAt: 1, updatedAt: 1 }],
    expenses: [
      { id: 'expense-in', kind: 'bill', name: 'Electricity', category: 'Electricity', amount: 200, date: Date.UTC(2026, 0, 10), paidBy: memberA, sharedBy: [memberA, memberB], splitMethod: 'equal', shares: { [memberA]: 100, [memberB]: 100 }, status: 'active', createdAt: 1, updatedAt: 1 },
      { id: 'expense-out', kind: 'grocery', name: 'Outside range', category: 'Groceries', amount: 999, date: Date.UTC(2026, 1, 10), paidBy: memberB, sharedBy: [memberA, memberB], splitMethod: 'equal', shares: { [memberA]: 499.5, [memberB]: 499.5 }, status: 'active', createdAt: 1, updatedAt: 1 },
    ],
    recurringRules: [],
    settlements: [],
    months: {},
    activity: [],
    createdAt: 1,
    updatedAt: 1,
  };
}

describe('Shared Home shared-view report', () => {
  it('honors the encoded date range and includes overlapping rent periods', () => {
    const report = buildSharedHomeViewReport(fixture(), Date.UTC(2026, 0, 1), Date.UTC(2026, 0, 31, 23, 59, 59));

    expect(report.expenses.map(expense => expense.name)).toEqual(['Electricity']);
    expect(report.totals.total).toBe(1200);
    expect(report.totals.rent).toBe(1000);
    expect(report.totals.byCategory.Rent).toBe(1000);
    expect(report.balances.find(balance => balance.memberId === 'member-a')).toMatchObject({ share: 600, paid: 200, balance: -400 });
    expect(report.settlements).toEqual([]);
  });
});
