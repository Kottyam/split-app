import { ONE_TIME_PERIOD, calculateExpectedAmount, calculateExpectedAmountForPeriod, isMemberApplicableToPeriod } from './calculations';
import type { Contribution, GroupFund, GroupFundMember } from './types';

export { ONE_TIME_PERIOD };

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Does a contribution note belong to this period? Only the period part of the note
 * (before the " — remark") is checked, and the label must not be followed by a digit,
 * so "Week of Nov 3" does not also match "Week of Nov 30".
 */
export function contributionMatchesPeriod(note: string | undefined, period: string): boolean {
  if (!note || !period || period === ONE_TIME_PERIOD) return true;
  const head = note.split(' — ')[0];
  return new RegExp(`(^|[^0-9A-Za-z])${escapeRegExp(period)}(?![0-9])`).test(head);
}

/**
 * Money that counts toward "Total Collected".
 * Must match Collect-tab / getActivePeriodContributions: every non-cancelled
 * recorded payment (Paid, Partial, User Confirmed, …). Overview previously
 * filtered status === 'Paid' only, so Partial collections disappeared there.
 */
export function isCountedTowardCollected(contribution: Contribution): boolean {
  return contribution.status !== 'Cancelled';
}

export function getActivePeriodContributions(
  contributions: Contribution[],
  memberId: string,
  period: string,
): Contribution[] {
  return contributions.filter(
    contribution =>
      contribution.memberId === memberId &&
      isCountedTowardCollected(contribution) &&
      contributionMatchesPeriod(contribution.note, period),
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

/** Lifetime total collected across all periods (plus optional starting balance). */
export function getLifetimeCollectedAmount(
  contributions: Contribution[],
  startingBalance = 0,
): number {
  const paid = (contributions ?? [])
    .filter(isCountedTowardCollected)
    .reduce((sum, contribution) => sum + contribution.amount, 0);
  return paid + (Number(startingBalance) || 0);
}

/** Period total collected (same inclusion rule as Collect). Optionally add starting balance. */
export function getPeriodTotalCollectedAmount(
  contributions: Contribution[],
  period: string,
  startingBalance = 0,
  includeStartingBalance = false,
): number {
  const paid = (contributions ?? [])
    .filter(
      contribution =>
        isCountedTowardCollected(contribution) &&
        contributionMatchesPeriod(contribution.note, period),
    )
    .reduce((sum, contribution) => sum + contribution.amount, 0);
  return paid + (includeStartingBalance ? Number(startingBalance) || 0 : 0);
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
