import { describe, expect, it } from 'vitest';
import { PERSONAL_BUDGET_ENTITY_NAMES, PERSONAL_BUDGET_TAB_IDS, monthLabel, monthKey, shiftMonth } from './foundation';

describe('Personal Budget Step One foundation', () => {
  it('keeps the nine required tabs in the specified mobile order', () => {
    expect([...PERSONAL_BUDGET_TAB_IDS]).toEqual([
      'overview', 'income', 'expenses', 'recurring', 'family', 'goals', 'calendar', 'reports', 'settings',
    ]);
  });

  it('defines the scalable Step One entities without future occurrence storage', () => {
    expect([...PERSONAL_BUDGET_ENTITY_NAMES]).toEqual([
      'BudgetProfile', 'IncomeSource', 'IncomeTransaction', 'ExpenseCategory',
      'ExpenseTransaction', 'RecurringExpenseRule', 'Budget', 'HouseholdMember', 'Goal',
    ]);
    expect(PERSONAL_BUDGET_ENTITY_NAMES).not.toContain('RecurringExpenseOccurrence');
  });

  it('supports previous and next month navigation across year boundaries', () => {
    expect(monthKey(new Date('2026-08-18T12:00:00'))).toBe('2026-08');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(monthLabel('2026-08', 'en-IN')).toContain('2026');
  });
});
