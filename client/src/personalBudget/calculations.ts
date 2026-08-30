import type { Budget, BudgetProfile, ExpenseTransaction, Goal, GoalContribution, IncomeSource, IncomeTransaction } from './types';

export function frequencyMonthlyAmount(source: IncomeSource, month: string): number {
  if (source.status !== 'Active' || source.includeInBudget === false) return 0;
  if (source.frequency === 'Monthly') return source.amount;
  if (source.frequency === 'Weekly') return source.amount * 52 / 12;
  if (source.frequency === 'Daily') {
    const date = new Date(`${month}-01T12:00:00`);
    const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return source.amount * days;
  }
  if (source.frequency === 'Quarterly') return source.amount / 3;
  if (source.frequency === 'Yearly') return source.amount / 12;
  if (source.frequency === 'One-time') return source.expectedDate?.startsWith(month) ? source.amount : 0;
  return source.expectedDate?.startsWith(month) ? source.amount : 0;
}

export function expectedIncomeForMonth(sources: IncomeSource[], month: string): number {
  return sources.reduce((total, source) => total + frequencyMonthlyAmount(source, month), 0);
}

export function receivedIncomeForMonth(transactions: IncomeTransaction[], month: string): number {
  return transactions.filter(item => item.date.startsWith(month) && (item.status === 'Received' || item.status === 'Partial')).reduce((total, item) => total + item.amount, 0);
}

export function expensesForMonth(expenses: ExpenseTransaction[], month: string): ExpenseTransaction[] {
  return expenses.filter(item => item.date.startsWith(month));
}

export function actualExpensesForMonth(expenses: ExpenseTransaction[], month: string): number {
  return expensesForMonth(expenses, month).filter(item => item.status === 'Paid' && item.includeInBudget !== false).reduce((total, item) => total + item.amount, 0);
}

export function categoryTotal(expenses: ExpenseTransaction[], month: string, category: string): number {
  return expensesForMonth(expenses, month).filter(item => item.status === 'Paid' && item.includeInBudget !== false && item.category === category).reduce((total, item) => total + item.amount, 0);
}

export type BudgetStatus = 'Under Budget' | 'Near Limit' | 'Over Budget';

export function categoryBudgetStatus(budget: Budget | undefined, actual: number): { status?: BudgetStatus; percentage: number; difference?: number } {
  if (!budget || budget.plannedAmount <= 0) return { percentage: 0 };
  const percentage = Math.round(actual / budget.plannedAmount * 100);
  const status: BudgetStatus = percentage > 100 ? 'Over Budget' : percentage >= 80 ? 'Near Limit' : 'Under Budget';
  return { status, percentage, difference: budget.plannedAmount - actual };
}

export type StepFiveBudgetSummary = {
  expectedIncome: number;
  committed: number;
  liabilityPayments: number;
  goalCommitments: number;
  variableBudget: number;
  dailyExpenses: number;
  weeklyExpenses: number;
  unexpectedExpenses: number;
  actualSpending: number;
  goalContributions: number;
  totalCashOutflow: number;
  remainingAvailableCash: number;
  safeSpendingAmount: number;
  daysRemaining: number;
  suggestedDailyLimit: number;
  todaySpending: number;
  weekSpending: number;
};

function dateParts(month: string): { year: number; monthIndex: number; days: number } {
  const [year, monthNumber] = month.split('-').map(Number);
  return { year, monthIndex: monthNumber - 1, days: new Date(year, monthNumber, 0).getDate() };
}

function sameWeek(date: string, reference: Date): boolean {
  const value = new Date(`${date}T12:00:00`);
  const start = new Date(reference);
  start.setHours(12, 0, 0, 0);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + mondayOffset);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return value >= start && value <= end;
}

export function goalRequiredMonthlyAllocation(goal: Goal, asOf = new Date()): number {
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  if (!remaining) return 0;
  if (!goal.targetDate) return goal.monthlyAllocation ?? 0;
  const target = new Date(`${goal.targetDate}T12:00:00`);
  const months = Math.max(1, (target.getFullYear() - asOf.getFullYear()) * 12 + target.getMonth() - asOf.getMonth());
  return Math.ceil(remaining / months);
}

export function totalGoalCommitments(goals: Goal[], asOf = new Date()): number {
  return goals.filter(goal => goal.status === 'Active' && goal.active !== false).reduce((sum, goal) => sum + goalRequiredMonthlyAllocation(goal, asOf), 0);
}

export function goalProgress(goal: Goal): { remaining: number; percentage: number; requiredMonthly: number } {
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const percentage = goal.targetAmount > 0 ? Math.min(100, Math.round(goal.currentAmount / goal.targetAmount * 100)) : 0;
  return { remaining, percentage, requiredMonthly: goalRequiredMonthlyAllocation(goal) };
}

export function stepFiveBudgetSummary(profile: BudgetProfile, month: string, now = new Date()): StepFiveBudgetSummary {
  const monthExpenses = expensesForMonth(profile.expenseTransactions, month).filter(item => item.status !== 'Skipped' && item.status !== 'Cancelled' && item.includeInBudget !== false);
  const paidOrPlanned = monthExpenses.reduce((sum, item) => sum + item.amount, 0);
  const recurring = monthExpenses.filter(item => item.recurringRuleId || item.expenseType === 'Recurring');
  const dailyExpenses = monthExpenses.filter(item => item.expenseType === 'Daily' || (!item.expenseType && !item.recurringRuleId && !item.weekLabel)).reduce((sum, item) => sum + item.amount, 0);
  const weeklyExpenses = monthExpenses.filter(item => item.expenseType === 'Weekly' || Boolean(item.weekLabel)).reduce((sum, item) => sum + item.amount, 0);
  const unexpectedExpenses = monthExpenses.filter(item => item.expenseType === 'OneTime').reduce((sum, item) => sum + item.amount, 0);
  const isLiability = (item: ExpenseTransaction) => item.category === 'Financial' || item.subcategory === 'EMI' || item.subcategory === 'Loan';
  const committed = recurring.filter(item => !isLiability(item) && item.isCommitted !== false).reduce((sum, item) => sum + item.amount, 0);
  const liabilityPayments = monthExpenses.filter(isLiability).reduce((sum, item) => sum + item.amount, 0);
  const goals = profile.goals ?? [];
  const goalCommitments = totalGoalCommitments(goals, now);
  const goalContributions = (profile.goalContributions ?? []).filter(item => item.date.startsWith(month)).reduce((sum, item) => sum + item.amount, 0);
  const variableBudget = (profile.budgets ?? []).filter(item => item.month === month).reduce((sum, item) => sum + item.plannedAmount, 0);
  const date = dateParts(month);
  const monthEnd = new Date(date.year, date.monthIndex, date.days);
  const isCurrentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` === month;
  const daysRemaining = isCurrentMonth ? Math.max(1, date.days - now.getDate() + 1) : date.days;
  const expectedIncome = expectedIncomeForMonth(profile.incomeSources, month);
  const totalCashOutflow = paidOrPlanned + goalContributions;
  const remainingAvailableCash = expectedIncome - committed - liabilityPayments - goalCommitments - variableBudget - dailyExpenses - weeklyExpenses - unexpectedExpenses - goalContributions;
  const safeSpendingAmount = Math.max(0, remainingAvailableCash);
  const suggestedDailyLimit = safeSpendingAmount / daysRemaining;
  const todayKey = now.toISOString().slice(0, 10);
  const todaySpending = monthExpenses.filter(item => item.date === todayKey).reduce((sum, item) => sum + item.amount, 0);
  const weekSpending = monthExpenses.filter(item => sameWeek(item.date, now)).reduce((sum, item) => sum + item.amount, 0);
  return { expectedIncome, committed, liabilityPayments, goalCommitments, variableBudget, dailyExpenses, weeklyExpenses, unexpectedExpenses, actualSpending: paidOrPlanned, goalContributions, totalCashOutflow, remainingAvailableCash, safeSpendingAmount, daysRemaining, suggestedDailyLimit, todaySpending, weekSpending };
}

export function stepFiveGuidance(profile: BudgetProfile, month: string, summary: StepFiveBudgetSummary, now = new Date()): Array<{ level: 'Information' | 'Attention' | 'Warning'; title: string; message: string; priority: number }> {
  const messages: Array<{ level: 'Information' | 'Attention' | 'Warning'; title: string; message: string; priority: number }> = [];
  if (summary.remainingAvailableCash < 0) messages.push({ level: 'Warning', title: 'Budget needs attention', message: `Committed expenses and planned allocations are ${moneyText(Math.abs(summary.remainingAvailableCash))} above expected income.`, priority: 1 });
  else if (summary.remainingAvailableCash <= summary.expectedIncome * 0.1) messages.push({ level: 'Attention', title: 'Low remaining budget', message: `${moneyText(summary.remainingAvailableCash)} is remaining for this month.`, priority: 2 });
  else messages.push({ level: 'Information', title: 'Within planned spending', message: `${moneyText(summary.remainingAvailableCash)} remains after commitments and current spending.`, priority: 6 });
  const dailyLimit = summary.suggestedDailyLimit;
  if (summary.todaySpending > dailyLimit && summary.todaySpending > 0) messages.push({ level: 'Attention', title: 'High daily spending', message: `Today's spending is ${moneyText(summary.todaySpending - dailyLimit)} above the suggested daily average.`, priority: 4 });
  const activeGoals = profile.goals.filter(goal => goal.status === 'Active' && goal.active !== false);
  const goalContributionTotal = (profile.goalContributions ?? []).filter(item => item.date.startsWith(month)).reduce((sum, item) => sum + item.amount, 0);
  const goalRequirement = activeGoals.reduce((sum, goal) => sum + goalRequiredMonthlyAllocation(goal, now), 0);
  if (goalRequirement > goalContributionTotal) {
    const shortfall = goalRequirement - goalContributionTotal;
    messages.push({ level: shortfall > goalRequirement * 0.5 ? 'Warning' : 'Attention', title: 'Goal allocation guidance', message: `${moneyText(shortfall)} more needs to be allocated this month to stay on track.`, priority: 2 });
  } else if (goalRequirement > 0) messages.push({ level: 'Information', title: 'Goals are on track', message: `You have allocated ${moneyText(goalContributionTotal)} toward this month's goal requirements.`, priority: 6 });
  const budgets = profile.budgets.filter(item => item.month === month);
  const categoryOver = budgets.map(budget => ({ budget, actual: categoryTotal(profile.expenseTransactions, month, budget.category) })).filter(item => item.actual > item.budget.plannedAmount).sort((a, b) => (b.actual - b.budget.plannedAmount) - (a.actual - a.budget.plannedAmount))[0];
  if (categoryOver) messages.push({ level: 'Attention', title: `${categoryOver.budget.category} spending`, message: `${moneyText(categoryOver.actual - categoryOver.budget.plannedAmount)} is above the planned amount.`, priority: 5 });
  return messages.sort((a, b) => a.priority - b.priority).slice(0, 3);
}

function moneyText(value: number): string { return `₹${Math.round(value).toLocaleString('en-IN')}`; }
