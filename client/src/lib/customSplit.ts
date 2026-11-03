export type CustomSplitStatus = { splitTotal: number; expenseTotal: number; difference: number; matches: boolean };

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Compare the sum of custom split amounts against the expense total (₹0.01 tolerance). */
export function getCustomSplitStatus(expenseTotal: number, splitValues: Array<string | number | undefined>): CustomSplitStatus {
  const total = Number.isFinite(expenseTotal) ? expenseTotal : 0;
  const splitTotal = splitValues.reduce<number>((sum, value) => {
    const parsed = typeof value === 'number' ? value : parseFloat(value || '0');
    return sum + (Number.isFinite(parsed) ? parsed : 0);
  }, 0);
  const difference = round2(total - splitTotal);
  return { splitTotal: round2(splitTotal), expenseTotal: round2(total), difference, matches: Math.abs(difference) <= 0.01 };
}

export const formatSplitAmount = (value: number) => Math.abs(value).toFixed(2);
