import { describe, it, expect } from 'vitest';
import { calculateExpectedAmount, calculateExpectedAmountForPeriod, calculateMemberAddExpectedAmount, calculateMemberAddExpectedAmountForConfiguredPeriod, isMemberApplicableToPeriod, resolveCollectionPeriod } from './calculations';
import type { GroupFund, GroupFundMember } from './types';

const baseFund = (overrides: Partial<GroupFund> = {}): GroupFund => ({
  id: 'fund',
  type: 'group_fund',
  name: 'Test Fund',
  purpose: 'Office',
  contributionType: 'monthly',
  defaultContributionAmount: 1000,
  isRecurring: true,
  recurringFrequency: 'Monthly',
  amountType: 'Default Amount',
  prorationRule: 'Proportionate (Remaining Days)',
  monthlyCycleType: 'Calendar Month (1st to End)',
  members: [],
  contributions: [],
  createdAt: Date.UTC(2026, 7, 1),
  updatedAt: Date.UTC(2026, 7, 1),
  ...overrides,
});

const member = (overrides: Partial<GroupFundMember> = {}): GroupFundMember => ({
  id: 'member',
  name: 'Alice',
  isActive: true,
  createdAt: Date.UTC(2026, 7, 1),
  ...overrides,
});

describe('Group Fund Recurring Calculations & Proration', () => {
  it('resolves collection date to the configured past or future cycle', () => {
    const weekly = baseFund({ collectionStartDate: '2026-09-07', recurringFrequency: 'Weekly', weeklyStartDay: 'Monday' });
    expect(resolveCollectionPeriod(weekly, new Date('2026-09-16T00:00:00'), 'past')).toBe('Week of Sep 7');
    expect(resolveCollectionPeriod(weekly, new Date('2026-09-16T00:00:00'), 'future')).toBe('Week of Sep 14');

    const monthly = baseFund({ collectionStartDate: '2026-09-01', recurringFrequency: 'Monthly' });
    expect(resolveCollectionPeriod(monthly, new Date('2026-09-16T00:00:00'), 'past')).toBe('August 2026');
    expect(resolveCollectionPeriod(monthly, new Date('2026-09-16T00:00:00'), 'future')).toBe('September 2026');

    const daily = baseFund({ recurringFrequency: 'Daily' });
    expect(resolveCollectionPeriod(daily, new Date('2026-09-16T00:00:00'), 'past')).toBe('Sep 15, 2026');
  });

  it('prefers explicit collectionTiming over the legacy mode field', () => {
    const fund = baseFund({ collectionStartDate: '2026-08-01', collectionPeriodMode: 'future', collectionTiming: 'previous', recurringFrequency: 'Monthly' });
    const joined = member({ startDate: '2026-08-05' });
    expect(calculateMemberAddExpectedAmountForConfiguredPeriod(fund, joined, new Date('2026-08-05T00:00:00'), new Date('2026-09-10T00:00:00'))).toBeCloseTo(870.97, 2);
    expect(calculateMemberAddExpectedAmountForConfiguredPeriod({ ...fund, collectionTiming: 'advance' }, joined, new Date('2026-08-05T00:00:00'), new Date('2026-09-10T00:00:00'))).toBe(1000);
  });

  it('uses the configured collection cycle before calculating Default Amount Expected Amount, without prorating Variable Amount', () => {
    const defaultFund = baseFund({ collectionStartDate: '2026-08-01', collectionPeriodMode: 'past', recurringFrequency: 'Monthly', defaultContributionAmount: 1000, amountType: 'Default Amount', prorationRule: 'Proportionate (Remaining Days)' });
    const member = { id: 'm', name: 'Member', dateJoined: Date.parse('2026-08-16'), createdAt: Date.parse('2026-08-16'), isActive: true } as GroupFundMember;
    expect(calculateMemberAddExpectedAmountForConfiguredPeriod(defaultFund, member, new Date('2026-08-16T00:00:00'), new Date('2026-08-26T00:00:00'))).toBe(0);
    expect(calculateMemberAddExpectedAmountForConfiguredPeriod({ ...defaultFund, collectionPeriodMode: 'future' }, member, new Date('2026-08-16T00:00:00'), new Date('2026-09-10T00:00:00'))).toBe(1000);
    expect(calculateMemberAddExpectedAmountForConfiguredPeriod({ ...defaultFund, collectionPeriodMode: 'future' }, { ...member, startDate: '2026-09-20' }, new Date('2026-09-20T00:00:00'), new Date('2026-09-10T00:00:00'))).toBe(1000);

    const variableFund = { ...defaultFund, amountType: 'Variable Amount' as const };
    expect(calculateMemberAddExpectedAmountForConfiguredPeriod(variableFund, { ...member, expectedAmount: 600 }, new Date('2026-08-16T00:00:00'), new Date('2026-09-10T00:00:00'))).toBe(600);
  });

  it('uses the configured Collection Start Date to select the previous monthly cycle and prorates from Join Date', () => {
    const fund = baseFund({ collectionStartDate: '2026-09-01', collectionTiming: 'previous', recurringFrequency: 'Monthly', defaultContributionAmount: 1000 });
    const joinedInPreviousMonth = member({ startDate: '2026-08-16' });
    expect(calculateMemberAddExpectedAmountForConfiguredPeriod(fund, joinedInPreviousMonth, new Date('2026-08-16T00:00:00'), new Date('2026-09-01T00:00:00'))).toBeCloseTo(516.13, 2);
  });

  it('uses the current collection reference instead of a stale Fund start date for Past proration', () => {
    const fund = baseFund({ collectionStartDate: '2026-01-01', collectionPeriodMode: 'past', recurringFrequency: 'Monthly', defaultContributionAmount: 1000 });
    const memberJoinedInAugust = member({ startDate: '2026-08-05' });
    expect(calculateMemberAddExpectedAmountForConfiguredPeriod(fund, memberJoinedInAugust, new Date('2026-08-05T00:00:00'), new Date('2026-08-10T00:00:00'))).toBe(0);
  });

  it('prorates Previous Period from a member Join Date through the completed cycle end', () => {
    const monthly = baseFund({ collectionStartDate: '2026-08-01', collectionPeriodMode: 'past', recurringFrequency: 'Monthly', defaultContributionAmount: 1000 });
    expect(calculateMemberAddExpectedAmountForConfiguredPeriod(monthly, member({ startDate: '2026-08-05' }), new Date('2026-08-05T00:00:00'), new Date('2026-09-10T00:00:00'))).toBeCloseTo(870.97, 2);

    const weekly = baseFund({ collectionStartDate: '2026-08-01', collectionPeriodMode: 'past', recurringFrequency: 'Weekly', weeklyStartDay: 'Monday', defaultContributionAmount: 700 });
    expect(calculateMemberAddExpectedAmountForConfiguredPeriod(weekly, member({ startDate: '2026-09-03' }), new Date('2026-09-03T00:00:00'), new Date('2026-09-10T00:00:00'))).toBeCloseTo(400, 2);
  });

  it('derives member-add Expected Amount from the fund Default Amount and Join Date', () => {
    const fund = baseFund({
      collectionStartDate: '2026-08-01',
      defaultContributionAmount: 1000,
      recurringFrequency: 'Monthly',
    });
    const memberWithStaleStoredAmount = member({ startDate: '2026-08-16', expectedAmount: 425 });
    expect(calculateMemberAddExpectedAmount(fund, memberWithStaleStoredAmount, new Date('2026-08-16T00:00:00'))).toBe(516.13);
  });

  it('calculates full amount when prorationRule is Full Amount', () => {
    const fund = baseFund({ prorationRule: 'Full Amount' });
    expect(calculateExpectedAmount(fund, member())).toBe(1000);
  });

  it('respects weekly start day configuration (Monday vs Sunday start)', () => {
    const fund = baseFund({
      contributionType: 'weekly',
      defaultContributionAmount: 700,
      recurringFrequency: 'Weekly',
      weeklyStartDay: 'Monday',
    });
    const expected = calculateExpectedAmount(fund, member({ startDate: '2026-08-26' }), new Date('2026-08-26T00:00:00'));
    expect(expected).toBeGreaterThan(0);
    expect(expected).toBeLessThanOrEqual(700);
  });

  it('uses the later of fund Collection Start Date and member Join Date', () => {
    const fund = baseFund({ collectionStartDate: '2026-08-15' });
    const joinedBeforeFund = member({ id: 'before', startDate: '2026-08-01' });
    const joinedAfterFund = member({ id: 'after', startDate: '2026-08-20' });
    expect(isMemberApplicableToPeriod(fund, joinedBeforeFund, 'August 2026')).toBe(true);
    expect(calculateExpectedAmountForPeriod(fund, joinedBeforeFund, 'August 2026')).toBeGreaterThan(0);
    expect(isMemberApplicableToPeriod(fund, joinedAfterFund, 'August 2026')).toBe(true);
    expect(calculateExpectedAmountForPeriod(fund, joinedAfterFund, 'August 2026')).toBeLessThan(1000);
  });

  it('uses each member Start Date independently for recurring eligibility', () => {
    const fund = baseFund({ createdAt: Date.UTC(2026, 7, 25), collectionStartDate: '2026-08-25' });
    const august = 'August 2026';
    const early = member({ id: 'early', startDate: '2026-08-25' });
    const later = member({ id: 'later', startDate: '2026-09-05' });
    expect(isMemberApplicableToPeriod(fund, early, august)).toBe(true);
    expect(isMemberApplicableToPeriod(fund, later, august)).toBe(false);
    expect(calculateExpectedAmountForPeriod(fund, later, august)).toBe(0);
  });

  it('calculates Sunday-to-Saturday first-cycle amounts independently per member', () => {
    const fund = baseFund({
      contributionType: 'weekly',
      recurringFrequency: 'Weekly',
      weeklyStartDay: 'Sunday',
      defaultContributionAmount: 200,
      prorationRule: 'Proportionate (Remaining Days)',
      collectionStartDate: '2026-08-02',
    });
    const wednesday = member({ id: 'wednesday', startDate: '2026-08-05' });
    const friday = member({ id: 'friday', startDate: '2026-08-07' });
    const saturday = member({ id: 'saturday', startDate: '2026-08-08' });
    expect(calculateExpectedAmountForPeriod(fund, wednesday, 'Week of Aug 2')).toBe(114.29);
    expect(calculateExpectedAmountForPeriod(fund, friday, 'Week of Aug 2')).toBe(57.14);
    expect(calculateExpectedAmountForPeriod(fund, saturday, 'Week of Aug 2')).toBe(28.57);
    expect(calculateExpectedAmountForPeriod(fund, wednesday, 'Week of Aug 9')).toBe(200);
  });

  it('uses each member’s own dynamic calendar-month eligible days', () => {
    const fund = baseFund({
      collectionStartDate: '2026-08-01',
      defaultContributionAmount: 200,
      recurringFrequency: 'Monthly',
      monthlyCycleType: 'Calendar Month (1st to End)',
      prorationRule: 'Proportionate (Remaining Days)',
    });
    const first = member({ id: 'first', startDate: '2026-08-01' });
    const tenth = member({ id: 'tenth', startDate: '2026-08-10' });
    const twentieth = member({ id: 'twentieth', startDate: '2026-08-20' });
    expect(calculateExpectedAmountForPeriod(fund, first, 'August 2026')).toBe(200);
    expect(calculateExpectedAmountForPeriod(fund, tenth, 'August 2026')).toBe(141.94);
    expect(calculateExpectedAmountForPeriod(fund, twentieth, 'August 2026')).toBe(77.42);
    expect(calculateExpectedAmountForPeriod(fund, tenth, 'September 2026')).toBe(200);
  });

  it('uses the member Start Date as the existing proration input', () => {
    const fund = baseFund({ defaultContributionAmount: 700, recurringFrequency: 'Weekly', contributionType: 'weekly' });
    const monday = member({ startDate: '2026-08-24' });
    const thursday = member({ id: 'thursday', startDate: '2026-08-27' });
    expect(calculateExpectedAmountForPeriod(fund, monday, 'Week of Aug 24')).toBe(700);
    expect(calculateExpectedAmountForPeriod(fund, thursday, 'Week of Aug 24')).toBeGreaterThan(0);
    expect(calculateExpectedAmountForPeriod(fund, thursday, 'Week of Aug 24')).toBeLessThan(700);
  });

  it('preserves Full/Fixed and Variable Amount behavior with member Start Date', () => {
    const fixed = baseFund({ amountType: 'Default Amount', prorationRule: 'Full Amount', defaultContributionAmount: 1000 });
    const variable = baseFund({ amountType: 'Variable Amount', defaultContributionAmount: 1000 });
    const futureMember = member({ startDate: '2099-01-01', expectedAmount: 425 });
    expect(calculateExpectedAmountForPeriod(fixed, futureMember, 'August 2026')).toBe(0);
    expect(calculateExpectedAmount(variable, futureMember)).toBe(425);
  });

  it('keeps legacy members safe when no explicit Start Date exists', () => {
    const fund = baseFund();
    const legacy = member({ dateJoined: Date.UTC(2026, 7, 10) });
    expect(calculateExpectedAmountForPeriod(fund, legacy, 'August 2026')).toBeGreaterThan(0);
  });

  it('ignores recurring date fields completely for one-time funds', () => {
    const fund = baseFund({ isRecurring: false, collectionStartDate: '2099-01-01' });
    const memberWithFutureJoin = member({ startDate: '2099-01-01', expectedAmount: 325 });
    expect(calculateExpectedAmountForPeriod(fund, memberWithFutureJoin, 'August 2026')).toBe(325);
  });

  it('supports start-date-based fortnightly cycles with per-member first-cycle proration', () => {
    const fund = baseFund({
      collectionStartDate: '2026-08-26',
      recurringFrequency: 'Fortnightly',
      defaultContributionAmount: 140,
      fortnightlyCycleBoundary: 'Start-Date Based — Every 14 Days',
    });
    const memberJoinedLate = member({ startDate: '2026-08-30' });
    expect(calculateExpectedAmountForPeriod(fund, memberJoinedLate, 'Fortnight of Aug 26, 2026')).toBe(100);
    expect(calculateExpectedAmountForPeriod(fund, memberJoinedLate, 'Fortnight of Sep 9, 2026')).toBe(140);
  });

  it('supports annual cycles with the existing first-cycle proration rule', () => {
    const fund = baseFund({ collectionStartDate: '2026-01-01', recurringFrequency: 'Yearly', defaultContributionAmount: 365 });
    const memberJoinedInSeptember = member({ startDate: '2026-09-01' });
    expect(calculateExpectedAmountForPeriod(fund, memberJoinedInSeptember, 'Year 2026')).toBe(122);
  });

  it('supports custom year intervals from the fund Collection Start Date', () => {
    const fund = baseFund({ collectionStartDate: '2026-01-01', recurringFrequency: 'Custom', customInterval: 1, customIntervalUnit: 'years', defaultContributionAmount: 1200 });
    const memberJoinedLate = member({ startDate: '2026-04-01' });
    expect(calculateExpectedAmountForPeriod(fund, memberJoinedLate, 'Cycle of Jan 1, 2026')).toBeCloseTo(904.11, 2);
    expect(calculateExpectedAmountForPeriod(fund, memberJoinedLate, 'Cycle of Jan 1, 2027')).toBe(1200);
  });

  it('supports custom day and week intervals from the fund Collection Start Date', () => {
    const fund = baseFund({
      collectionStartDate: '2026-08-26',
      recurringFrequency: 'Custom',
      customInterval: 2,
      customIntervalUnit: 'weeks',
      defaultContributionAmount: 140,
    });
    const memberJoinedLate = member({ startDate: '2026-08-30' });
    expect(calculateExpectedAmountForPeriod(fund, memberJoinedLate, 'Cycle of Aug 26, 2026')).toBe(100);
    expect(calculateExpectedAmountForPeriod(fund, memberJoinedLate, 'Cycle of Sep 9, 2026')).toBe(140);
  });

  it('suppresses only periods overlapping a member temporary stop window', () => {
    const fund = baseFund({ collectionStartDate: '2026-08-01', recurringFrequency: 'Weekly', weeklyStartDay: 'Monday' });
    const stopped = member({ stopFrom: '2026-08-12', stopUntil: '2026-08-18' });
    expect(isMemberApplicableToPeriod(fund, stopped, 'Week of Aug 10')).toBe(true);
    expect(isMemberApplicableToPeriod(fund, stopped, 'Week of Aug 24')).toBe(true);
  });
});


describe('Group Fund pause-window proration', () => {
  it('excludes an inclusive monthly pause window from Default Amount proration', () => {
    const fund = baseFund({ collectionStartDate: '2026-08-01', recurringFrequency: 'Monthly', defaultContributionAmount: 1000 });
    const pausedMember = member({ startDate: '2026-08-01', stopFrom: '2026-08-10', stopUntil: '2026-08-19' });
    expect(calculateExpectedAmountForPeriod(fund, pausedMember, 'August 2026', true)).toBeCloseTo(677.42, 2);
  });

  it('returns zero for a Daily period that falls inside the pause window', () => {
    const fund = baseFund({ collectionStartDate: '2026-08-10', recurringFrequency: 'Daily', defaultContributionAmount: 100 });
    const pausedMember = member({ startDate: '2026-08-01', stopFrom: '2026-08-10', stopUntil: '2026-08-10' });
    expect(calculateExpectedAmountForPeriod(fund, pausedMember, '2026-08-10', true)).toBe(0);
  });
});
