import { describe, expect, it } from 'vitest';
import type { BudgetProfile, RecurringExpenseRule } from './types';
import { materializeRecurringCycles } from './recurrenceEngine';

const baseProfile = (rules: RecurringExpenseRule[], expenseTransactions = []): BudgetProfile => ({
  id: 'test-profile', name: 'Test', budgetType: 'Household', currency: 'INR', onboarded: true, selectedMonth: '2026-08',
  incomeSources: [], incomeTransactions: [], expenseCategories: [], expenseTransactions, recurringExpenseRules: rules,
  budgets: [], householdMembers: [], goals: [], updatedAt: 0, expectedMonthlyIncome: 0, familyMembers: [], expenses: [], savingsGoals: [], loans: [], annualEvents: [],
});

const rule = (frequency: RecurringExpenseRule['frequency'], overrides: Partial<RecurringExpenseRule> = {}): RecurringExpenseRule => ({
  id: `rule-${frequency.toLowerCase()}`, title: `${frequency} groceries`, category: 'Food', subcategory: 'Groceries', amount: 100, frequency,
  startDate: '2026-08-01', amountType: 'Fixed', status: 'Active', paymentMethod: 'UPI', personId: 'Self', includeInBudget: true, ...overrides,
});

describe('Personal Budget recurring expense engine', () => {
  it('materializes daily entries for every eligible day', () => {
    const generated = materializeRecurringCycles(baseProfile([rule('Daily')]), '2026-08');
    expect(generated).toHaveLength(31);
    expect(generated[0]).toMatchObject({ id: 'rec_rule-daily_2026-08-01', status: 'Planned', includeInBudget: true });
    expect(generated[30].date).toBe('2026-08-31');
  });

  it('materializes weekly entries every seven days from the month start', () => {
    const generated = materializeRecurringCycles(baseProfile([rule('Weekly')]), '2026-08');
    expect(generated.map(item => item.date)).toEqual(['2026-08-01', '2026-08-08', '2026-08-15', '2026-08-22', '2026-08-29']);
  });

  it('materializes one monthly entry and respects start/end bounds', () => {
    expect(materializeRecurringCycles(baseProfile([rule('Monthly')]), '2026-08')).toHaveLength(1);
    expect(materializeRecurringCycles(baseProfile([rule('Monthly', { startDate: '2026-09-01' })]), '2026-08')).toHaveLength(0);
    expect(materializeRecurringCycles(baseProfile([rule('Monthly', { endDate: '2026-07-31' })]), '2026-08')).toHaveLength(0);
  });

  it('does not create duplicates when the cycle already exists', () => {
    const existing = { id: 'rec_rule-monthly_2026-08', recurringRuleId: 'rule-monthly', title: 'Monthly groceries', category: 'Food', amount: 100, date: '2026-08-01', status: 'Paid' as const, includeInBudget: true };
    expect(materializeRecurringCycles(baseProfile([rule('Monthly')], [existing]), '2026-08')).toHaveLength(0);
  });

  it('does not materialize paused rules', () => {
    expect(materializeRecurringCycles(baseProfile([rule('Monthly', { status: 'Paused' })]), '2026-08')).toHaveLength(0);
  });
});


import { calculateMonthlyCommitment, calculateNextOccurrenceDate } from './recurrenceEngine';

describe('Step Three recurrence rules', () => {
  it('supports quarterly and yearly rules with safe month boundaries', () => {
    const quarterly = materializeRecurringCycles(baseProfile([rule('Quarterly', { dayOfMonth: 31 })]), '2026-11');
    expect(quarterly.map(item => item.date)).toEqual(['2026-11-30']);
    expect(materializeRecurringCycles(baseProfile([rule('Quarterly', { dayOfMonth: 31 })]), '2026-10')).toHaveLength(0);
    const yearly = materializeRecurringCycles(baseProfile([rule('Yearly', { monthOfYear: 2, dayOfMonth: 29 })]), '2028-02');
    expect(yearly.map(item => item.date)).toEqual(['2028-02-29']);
  });

  it('supports custom N-day intervals from the rule start date', () => {
    const generated = materializeRecurringCycles(baseProfile([rule('Custom', { intervalCount: 3 })]), '2026-08');
    expect(generated.map(item => item.date).slice(0, 4)).toEqual(['2026-08-01', '2026-08-04', '2026-08-07', '2026-08-10']);
  });

  it('honours skip ranges without losing the planned occurrence record', () => {
    const generated = materializeRecurringCycles(baseProfile([rule('Daily', { skipRanges: [{ id: 'skip', startDate: '2026-08-03', endDate: '2026-08-05' }] })]), '2026-08');
    expect(generated.find(item => item.date === '2026-08-04')).toMatchObject({ status: 'Skipped', isOccurrence: true });
    expect(generated.filter(item => item.status === 'Skipped')).toHaveLength(3);
  });

  it('honours pause windows and does not generate inactive occurrences', () => {
    const generated = materializeRecurringCycles(baseProfile([rule('Daily', { pauseWindows: [{ id: 'pause', startDate: '2026-08-10', endDate: '2026-08-12' }] })]), '2026-08');
    expect(generated.some(item => item.date === '2026-08-10')).toBe(false);
    expect(generated).toHaveLength(28);
  });

  it('deduplicates by recurring rule and date even when an old id is present', () => {
    const existing = { id: 'legacy-id', recurringRuleId: 'rule-daily', title: 'Daily groceries', category: 'Food', amount: 100, date: '2026-08-01', status: 'Paid' as const, includeInBudget: true };
    const generated = materializeRecurringCycles(baseProfile([rule('Daily')], [existing]), '2026-08');
    expect(generated).toHaveLength(30);
    expect(generated.some(item => item.date === '2026-08-01')).toBe(false);
  });

  it('returns the next active occurrence and stops for paused rules', () => {
    expect(calculateNextOccurrenceDate(rule('Monthly', { dayOfMonth: 31, startDate: '2026-01-01' }), '2026-02-01')).toBe('2026-02-28');
    expect(calculateNextOccurrenceDate(rule('Monthly', { status: 'Paused' }), '2026-08-01')).toBeNull();
  });

  it('calculates monthly commitment equivalents without rounding daily paise internally', () => {
    const result = calculateMonthlyCommitment([rule('Daily', { amount: 100 }), rule('Weekly', { amount: 700 }), rule('Yearly', { amount: 12000 })], '2026-08');
    expect(result.dailyTotal).toBe(3100);
    expect(result.yearlyProvision).toBe(1000);
    expect(result.commitment).toBeGreaterThan(5000);
  });
});


describe('Custom interval units', () => {
  it('supports every N weeks', () => {
    const generated = materializeRecurringCycles(baseProfile([rule('Custom', { intervalCount: 2, customUnit: 'weeks' })]), '2026-08');
    expect(generated.map(item => item.date)).toEqual(['2026-08-01', '2026-08-15', '2026-08-29']);
  });

  it('supports every N months with end-of-month clamping', () => {
    const generated = materializeRecurringCycles(baseProfile([rule('Custom', { intervalCount: 2, customUnit: 'months', dayOfMonth: 31, startDate: '2026-01-31' })]), '2026-03');
    expect(generated.map(item => item.date)).toEqual(['2026-03-31']);
  });

  it('supports every N years on a month/day', () => {
    const generated = materializeRecurringCycles(baseProfile([rule('Custom', { intervalCount: 2, customUnit: 'years', monthOfYear: 9, dayOfMonth: 10, startDate: '2024-09-10' })]), '2026-09');
    expect(generated.map(item => item.date)).toEqual(['2026-09-10']);
  });
});
