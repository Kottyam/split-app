import type {
  BudgetProfile,
  ExpenseCategoryDefinition,
  IncomeCategory,
} from './types';

const STORAGE_KEY = 'kharcha_personal_budget_profile_v1';

export const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategoryDefinition[] = [
  { id: 'cat_housing', name: 'Housing', subcategories: ['Rent', 'Maintenance', 'Electricity', 'Water', 'Gas', 'Internet', 'Other'], icon: '🏠', color: '#16834b' },
  { id: 'cat_food', name: 'Food', subcategories: ['Groceries', 'Milk', 'Restaurant', 'Food Delivery', 'Other'], icon: '🍲', color: '#e87817' },
  { id: 'cat_transport', name: 'Transport', subcategories: ['Fuel', 'Taxi', 'Bus', 'Train', 'Parking', 'Toll', 'Other'], icon: '🚗', color: '#2563eb' },
  { id: 'cat_education', name: 'Education', subcategories: ['School', 'Tuition', 'Books', 'Other'], icon: '📚', color: '#9333ea' },
  { id: 'cat_health', name: 'Health', subcategories: ['Doctor', 'Medicine', 'Hospital', 'Other'], icon: '❤️', color: '#dc2626' },
  { id: 'cat_family', name: 'Family', subcategories: ['Children', 'Parents', 'Household', 'Other'], icon: '👨‍👩‍👧', color: '#d97706' },
  { id: 'cat_lifestyle', name: 'Lifestyle', subcategories: ['Shopping', 'Entertainment', 'Gym', 'Subscription', 'Other'], icon: '✨', color: '#059669' },
  { id: 'cat_financial', name: 'Financial', subcategories: ['EMI', 'Insurance', 'Investment', 'Other'], icon: '💳', color: '#4f46e5' },
  { id: 'cat_other', name: 'Other', subcategories: ['Miscellaneous'], icon: '📦', color: '#6b7280' },
];

function currentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function defaultProfile(): BudgetProfile {
  const month = currentMonthKey();
  return {
    id: 'default-household',
    name: 'My Household',
    budgetType: 'Household',
    currency: 'INR',
    onboarded: true,
    selectedMonth: month,
    incomeSources: [],
    incomeTransactions: [],
    expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
    expenseTransactions: [],
    recurringExpenseRules: [],
    budgets: [],
    householdMembers: [
      { id: 'm1', name: 'Self', relationship: 'Self' },
    ],
    goals: [],
    goalContributions: [],
    updatedAt: Date.now(),
    expectedMonthlyIncome: 0,
    familyMembers: [],
    expenses: [],
    savingsGoals: [],
    loans: [],
    annualEvents: [],
  };
}

export function materializeRecurringProfile(profile: BudgetProfile, _month: string): BudgetProfile {
  return profile;
}

export function getPersonalBudgetProfile(): BudgetProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BudgetProfile;
      const merged: BudgetProfile = {
        ...defaultProfile(),
        ...parsed,
        incomeSources: parsed.incomeSources ?? [],
        incomeTransactions: parsed.incomeTransactions ?? [],
        expenseTransactions: parsed.expenseTransactions ?? [],
        recurringExpenseRules: parsed.recurringExpenseRules ?? [],
        budgets: parsed.budgets ?? [],
        householdMembers: parsed.householdMembers ?? [],
        goals: parsed.goals ?? [],
        goalContributions: parsed.goalContributions ?? [],
        expenseCategories: parsed.expenseCategories?.length ? parsed.expenseCategories : DEFAULT_EXPENSE_CATEGORIES,
      };
      return merged;
    }
  } catch (error) {
    console.error('Failed to load personal budget profile', error);
  }

  const profile = defaultProfile();
  savePersonalBudgetProfile(profile);
  return profile;
}

export function savePersonalBudgetProfile(profile: BudgetProfile): void {
  try {
    const next = { ...profile, updatedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.error('Failed to save personal budget profile', error);
  }
}
