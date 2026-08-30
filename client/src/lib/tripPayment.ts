export type SplitMode = 'equal' | 'equal-all' | 'equal-selected' | 'custom';

export function buildExpenseSplits(
  amount: number,
  memberIds: string[],
  mode: SplitMode,
  customAmounts: Record<string, number | string> = {},
): Record<string, number> {
  const uniqueIds = Array.from(new Set(memberIds));
  if (!Number.isFinite(amount) || amount <= 0 || uniqueIds.length === 0) {
    throw new Error('Amount and split members are required');
  }
  if (mode === 'equal' || mode === 'equal-all' || mode === 'equal-selected') {
    const each = amount / uniqueIds.length;
    return Object.fromEntries(uniqueIds.map(id => [id, each]));
  }
  const splits = Object.fromEntries(uniqueIds.map(id => [id, Number(customAmounts[id] || 0)]));
  const total = Object.values(splits).reduce((sum, value) => sum + value, 0);
  if (Math.abs(total - amount) > 0.01) {
    throw new Error('Custom split must equal the expense amount');
  }
  return splits;
}

export function validateTripPaymentDetails(description: string, amount: number, payerId: string): boolean {
  return Boolean(description.trim() && Number.isFinite(amount) && amount > 0 && payerId);
}
