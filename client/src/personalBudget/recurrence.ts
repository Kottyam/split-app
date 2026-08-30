import type { BudgetExpense, Frequency, PersonalBudgetProfile } from './types';

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function weekKey(date: Date): string {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const mondayOffset = (day.getDay() + 6) % 7;
  day.setDate(day.getDate() - mondayOffset);
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
}

export function cycleKeyFor(frequency: Frequency, date: Date): string {
  if (frequency === 'Weekly') return `week:${weekKey(date)}`;
  if (frequency === 'Daily') return `day:${date.toISOString().slice(0, 10)}`;
  return `month:${monthKey(date)}`;
}

export function cycleDateFor(frequency: Frequency, date: Date): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (frequency === 'Weekly') {
    const mondayOffset = (next.getDay() + 6) % 7;
    next.setDate(next.getDate() - mondayOffset);
  } else if (frequency === 'Monthly') {
    next.setDate(1);
  }
  return next;
}

export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function monthlyBudgetAmount(expense: BudgetExpense, date = new Date()): number {
  if (!expense.isRecurring) return expense.amount;
  if (expense.frequency === 'Daily') return expense.amount * daysInMonth(date);
  if (expense.frequency === 'Weekly') return expense.amount;
  if (expense.frequency === 'Quarterly') return expense.amount / 3;
  if (expense.frequency === 'Yearly') return expense.amount / 12;
  return expense.amount;
}

export function isInCycle(expense: BudgetExpense, date = new Date()): boolean {
  const targetMonth = monthKey(date);
  return monthKey(new Date(expense.createdAt)) === targetMonth;
}

export function materializeRecurringExpenses(profile: PersonalBudgetProfile): PersonalBudgetProfile {
  return profile;
}

export function normalizeRecurringExpense(expense: BudgetExpense): BudgetExpense {
  return expense;
}
