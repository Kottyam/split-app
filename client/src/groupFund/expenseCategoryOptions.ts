/** Built-in Group Fund expense categories (as stored) and their translation keys, in Add Expense order. */
export const FUND_EXPENSE_CATEGORY_KEYS: Record<string, string> = {
  Food: 'auditFoodSnacks',
  Equipment: 'auditEquipment',
  Maintenance: 'auditMaintenance',
  Event: 'auditEventCelebration',
  Celebration: 'auditEventCelebration',
  Utility: 'auditUtility',
  Other: 'auditOther',
};

const BUILT_IN_ORDER = ['Food', 'Equipment', 'Maintenance', 'Event', 'Utility', 'Other'];

export function fundExpenseCategoryLabel(t: (key: any) => string, category: string): string {
  const key = FUND_EXPENSE_CATEGORY_KEYS[category];
  return key ? t(key) : category;
}

/** Filter options: built-in categories first, then any other category found on the given expenses. */
export function fundExpenseCategoryOptions(t: (key: any) => string, expenses: Array<{ category?: string }>): Array<{ value: string; label: string }> {
  const values = [...BUILT_IN_ORDER];
  for (const e of expenses) {
    const c = (e.category ?? '').trim();
    if (c && !values.includes(c)) values.push(c);
  }
  return values.map(value => ({ value, label: fundExpenseCategoryLabel(t, value) }));
}
