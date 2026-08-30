import { describe, expect, it } from 'vitest';
import {
  applicableStayDays,
  applyRentAdjustment,
  calculateMonthlyBalances,
  calculateRentAllocations,
  generateHouseholdSettlements,
  splitGroceryItems,
  splitHouseholdExpense,
  validateAllocations,
  validatePercentageSplit,
  materializeRecurringExpenses,
} from './calculations';
import type { SharedHome } from './types';

const august = Date.UTC(2026, 7, 1);
const august15 = Date.UTC(2026, 7, 15);

function makeHome(): SharedHome {
  return {
    id: 'home-1',
    type: 'shared_home',
    name: 'Kochi Flatmates',
    homeType: 'flat',
    startDate: august,
    managerMemberId: 'amal',
    members: [
      { id: 'amal', name: 'Amal', mobileNumber: '9000000001', moveInDate: august, isActive: true, roomAssignments: [], createdAt: august },
      { id: 'rahul', name: 'Rahul', mobileNumber: '9000000002', moveInDate: august15, isActive: true, roomAssignments: [], createdAt: august },
    ],
    rooms: [],
    rentPeriods: [],
    expenses: [],
    recurringRules: [],
    settlements: [],
    months: {},
    activity: [],
    createdAt: august,
    updatedAt: august,
  };
}

describe('Shared Home calculations', () => {
  it('calculates calendar and fixed-30 stay days with inclusive dates', () => {
    const home = makeHome();
    expect(applicableStayDays(home.members[0], '2026-08', 'calendar')).toBe(31);
    expect(applicableStayDays(home.members[1], '2026-08', 'calendar')).toBe(17);
    expect(applicableStayDays(home.members[1], '2026-08', 'fixed30')).toBe(17);
  });

  it('subtracts overlapping pause periods from a member’s occupied days', () => {
    const home = makeHome();
    home.members[0].pausePeriods = [
      { startDate: Date.UTC(2026, 7, 10), endDate: Date.UTC(2026, 7, 15) },
      { startDate: Date.UTC(2026, 7, 14), endDate: Date.UTC(2026, 7, 18) },
    ];
    expect(applicableStayDays(home.members[0], '2026-08', 'calendar')).toBe(22);
    expect(applicableStayDays(home.members[0], '2026-08', 'fixed30')).toBe(22);
  });

  it('allocates stay-day rent transparently', () => {
    const home = makeHome();
    const result = calculateRentAllocations(home, {
      totalRent: 3100,
      startDate: august,
      frequency: 'monthly',
      splitMethod: 'stay-days',
      stayDayBasis: 'calendar',
      autoGenerate: true,
    }, '2026-08');

    expect(result.allocations.amal).toBe(2002.08);
    expect(result.allocations.rahul).toBe(1097.92);
    expect(result.calculation.find(line => line.memberId === 'rahul')?.applicableDays).toBe(17);
    expect(validateAllocations(3100, result.allocations).valid).toBe(true);
  });

  it('validates custom and percentage splits', () => {
    expect(validateAllocations(1000, { amal: 600, rahul: 400 }).valid).toBe(true);
    expect(validateAllocations(1000, { amal: 600, rahul: 300 }).valid).toBe(false);
    expect(validatePercentageSplit({ amal: 40, rahul: 30, anu: 30 })).toBe(true);
    expect(validatePercentageSplit({ amal: 40, rahul: 30 })).toBe(false);
  });

  it('splits selected household expense amounts', () => {
    expect(splitHouseholdExpense(1000, ['amal', 'rahul'], 'equal')).toEqual({ amal: 500, rahul: 500 });
    expect(splitHouseholdExpense(1000, ['amal', 'rahul'], 'percentage', { percentages: { amal: 25, rahul: 75 } })).toEqual({ amal: 250, rahul: 750 });
  });

  it('splits common grocery items and assigns personal items to one member', () => {
    expect(splitGroceryItems([
      { id: 'common', name: 'Rice', amount: 600, mode: 'common', sharedBy: ['amal', 'rahul'] },
      { id: 'personal', name: 'Snacks', amount: 120, mode: 'personal', sharedBy: ['rahul'], personalMemberId: 'rahul' },
    ], ['amal', 'rahul'])).toEqual({ amal: 300, rahul: 420 });
  });

  it('applies manual rent adjustments while preserving allocation totals', () => {
    const home = makeHome();
    const result = calculateRentAllocations(home, {
      totalRent: 3000,
      startDate: august,
      frequency: 'monthly',
      splitMethod: 'equal-person',
      stayDayBasis: 'calendar',
      autoGenerate: true,
    }, '2026-08');
    const adjusted = applyRentAdjustment(result.calculation, result.allocations, 3000, 3200);
    expect(Object.values(adjusted.allocations).reduce((sum, value) => sum + value, 0)).toBe(3200);
    expect(adjusted.calculation.every(line => typeof line.adjustedAmount === 'number')).toBe(true);
  });

  it('preserves historical recurring budget inclusion when the rule changes for future months', () => {
    const home = makeHome();
    home.recurringRules = [{ id: 'wifi-rule', name: 'Wi-Fi', kind: 'bill', category: 'Utilities', frequency: 'monthly', nextDueDate: august, autoAdd: true, amountMode: 'fixed', fixedAmount: 1000, splitMethod: 'equal', sharedBy: ['amal', 'rahul'], status: 'active', skipNext: false, includeInBudget: false, createdAt: august, updatedAt: august }];
    const augustResult = materializeRecurringExpenses(home, '2026-08');
    expect(augustResult.added[0]?.includeInBudget).toBe(false);
    const futureRuleHome = { ...augustResult.home, recurringRules: augustResult.home.recurringRules.map(rule => ({ ...rule, includeInBudget: true })) };
    const septemberResult = materializeRecurringExpenses(futureRuleHome, '2026-09');
    expect(septemberResult.added[0]?.includeInBudget).toBe(true);
    expect(septemberResult.home.expenses.find(expense => expense.billingPeriod === '2026-08')?.includeInBudget).toBe(false);
  });

  it('keeps one-person personal expenses visible but outside household balances', () => {
    const home = makeHome();
    home.expenses = [{ id: 'personal-1', kind: 'expense', name: 'Personal snacks', category: 'Food', amount: 250, date: august, paidBy: 'amal', sharedBy: ['amal'], splitMethod: 'selected', shares: { amal: 250 }, status: 'active', createdAt: august, updatedAt: august }];
    expect(calculateMonthlyBalances(home, '2026-08')).toEqual([
      { memberId: 'amal', share: 0, paid: 0, balance: 0 },
      { memberId: 'rahul', share: 0, paid: 0, balance: 0 },
    ]);
  });

  it('does not materialize recurring rules outside their optional date window', () => {
    const home = makeHome();
    home.recurringRules = [{ id: 'windowed', name: 'Windowed Wi-Fi', kind: 'bill', category: 'Wi-Fi / Internet', frequency: 'monthly', nextDueDate: august, startDate: Date.UTC(2026, 8, 1), endDate: Date.UTC(2026, 8, 30), autoAdd: true, amountMode: 'fixed', fixedAmount: 1000, splitMethod: 'equal', sharedBy: ['amal', 'rahul'], status: 'active', skipNext: false, createdAt: august, updatedAt: august }];
    expect(materializeRecurringExpenses(home, '2026-08').added).toHaveLength(0);
    expect(materializeRecurringExpenses(home, '2026-09').added).toHaveLength(1);
    expect(materializeRecurringExpenses(home, '2026-10').added).toHaveLength(0);
  });

  it('calculates balances and minimum practical settlements', () => {
    const home = makeHome();
    home.expenses = [{
      id: 'bill-1',
      kind: 'bill',
      name: 'Wi-Fi',
      category: 'wifi',
      amount: 1000,
      date: august,
      paidBy: 'amal',
      sharedBy: ['amal', 'rahul'],
      splitMethod: 'equal',
      shares: { amal: 500, rahul: 500 },
      status: 'active',
      createdAt: august,
      updatedAt: august,
    }];
    const balances = calculateMonthlyBalances(home, '2026-08');
    expect(balances).toEqual([
      { memberId: 'amal', share: 500, paid: 1000, balance: 500 },
      { memberId: 'rahul', share: 500, paid: 0, balance: -500 },
    ]);
    expect(generateHouseholdSettlements(balances)).toEqual([
      { fromMemberId: 'rahul', toMemberId: 'amal', amount: 500 },
    ]);
  });
});


describe('Shared Home rent regression cases', () => {
  it('honors custom member allocations inside each occupied room', () => {
    const home = makeHome();
    home.members.push({
      id: 'anu',
      name: 'Anu',
      mobileNumber: '9000000003',
      moveInDate: august,
      isActive: true,
      roomAssignments: [{ roomId: 'room-2', startDate: august }],
      createdAt: august,
    });
    home.members[0].roomAssignments = [{ roomId: 'room-1', startDate: august }];
    home.members[1].roomAssignments = [{ roomId: 'room-1', startDate: august }];
    home.rooms = [
      { id: 'room-1', name: 'Room 1', memberIds: ['amal', 'rahul'], createdAt: august },
      { id: 'room-2', name: 'Room 2', memberIds: ['anu'], createdAt: august },
    ];

    const result = calculateRentAllocations(home, {
      totalRent: 3000,
      startDate: august,
      frequency: 'monthly',
      splitMethod: 'room-fixed',
      stayDayBasis: 'calendar',
      autoGenerate: true,
      roomAllocations: { 'room-1': 1800, 'room-2': 1200 },
      roomMemberAllocations: { 'room-1': { amal: 1000, rahul: 800 } },
    }, '2026-08');

    expect(result.allocations).toEqual({ amal: 1000, rahul: 800, anu: 1200 });
    expect(result.calculation.find(line => line.memberId === 'amal')?.roomName).toBe('Room 1');
    expect(result.calculation.find(line => line.memberId === 'anu')?.roomName).toBe('Room 2');
    expect(validateAllocations(3000, result.allocations).valid).toBe(true);
  });

  it('keeps calendar and fixed-30 stay-day rent different when occupancy is 31 versus 30 days', () => {
    const home = makeHome();
    home.members[1].moveInDate = Date.UTC(2026, 7, 2);
    const baseConfig = {
      totalRent: 3000,
      startDate: august,
      frequency: 'monthly' as const,
      splitMethod: 'stay-days' as const,
      autoGenerate: true,
    };

    const calendar = calculateRentAllocations(home, { ...baseConfig, stayDayBasis: 'calendar' }, '2026-08');
    const fixed30 = calculateRentAllocations(home, { ...baseConfig, stayDayBasis: 'fixed30' }, '2026-08');

    expect(calendar.calculation.map(line => line.applicableDays)).toEqual([31, 30]);
    expect(fixed30.calculation.map(line => line.applicableDays)).toEqual([30, 30]);
    expect(calendar.allocations).toEqual({ amal: 1524.59, rahul: 1475.41 });
    expect(fixed30.allocations).toEqual({ amal: 1500, rahul: 1500 });
    expect(calendar.calculation.map(line => line.calculatedAmount)).toEqual([1524.59, 1475.41]);
    expect(fixed30.calculation.map(line => line.calculatedAmount)).toEqual([1500, 1500]);
  });
});
