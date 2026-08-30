import { describe, expect, it } from 'vitest';
import { calculateSharedHomeBudget, calculateTripBudget, getEffectiveSharedHomeBudgetConfig } from './types';
import type { Expense } from '@/types';

const tripExpense = (overrides: Partial<Expense>): Expense => ({
  id: 'expense', tripId: 'trip-1', description: 'Expense', amount: 100, category: 'food', paidBy: 'member-1', date: Date.UTC(2026, 7, 10), splits: { 'member-1': 100 }, createdAt: Date.now(), ...overrides,
});

describe('budget calculations', () => {
  it('counts active Trip expenses, excludes cancelled records, and recalculates over-budget amounts', () => {
    const summary = calculateTripBudget({ trip: { id: 'trip-1', expenses: [tripExpense({ amount: 800, category: 'hotel' }), tripExpense({ id: 'cancelled', amount: 500, status: 'cancelled' })] }, config: { amount: 1000, warningThreshold: 0.8, createdAt: 1, updatedAt: 1 } });
    expect(summary.spent).toBe(800);
    expect(summary.remaining).toBe(200);
    expect(summary.overBudget).toBe(0);
    expect(summary.status).toBe('near-limit');
    const exceeded = calculateTripBudget({ trip: { id: 'trip-1', expenses: [tripExpense({ amount: 1400 })] }, config: { amount: 1000, warningThreshold: 0.8, createdAt: 1, updatedAt: 1 } });
    expect(exceeded.remaining).toBe(0);
    expect(exceeded.overBudget).toBe(400);
    expect(exceeded.status).toBe('exceeded');
  });

  it('counts only the selected Shared Home month and includes rent once', () => {
    const summary = calculateSharedHomeBudget({
      monthKey: '2026-08',
      config: { amount: 3000, warningThreshold: 0.8, createdAt: 1, updatedAt: 1 },
      home: {
        expenses: [
          { id: 'aug', kind: 'bill', name: 'Electricity', category: 'Electricity', amount: 1000, date: Date.UTC(2026, 7, 10), billingPeriod: '2026-08', paidBy: 'm1', sharedBy: ['m1'], splitMethod: 'equal', shares: { m1: 1000 }, status: 'active', createdAt: 1, updatedAt: 1 },
          { id: 'sep', kind: 'bill', name: 'Water', category: 'Water', amount: 900, date: Date.UTC(2026, 8, 10), billingPeriod: '2026-09', paidBy: 'm1', sharedBy: ['m1'], splitMethod: 'equal', shares: { m1: 900 }, status: 'active', createdAt: 1, updatedAt: 1 },
          { id: 'cancelled', kind: 'grocery', name: 'Cancelled', category: 'Grocery', amount: 500, date: Date.UTC(2026, 7, 12), billingPeriod: '2026-08', paidBy: 'm1', sharedBy: ['m1'], splitMethod: 'equal', shares: { m1: 500 }, status: 'cancelled', createdAt: 1, updatedAt: 1 },
        ],
        rentPeriods: [{ id: 'rent-aug', monthKey: '2026-08', totalRent: 1500, config: {} as never, allocations: {}, calculation: [], createdAt: 1, updatedAt: 1 }],
      },
    });
    expect(summary.spent).toBe(2500);
    expect(summary.actualSpent).toBe(2500);
    expect(summary.excludedSpent).toBe(0);
    expect(summary.remaining).toBe(500);
    expect(summary.byCategory).toEqual({ Electricity: 1000, Rent: 1500 });
  });

  it('excludes opted-out Shared Home recurring expenses from tracked spending but keeps actual spending visible', () => {
    const summary = calculateSharedHomeBudget({
      monthKey: '2026-08',
      config: { amount: 30000, warningThreshold: 0.8, createdAt: 1, updatedAt: 1 },
      home: {
        expenses: [
          { id: 'wifi', kind: 'bill', name: 'Wi-Fi', category: 'Utilities', amount: 1000, date: Date.UTC(2026, 7, 1), billingPeriod: '2026-08', recurringRuleId: 'wifi-rule', includeInBudget: true, paidBy: 'm1', sharedBy: ['m1'], splitMethod: 'equal', shares: { m1: 1000 }, status: 'active', createdAt: 1, updatedAt: 1 },
          { id: 'subscription', kind: 'expense', name: 'Personal subscription', category: 'Personal', amount: 500, date: Date.UTC(2026, 7, 2), billingPeriod: '2026-08', recurringRuleId: 'subscription-rule', includeInBudget: false, paidBy: 'm1', sharedBy: ['m1'], splitMethod: 'equal', shares: { m1: 500 }, status: 'active', createdAt: 1, updatedAt: 1 },
        ],
        rentPeriods: [],
      },
    });
    expect(summary.spent).toBe(1000);
    expect(summary.actualSpent).toBe(1500);
    expect(summary.excludedSpent).toBe(500);
    expect(summary.remaining).toBe(29000);
    expect(summary.byCategory).toEqual({ Utilities: 1000 });
  });

  it('supports a shared default monthly budget with a specific-month override', () => {
    const settings = { useSameBudgetEveryMonth: true, defaultAmount: 30000, warningThreshold: 0.8, updatedAt: 1 };
    expect(getEffectiveSharedHomeBudgetConfig(undefined, settings, '2026-09')?.amount).toBe(30000);
    expect(getEffectiveSharedHomeBudgetConfig({ '2026-09': { amount: 32000, warningThreshold: 0.8, createdAt: 1, updatedAt: 2 } }, settings, '2026-09')?.amount).toBe(32000);
  });
});
