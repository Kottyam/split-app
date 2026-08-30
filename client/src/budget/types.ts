import type { BudgetConfig, Expense, ExpenseCategory, Trip } from '@/types';
import type { HouseholdExpense, RentPeriod, SharedHome } from '@/sharedHome/types';

export type BudgetStatus = 'no-budget' | 'under-budget' | 'near-limit' | 'exceeded';

export interface SharedHomeBudgetSettings {
  useSameBudgetEveryMonth: boolean;
  defaultAmount?: number;
  warningThreshold: number;
  updatedAt: number;
}

export interface BudgetSummary {
  configured: boolean;
  budget: number;
  spent: number;
  actualSpent: number;
  excludedSpent: number;
  remaining: number;
  overBudget: number;
  percentageUsed: number;
  warningThreshold: number;
  status: BudgetStatus;
  byCategory: Record<string, number>;
}

export interface TripBudgetInput {
  trip: Pick<Trip, 'id' | 'expenses'>;
  config?: BudgetConfig;
}

export interface SharedHomeBudgetInput {
  home: Pick<SharedHome, 'expenses' | 'rentPeriods'>;
  monthKey: string;
  config?: BudgetConfig;
}

export function createBudgetConfig(amount: number, warningThreshold = 0.8, now = Date.now()): BudgetConfig {
  return { amount, warningThreshold, createdAt: now, updatedAt: now };
}

export function calculateBudgetSummary(
  budget: number | undefined,
  spentEntries: Array<{ amount: number; category: string; includeInBudget?: boolean }>,
  warningThreshold = 0.8,
  actualEntries = spentEntries,
): BudgetSummary {
  const eligibleEntries = spentEntries.filter(entry => entry.includeInBudget !== false);
  const byCategory = eligibleEntries.reduce<Record<string, number>>((totals, entry) => {
    totals[entry.category] = (totals[entry.category] ?? 0) + entry.amount;
    return totals;
  }, {});
  const spent = eligibleEntries.reduce((total, entry) => total + Math.max(0, entry.amount), 0);
  const actualSpent = actualEntries.reduce((total, entry) => total + Math.max(0, entry.amount), 0);
  const excludedSpent = Math.max(0, actualSpent - spent);
  if (typeof budget !== 'number' || !Number.isFinite(budget) || budget <= 0) {
    return { configured: false, budget: 0, spent, actualSpent, excludedSpent, remaining: 0, overBudget: 0, percentageUsed: 0, warningThreshold, status: 'no-budget', byCategory };
  }
  const difference = budget - spent;
  const percentageUsed = (spent / budget) * 100;
  const status: BudgetStatus = difference < 0 ? 'exceeded' : percentageUsed >= warningThreshold * 100 ? 'near-limit' : 'under-budget';
  return {
    configured: true,
    budget,
    spent,
    actualSpent,
    excludedSpent,
    remaining: Math.max(0, difference),
    overBudget: Math.max(0, -difference),
    percentageUsed,
    warningThreshold,
    status,
    byCategory,
  };
}

export function getTripBudgetEntries(trip: Pick<Trip, 'id' | 'expenses'>): Array<{ amount: number; category: string }> {
  return trip.expenses
    .filter(expense => expense.tripId === trip.id && expense.status !== 'cancelled')
    .map(expense => ({ amount: expense.amount, category: expense.category }));
}

export function calculateTripBudget(trip: TripBudgetInput): BudgetSummary {
  return calculateBudgetSummary(trip.config?.amount, getTripBudgetEntries(trip.trip), trip.config?.warningThreshold ?? 0.8);
}

export function getSharedHomeBudgetEntries(home: SharedHomeBudgetInput['home'], monthKey: string): Array<{ amount: number; category: string; includeInBudget?: boolean }> {
  const expenses = home.expenses
    .filter(expense => expense.status === 'active' && (expense.billingPeriod === monthKey || (!expense.billingPeriod && monthKeyFromDate(expense.date) === monthKey)))
    .map(expense => ({ amount: expense.amount, category: expense.category || expense.kind, includeInBudget: expense.includeInBudget !== false }));
  const rentPeriod = home.rentPeriods.find(period => period.monthKey === monthKey);
  if (rentPeriod && rentPeriod.totalRent > 0 && !expenses.some(expense => expense.category === '__rent_period__')) {
    expenses.push({ amount: rentPeriod.totalRent, category: 'Rent', includeInBudget: true });
  }
  return expenses;
}

export function calculateSharedHomeBudget(input: SharedHomeBudgetInput): BudgetSummary {
  return calculateBudgetSummary(input.config?.amount, getSharedHomeBudgetEntries(input.home, input.monthKey), input.config?.warningThreshold ?? 0.8);
}

export function monthKeyFromDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function getEffectiveSharedHomeBudgetConfig(
  monthlyBudgets: Record<string, BudgetConfig> | undefined,
  settings: SharedHomeBudgetSettings | undefined,
  monthKey: string,
): BudgetConfig | undefined {
  const explicit = monthlyBudgets?.[monthKey];
  if (explicit) return explicit;
  if (!settings?.useSameBudgetEveryMonth || !settings.defaultAmount) return undefined;
  return {
    amount: settings.defaultAmount,
    warningThreshold: settings.warningThreshold,
    createdAt: settings.updatedAt,
    updatedAt: settings.updatedAt,
  };
}

export function formatBudgetPercentage(value: number): string {
  return `${value.toFixed(value % 1 === 0 ? 0 : 2)}%`;
}

export type { BudgetConfig, Expense, ExpenseCategory, HouseholdExpense, RentPeriod };
