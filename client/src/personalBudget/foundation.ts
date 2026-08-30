export const PERSONAL_BUDGET_TAB_IDS = [
  'overview',
  'income',
  'expenses',
  'recurring',
  'family',
  'goals',
  'calendar',
  'reports',
  'settings',
] as const;

export const PERSONAL_BUDGET_ENTITY_NAMES = [
  'BudgetProfile',
  'IncomeSource',
  'IncomeTransaction',
  'ExpenseCategory',
  'ExpenseTransaction',
  'RecurringExpenseRule',
  'Budget',
  'HouseholdMember',
  'Goal',
] as const;

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function shiftMonth(month: string, offset: number): string {
  const date = new Date(`${month}-01T12:00:00`);
  date.setMonth(date.getMonth() + offset);
  return monthKey(date);
}

export function monthLabel(month: string, locale = 'en-IN'): string {
  const date = new Date(`${month}-01T12:00:00`);
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}
