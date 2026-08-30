import { translate } from '../contexts/LanguageContext';
import { describe, it, expect } from 'vitest';

describe('Personal Budget Localization', () => {
  it('translates personal budget tabs and report labels in Malayalam', () => {
    expect(translate('ml', 'personalBudgetOverview' as any)).toBeDefined();
    expect(translate('ml', 'personalBudgetIncome' as any)).toBeDefined();
    expect(translate('ml', 'personalBudgetExpenses' as any)).toBeDefined();
    expect(translate('ml', 'personalBudgetRecurring' as any)).toBeDefined();
    expect(translate('ml', 'personalBudgetReports' as any)).toBeDefined();
  });

  it('translates personal budget tabs and report labels in Hindi', () => {
    expect(translate('hi', 'personalBudgetOverview' as any)).toBeDefined();
    expect(translate('hi', 'personalBudgetIncome' as any)).toBeDefined();
    expect(translate('hi', 'personalBudgetExpenses' as any)).toBeDefined();
    expect(translate('hi', 'personalBudgetRecurring' as any)).toBeDefined();
    expect(translate('hi', 'personalBudgetReports' as any)).toBeDefined();
  });
});
