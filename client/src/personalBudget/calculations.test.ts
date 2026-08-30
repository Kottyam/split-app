import { describe, expect, it } from 'vitest';
import type { Budget, ExpenseTransaction, IncomeSource, IncomeTransaction } from './types';
import { actualExpensesForMonth, categoryBudgetStatus, categoryTotal, expectedIncomeForMonth, receivedIncomeForMonth, stepFiveBudgetSummary, stepFiveGuidance, goalProgress } from './calculations';

const source = (name: string, amount: number, frequency: IncomeSource['frequency'], category: IncomeSource['category'] = 'Other'): IncomeSource => ({ id: name, name, category, amount, amountType: 'Fixed', frequency, status: 'Active', includeInBudget: true });
const expense = (id: string, category: string, amount: number, status: ExpenseTransaction['status'] = 'Paid'): ExpenseTransaction => ({ id, title: id, category, amount, date: '2026-08-10', status });

describe('Personal Budget Step Two calculations', () => {
  it('calculates the acceptance expected income of ₹105,000/month', () => {
    expect(expectedIncomeForMonth([source('salary', 90000, 'Monthly', 'Salary'), source('rental', 15000, 'Monthly', 'Rental'), source('business', 0, 'Irregular', 'Business')], '2026-08')).toBe(105000);
  });

  it('keeps irregular actual income separate from expected source income', () => {
    const transactions: IncomeTransaction[] = [{ id: 'business-aug', title: 'Business', sourceId: 'business', amount: 25000, date: '2026-08-20', status: 'Received' }];
    expect(expectedIncomeForMonth([source('business', 0, 'Irregular', 'Business')], '2026-08')).toBe(0);
    expect(receivedIncomeForMonth(transactions, '2026-08')).toBe(25000);
  });

  it('calculates monthly expense and category totals only for the selected month', () => {
    const expenses = [expense('rent', 'Housing', 18000), expense('groceries', 'Food', 8000), expense('milk', 'Food', 1500), expense('fuel', 'Transport', 5000), expense('internet', 'Housing', 999), expense('medical', 'Health', 2000), { ...expense('excluded', 'Other', 2500), includeInBudget: false }, { ...expense('old', 'Food', 9999), date: '2026-07-10' }];
    expect(actualExpensesForMonth(expenses, '2026-08')).toBe(35499);
    expect(categoryTotal(expenses, '2026-08', 'Food')).toBe(9500);
    expect(categoryTotal(expenses, '2026-08', 'Other')).toBe(0);
  });

  it('reports under, near, and over category budget states with percentage', () => {
    const budget: Budget = { id: 'food-budget', month: '2026-08', category: 'Food', plannedAmount: 15000 };
    expect(categoryBudgetStatus(budget, 11000)).toEqual({ status: 'Under Budget', percentage: 73, difference: 4000 });
    expect(categoryBudgetStatus(budget, 12000).status).toBe('Near Limit');
    expect(categoryBudgetStatus(budget, 16000)).toEqual({ status: 'Over Budget', percentage: 107, difference: -1000 });
    expect(categoryBudgetStatus(undefined, 1000)).toEqual({ percentage: 0 });
  });
});


describe('Personal Finance Step Five calculations', () => {
  const profile = (expenses: ExpenseTransaction[] = [], contributions = []) => ({
    id: 'step-five-test', name: 'Test Household', budgetType: 'Household' as const, currency: 'INR', onboarded: true, selectedMonth: '2026-08',
    incomeSources: [source('salary', 100000, 'Monthly', 'Salary')], incomeTransactions: [], expenseCategories: [], expenseTransactions: expenses,
    recurringExpenseRules: [], budgets: [], householdMembers: [], goals: [{ id: 'emergency', title: 'Emergency Fund', targetAmount: 500000, currentAmount: 100000, category: 'Emergency Fund', status: 'Active' as const, monthlyAllocation: 10000, priority: 'High' as const, active: true }], goalContributions: contributions,
    updatedAt: Date.now(), expectedMonthlyIncome: 100000, familyMembers: [], expenses: [], savingsGoals: [], loans: [], annualEvents: [],
  });

  it('updates remaining discretionary cash immediately after daily expenses', () => {
    const committed: ExpenseTransaction = { ...expense('rent', 'Housing', 60000), recurringRuleId: 'rent-rule', expenseType: 'Recurring', isCommitted: true };
    const daily: ExpenseTransaction = { ...expense('food', 'Food', 500), expenseType: 'Daily' };
    const summary = stepFiveBudgetSummary(profile([committed, daily]), '2026-08', new Date('2026-08-10T12:00:00'));
    expect(summary.remainingAvailableCash).toBe(29500);
    expect(summary.dailyExpenses).toBe(500);
  });

  it('counts a weekly expense once and does not create a daily duplicate in calculations', () => {
    const weekly: ExpenseTransaction = { ...expense('groceries-week-1', 'Food', 4000), expenseType: 'Weekly', weekLabel: '2026-08-03' };
    const summary = stepFiveBudgetSummary(profile([weekly]), '2026-08', new Date('2026-08-10T12:00:00'));
    expect(summary.weeklyExpenses).toBe(4000);
    expect(summary.dailyExpenses).toBe(0);
    expect(summary.actualSpending).toBe(4000);
  });

  it('treats goal contributions as cash outflow but not normal spending', () => {
    const summary = stepFiveBudgetSummary(profile([], [{ id: 'gc-1', goalId: 'emergency', amount: 5000, date: '2026-08-10', source: 'Manual' }]), '2026-08', new Date('2026-08-10T12:00:00'));
    expect(summary.goalContributions).toBe(5000);
    expect(summary.actualSpending).toBe(0);
    expect(summary.remainingAvailableCash).toBe(85000);
  });

  it('calculates goal progress and produces a neutral goal guidance message', () => {
    const goal = profile().goals[0];
    expect(goalProgress(goal)).toEqual({ remaining: 400000, percentage: 20, requiredMonthly: 10000 });
    const summary = stepFiveBudgetSummary(profile(), '2026-08', new Date('2026-08-10T12:00:00'));
    const guidance = stepFiveGuidance(profile(), '2026-08', summary, new Date('2026-08-10T12:00:00'));
    expect(guidance.some(item => item.title === 'Goal allocation guidance')).toBe(true);
  });
});
