import { describe, expect, it } from 'vitest';
import { languageExtras } from '@/contexts/languageExtras';
import {
  canCloseCollectionPeriod,
  canCloseMonthlyPeriod,
  closePeriod,
  getPeriodCollectedAmount,
  getAmountAfterCredit,
  getMemberCreditBalance,
  getMemberPaymentRequestAmount,
  getPeriodCollectionStatus,
  getSavedCollectionAmount,
  hasRecordedPeriodCollection,
  isMemberPeriodComplete,
  reopenPeriod,
} from './collection';
import { generateGroupFundThankYouMessage } from './payment';
import type { Contribution, GroupFund, GroupFundMember } from './types';

const period = 'August 2026';

function makeMember(id: string, expectedAmount: number, recurringActive = true): GroupFundMember {
  return { id, name: id, expectedAmount, isActive: true, recurringActive, createdAt: Date.UTC(2026, 7, 1), startDate: '2026-08-01' };
}

function makeContribution(memberId: string, amount: number): Contribution {
  return {
    id: `${memberId}-contribution`,
    fundId: 'fund-1',
    memberId,
    amount,
    expectedAmount: amount,
    method: 'Cash',
    date: Date.now(),
    status: 'Paid',
    note: period,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function makeFund(members: GroupFundMember[], contributions: Contribution[]): GroupFund {
  return {
    id: 'fund-1',
    type: 'group_fund',
    name: 'House Fund',
    purpose: 'Common Collection',
    contributionType: 'monthly',
    defaultContributionAmount: 100,
    collectionStartDate: '2026-08-01',
    isRecurring: true,
    recurringFrequency: 'Monthly',
    amountType: 'Default Amount',
    monthlyCycleType: 'Calendar Month (1st to End)',
    prorationRule: 'Full Amount',
    members,
    contributions,
    expenses: [],
    createdAt: Date.UTC(2026, 7, 1),
    updatedAt: Date.UTC(2026, 7, 1),
  };
}

describe('Group Fund collection periods', () => {
  it('records an explicit zero-value collection instead of treating it as pending', () => {
    const member = makeMember('Asha', 100);
    const contribution = makeContribution(member.id, 0);
    expect(getPeriodCollectedAmount([contribution], member.id, period)).toBe(0);
    expect(hasRecordedPeriodCollection([contribution], member.id, period)).toBe(true);
    expect(getPeriodCollectionStatus([contribution], member.id, period)).toBe('Collected');
    expect(getPeriodCollectionStatus([], member.id, period)).toBe('Pending');
    expect(isMemberPeriodComplete(makeFund([member], [contribution]), member, period)).toBe(false);
  });

  it('allows a zero-expected member to complete a period with a zero record', () => {
    const member = makeMember('Binu', 0);
    const fund = makeFund([member], [makeContribution(member.id, 0)]);
    expect(isMemberPeriodComplete(fund, member, period)).toBe(true);
    expect(canCloseMonthlyPeriod(fund, period)).toBe(true);
  });

  it('uses a saved amount for payment requests without creating a collection record', () => {
    const member = { ...makeMember('Asha', 100), savedCollectionAmount: 275 };
    const fund = makeFund([member], []);
    expect(getSavedCollectionAmount(member)).toBe(275);
    expect(getMemberPaymentRequestAmount(fund, member, period)).toBe(100);
    expect(getPeriodCollectionStatus(fund.contributions, member.id, period)).toBe('Pending');
  });

  it('accepts a saved zero amount as a prefill while legacy members fall back to expected amount', () => {
    const savedZero = { ...makeMember('Asha', 100), savedCollectionAmount: 0 };
    const legacy = makeMember('Binu', 125);
    const fund = makeFund([savedZero, legacy], []);
    expect(getSavedCollectionAmount(savedZero)).toBe(0);
    expect(getMemberPaymentRequestAmount(fund, savedZero, period)).toBe(100);
    expect(getMemberPaymentRequestAmount(fund, legacy, period)).toBe(125);
  });

  it('applies member credit to the next due amount without treating credit as pending or expense', () => {
    const member = { ...makeMember('Asha', 500), creditBalance: 300 };
    expect(getMemberCreditBalance(member)).toBe(300);
    expect(getAmountAfterCredit(500, member)).toEqual({ due: 500, creditApplied: 300, amountToPay: 200, remainingCredit: 0 });
    expect(getAmountAfterCredit(200, member)).toEqual({ due: 200, creditApplied: 200, amountToPay: 0, remainingCredit: 100 });
  });

  it('supports close eligibility for a normal non-recurring collection period', () => {
    const first = makeMember('Asha', 100);
    const second = makeMember('Binu', 50);
    const fund = { ...makeFund([first, second], [makeContribution(first.id, 100)]), isRecurring: false, recurringFrequency: undefined };
    expect(canCloseCollectionPeriod(fund, period)).toBe(false);
    fund.contributions.push(makeContribution(second.id, 50));
    expect(canCloseCollectionPeriod(fund, period)).toBe(true);
  });

  it('supports close eligibility for a non-monthly collection period', () => {
    const first = makeMember('Asha', 100);
    const second = makeMember('Binu', 50);
    const fund = makeFund([first, second], [makeContribution(first.id, 100)]);
    expect(canCloseCollectionPeriod(fund, period)).toBe(false);
    fund.contributions.push(makeContribution(second.id, 50));
    expect(canCloseCollectionPeriod(fund, period)).toBe(true);
  });

  it('closes only when every active recurring member has their full collection recorded', () => {
    const first = makeMember('Asha', 100);
    const second = makeMember('Binu', 0);
    const fund = makeFund([first, second], [makeContribution(first.id, 100), makeContribution(second.id, 0)]);
    expect(canCloseMonthlyPeriod(fund, period)).toBe(true);
    expect(canCloseMonthlyPeriod(makeFund([first, second], [makeContribution(first.id, 100)]), period)).toBe(false);
  });

  it('ignores stopped members for monthly close eligibility and supports close undo', () => {
    const active = makeMember('Asha', 100);
    const stopped = makeMember('Binu', 100, false);
    const fund = makeFund([active, stopped], [makeContribution(active.id, 100)]);
    expect(canCloseMonthlyPeriod(fund, period)).toBe(true);
    expect(closePeriod(undefined, period)).toEqual([period]);
    expect(closePeriod([period], period)).toEqual([period]);
    expect(reopenPeriod([period, 'July 2026'], period)).toEqual(['July 2026']);
  });
});

describe('Group Fund thank-you and localization contracts', () => {
  it('generates a localized-ready thank-you message without a payment link', () => {
    expect(generateGroupFundThankYouMessage({
      fundName: 'House Fund', memberName: 'Asha', amount: 0, period,
      message: 'നന്ദി {{name}}',
    })).toBe('നന്ദി {{name}}');
    expect(generateGroupFundThankYouMessage({ fundName: 'House Fund', memberName: 'Asha', amount: 0, period }))
      .toContain('collection has been recorded');
  });

  it('contains all new action keys in every supported Indian language dictionary', () => {
    const languages = ['ml', 'hi', 'ta', 'kn', 'te', 'mr', 'bn', 'gu', 'pa', 'or', 'as'];
    const keys = ['auditSendThankYou', 'auditThankYouMessage', 'auditCloseThisMonth', 'auditUndoCloseMonth', 'auditMonthClosed', 'auditMonthReopened', 'auditCloseMonthNeedsAll', 'auditSavedAmount', 'auditSaveAmount', 'auditSavedAmountPlaceholder', 'auditAmountSaved', 'auditSendBulkMessage', 'auditBulkMessageNoAmounts', 'auditBulkMessageOpened', 'auditBulkPaymentMessage', 'auditPaymentConfirmationInstruction', 'auditPaymentLinkOpened', 'auditBulkContributionReminderMessage', 'auditSendToAll', 'auditSendSelection', 'auditSelectMembersForBulkMessage', 'auditBulkMessageQueueHelp', 'auditBulkMessageProgress', 'auditOpenNextMessage', 'auditBulkMessageComplete', 'auditBulkMessageNoSelection', 'auditCloseCollection', 'auditUndoCloseCollection', 'auditCollectionClosed', 'auditCollectionReopened', 'auditCloseCollectionNeedsAll'];
    for (const language of languages) {
      for (const key of keys) expect(languageExtras[language]?.[key]).toBeTruthy();
    }
  });
});
