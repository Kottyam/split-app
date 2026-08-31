import { calculateExpectedAmount, calculateExpectedAmountForPeriod, isMemberApplicableToPeriod } from './calculations';
import type { Contribution, GroupFund, GroupFundMember } from './types';

export function getActivePeriodContributions(
  contributions: Contribution[],
  memberId: string,
  period: string,
): Contribution[] {
  return contributions.filter(
    contribution =>
      contribution.memberId === memberId &&
      contribution.status !== 'Cancelled' &&
      (!contribution.note || contribution.note.includes(period)),
  );
}

export function getPeriodCollectedAmount(
  contributions: Contribution[],
  memberId: string,
  period: string,
): number {
  return getActivePeriodContributions(contributions, memberId, period).reduce(
    (total, contribution) => total + contribution.amount,
    0,
  );
}

/** A zero-value contribution is still an intentional collection record. */
export function hasRecordedPeriodCollection(
  contributions: Contribution[],
  memberId: string,
  period: string,
): boolean {
  return getActivePeriodContributions(contributions, memberId, period).length > 0;
}

export type PeriodCollectionStatus = 'Collected' | 'Pending';

export function getPeriodCollectionStatus(
  contributions: Contribution[],
  memberId: string,
  period: string,
): PeriodCollectionStatus {
  return hasRecordedPeriodCollection(contributions, memberId, period) ? 'Collected' : 'Pending';
}

export function getMemberCreditBalance(member: GroupFundMember): number {
  return Math.max(0, member.creditBalance ?? 0);
}

export function getAmountAfterCredit(expectedAmount: number, member: GroupFundMember): { due: number; creditApplied: number; amountToPay: number; remainingCredit: number } {
  const due = Math.max(0, expectedAmount);
  const credit = getMemberCreditBalance(member);
  const creditApplied = Math.min(due, credit);
  return { due, creditApplied, amountToPay: Math.max(0, due - creditApplied), remainingCredit: Math.max(0, credit - creditApplied) };
}

export function getCreditAfterPayment(member: GroupFundMember, expectedAmount: number, previouslyCollected: number, paymentAmount: number): number {
  const remainingDue = Math.max(0, expectedAmount - previouslyCollected);
  const excess = Math.max(0, paymentAmount - remainingDue);
  return getMemberCreditBalance(member) + excess;
}

/** Saved amount is only a payment-link/share value; it is never treated as a collection record. */
export function getSavedCollectionAmount(member: GroupFundMember): number | undefined {
  const amount = member.savedCollectionAmount;
  return typeof amount === 'number' && Number.isFinite(amount) && amount >= 0 ? amount : undefined;
}

/** The collection/payment UI should default to the calculated expected amount. Saved amount is reserved for sharing a payment link. */
export function getMemberPaymentRequestAmount(
  fund: GroupFund,
  member: GroupFundMember,
  period?: string,
): number | undefined {
  const expected = period ? calculateExpectedAmountForPeriod(fund, member, period) : calculateExpectedAmount(fund, member);
  return Number.isFinite(expected) && expected > 0 ? expected : undefined;
}

export function isMemberPeriodComplete(
  fund: GroupFund,
  member: GroupFundMember,
  period: string,
): boolean {
  if (!isMemberApplicableToPeriod(fund, member, period)) return true;
  const records = getActivePeriodContributions(fund.contributions, member.id, period);
  if (records.length === 0) return false;
  const expected = calculateExpectedAmountForPeriod(fund, member, period);
  return expected <= 0 || getPeriodCollectedAmount(fund.contributions, member.id, period) >= expected;
}

export function canCloseCollectionPeriod(fund: GroupFund, period: string): boolean {
  const activeMembers = fund.members.filter(member =>
    member.isActive !== false &&
    (!fund.isRecurring || member.recurringActive !== false) &&
    isMemberApplicableToPeriod(fund, member, period),
  );
  return activeMembers.length > 0 && activeMembers.every(member => isMemberPeriodComplete(fund, member, period));
}

export function canCloseMonthlyPeriod(fund: GroupFund, period: string): boolean {
  if (!fund.isRecurring || fund.recurringFrequency !== 'Monthly') return false;
  return canCloseCollectionPeriod(fund, period);
}

export function closePeriod(periods: string[] | undefined, period: string): string[] {
  return Array.from(new Set([...(periods ?? []), period]));
}

export function reopenPeriod(periods: string[] | undefined, period: string): string[] {
  return (periods ?? []).filter(closedPeriod => closedPeriod !== period);
}
