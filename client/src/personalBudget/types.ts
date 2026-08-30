export type BudgetType = 'Personal' | 'Household' | 'Family';

export type Frequency = 'Monthly' | 'Weekly' | 'Daily' | 'Quarterly' | 'Yearly' | 'Custom' | 'One-time' | 'Irregular';

export type IncomeCategory =
  | 'Salary'
  | 'Business'
  | 'Rental'
  | 'Freelance'
  | 'Commission'
  | 'Interest'
  | 'Dividend'
  | 'Investment'
  | 'Pension'
  | 'Bonus'
  | 'Other';

export type ExpenseCategory =
  | 'Housing'
  | 'Food'
  | 'Transport'
  | 'Education'
  | 'Health'
  | 'Family'
  | 'Lifestyle'
  | 'Financial'
  | 'Other';

export type PaymentMethod = 'Cash' | 'UPI' | 'Bank' | 'Credit Card' | 'Debit Card' | 'Wallet' | 'Other';

export interface BudgetProfile {
  id: string;
  name: string;
  budgetType: BudgetType;
  currency: string;
  onboarded: boolean;
  selectedMonth: string;
  incomeSources: IncomeSource[];
  incomeTransactions: IncomeTransaction[];
  expenseCategories: ExpenseCategoryDefinition[];
  expenseTransactions: ExpenseTransaction[];
  recurringExpenseRules: RecurringExpenseRule[];
  budgets: Budget[];
  householdMembers: HouseholdMember[];
  goals: Goal[];
  goalContributions: GoalContribution[];
  updatedAt: number;
  expectedMonthlyIncome: number;
  familyMembers: HouseholdMember[];
  expenses: any[];
  savingsGoals: Goal[];
  loans: any[];
  annualEvents: any[];
}

export type PersonalBudgetProfile = BudgetProfile;

export interface IncomeSource {
  id: string;
  name: string;
  category: IncomeCategory | string;
  personId?: string;
  amount: number;
  amountType: 'Fixed' | 'Variable';
  frequency: Frequency;
  expectedDate?: string;
  startDate?: string;
  endDate?: string;
  status: 'Active' | 'Paused' | 'Archived';
  includeInBudget?: boolean;
  notes?: string;
}

export interface IncomeTransaction {
  id: string;
  sourceId?: string;
  title: string;
  amount: number;
  date: string; // ISO date or YYYY-MM-DD
  status: 'Expected' | 'Received' | 'Partial';
  notes?: string;
}

export interface ExpenseCategoryDefinition {
  id: string;
  name: ExpenseCategory | string;
  subcategories?: string[];
  icon?: string;
  color?: string;
  isSystem?: boolean;
}

export interface ExpenseTransaction {
  id: string;
  title: string;
  category: ExpenseCategory | string;
  subcategory?: string;
  amount: number;
  date: string; // YYYY-MM-DD
  status: 'Planned' | 'Paid' | 'Skipped' | 'Cancelled';
  paymentMethod?: PaymentMethod;
  isCommitted?: boolean;
  actualTransactionId?: string;
  amountOverride?: number;
  isOccurrence?: boolean;
  personId?: string;
  notes?: string;
  recurringRuleId?: string;
  includeInBudget?: boolean;
  expenseType?: ExpenseType;
  weekLabel?: string;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  date: string;
  source?: string;
  note?: string;
}

export interface DailyExpense {
  id: string;
  amount: number;
  category: string;
  date: string;
  personId?: string;
  paymentMethod?: PaymentMethod;
  note?: string;
}

export interface WeeklyExpense {
  id: string;
  name: string;
  category: string;
  weekStart: string;
  weekEnd?: string;
  amount: number;
  personId?: string;
  paymentMethod?: PaymentMethod;
  note?: string;
}

export interface BudgetGuidance {
  id: string;
  type: 'Budget' | 'Goal' | 'DailyLimit' | 'Category' | 'Commitment';
  severity: 'Information' | 'Attention' | 'Warning';
  message: string;
  relatedCategory?: string;
  relatedGoal?: string;
  createdAt: number;
  dismissed?: boolean;
}


export type RecurringFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly' | 'Custom';

export interface SkipRange {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface PauseWindow {
  id: string;
  startDate: string;
  endDate: string;
}

export interface RecurringExpenseRule {
  id: string;
  title: string;
  category: ExpenseCategory | string;
  subcategory?: string;
  amount: number;
  frequency: RecurringFrequency;
  intervalCount?: number;
  customUnit?: 'days' | 'weeks' | 'months' | 'years';
  dayOfMonth?: number;
  dayOfWeek?: number;
  monthOfYear?: number;
  dayOfYear?: number;
  startDate: string;
  endDate?: string;
  amountType: 'Fixed' | 'Variable';
  status: 'Active' | 'Paused' | 'Archived' | 'Deleted';
  paymentMethod?: PaymentMethod;
  personId?: string;
  includeInBudget?: boolean;
  notes?: string;
  skipRanges?: SkipRange[];
  pauseWindows?: PauseWindow[];
}

export interface Budget {
  id: string;
  month: string; // YYYY-MM
  category: ExpenseCategory | string;
  plannedAmount: number;
}

export interface HouseholdMember {
  id: string;
  name: string;
  relationship: 'Self' | 'Spouse/Partner' | 'Child' | 'Parent' | 'Other';
  incomeContribution?: number;
  notes?: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  category: 'Emergency Fund' | 'Investment' | 'Asset Purchase' | 'Vacation' | 'Other' | string;
  status: 'Active' | 'Completed' | 'Paused';
  monthlyAllocation?: number;
  priority?: 'Low' | 'Medium' | 'High';
  active?: boolean;
  notes?: string;
}

// Legacy aliases
export type FamilyMember = HouseholdMember;
export type SavingsGoal = Goal;
export interface BudgetExpense {
  id: string;
  title: string;
  category: any;
  amount: number;
  frequency: Frequency;
  dueDate?: string;
  isRecurring: boolean;
  isCommitted: boolean;
  status: 'Pending' | 'Paid' | 'Skipped';
  notes?: string;
  createdAt: number;
}

export type ExpenseType = 'Daily' | 'Weekly' | 'OneTime' | 'Recurring';

export type FinancialGoal = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  monthlyAllocation: number;
  targetDate: string;
  category: string;
  status: 'Active' | 'Completed' | 'Paused';
};

export type BudgetGuidanceMessage = {
  id: string;
  level: 'Information' | 'Attention' | 'Warning';
  title: string;
  message: string;
  category?: string;
};
