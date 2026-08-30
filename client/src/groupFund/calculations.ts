import type { GroupFund, GroupFundMember } from './types';

const DAY_MS = 1000 * 60 * 60 * 24;

type PeriodBounds = { start: Date; end: Date };

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Return the fund Collection Start Date, with a legacy-safe creation-date fallback. */
export function getFundCollectionStartTime(fund: GroupFund): number {
  if (fund.collectionStartDate) {
    const parsed = new Date(`${fund.collectionStartDate}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
  }
  return fund.createdAt;
}

/** Return the member Join Date, with a legacy-safe fallback. */
export function getMemberStartTime(fund: GroupFund, member: GroupFundMember): number {
  if (member.startDate) {
    const parsed = new Date(`${member.startDate}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
  }
  return member.dateJoined ?? member.createdAt ?? fund.createdAt;
}

/** Recurring eligibility begins on the later of the fund and member dates. */
export function getEffectiveStartTime(fund: GroupFund, member: GroupFundMember): number {
  if (!fund.isRecurring) return getMemberStartTime(fund, member);
  return Math.max(getFundCollectionStartTime(fund), getMemberStartTime(fund, member));
}

export function getWeekStartForDate(date: Date, weeklyStartDay: 'Monday' | 'Sunday' = 'Monday'): Date {
  const startDayOffset = weeklyStartDay === 'Sunday' ? 0 : 1;
  const daysFromStart = (date.getDay() - startDayOffset + 7) % 7;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysFromStart);
}

function customCycleStart(start: Date, fund: GroupFund, direction: 1 | -1): Date {
  const interval = Math.max(1, fund.customInterval ?? 1) * direction;
  if (fund.customIntervalUnit === 'weeks') return new Date(start.getFullYear(), start.getMonth(), start.getDate() + interval * 7);
  if (fund.customIntervalUnit === 'months') return new Date(start.getFullYear(), start.getMonth() + interval, start.getDate());
  if (fund.customIntervalUnit === 'years') return new Date(start.getFullYear() + interval, start.getMonth(), start.getDate());
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + interval);
}

/** Return the start of the recurring period represented by the app's period label. */
export type CollectionPeriodMode = 'past' | 'future';

/** Resolve a collection date to the exact cycle represented by the app’s existing period labels. */
export function resolveCollectionPeriod(fund: GroupFund, collectionDate: Date, mode: CollectionPeriodMode = 'future'): string {
  const date = new Date(collectionDate.getFullYear(), collectionDate.getMonth(), collectionDate.getDate());
  if (!fund.isRecurring) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  if (fund.recurringFrequency === 'Daily') {
    const day = mode === 'past' ? new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1) : date;
    return day.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  if (fund.recurringFrequency === 'Weekly') {
    const currentStart = getWeekStartForDate(date, fund.weeklyStartDay ?? 'Monday');
    const start = mode === 'past' ? new Date(currentStart.getTime() - 7 * DAY_MS) : currentStart;
    return `Week of ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }

  if (fund.recurringFrequency === 'Fortnightly') {
    const configuredAnchor = new Date(getFundCollectionStartTime(fund));
    const boundary = fund.fortnightlyCycleBoundary === 'Start-Date Based — Every 14 Days'
      ? configuredAnchor
      : getWeekStartForDate(configuredAnchor, fund.fortnightlyCycleBoundary === 'Sunday-based 14-day cycle' ? 'Sunday' : 'Monday');
    const anchor = new Date(boundary.getFullYear(), boundary.getMonth(), boundary.getDate());
    const cycles = Math.floor((date.getTime() - anchor.getTime()) / (14 * DAY_MS));
    let start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + cycles * 14);
    if (mode === 'past') start = new Date(start.getFullYear(), start.getMonth(), start.getDate() - 14);

    return `Fortnight of ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  if (fund.recurringFrequency === 'Yearly') {
    const year = date.getFullYear() + (mode === 'past' ? -1 : 0);
    return `Year ${year}`;
  }

  if (fund.recurringFrequency === 'Custom') {
    const interval = Math.max(1, fund.customInterval ?? 1);
    const anchor = new Date(getFundCollectionStartTime(fund));
    let start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
    let steps = 0;
    while (customCycleStart(start, fund, 1).getTime() <= date.getTime() && steps < 120) {
      start = customCycleStart(start, fund, 1);
      steps += 1;
    }
    while (start.getTime() > date.getTime() && steps > -120) {
      start = customCycleStart(start, fund, -1);
      steps -= 1;
    }
    if (mode === 'past') start = customCycleStart(start, fund, -1);
    return `Cycle of ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  const start = new Date(date.getFullYear(), date.getMonth() + (mode === 'past' ? -1 : 0), 1);
  return start.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export function getPeriodStart(fund: GroupFund, period: string): Date | undefined {
  if (!period) return undefined;
  if (fund.recurringFrequency === 'Daily') {
    const parsed = new Date(period);
    return Number.isNaN(parsed.getTime()) ? undefined : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }
  if (fund.recurringFrequency === 'Weekly') {
    const label = period.replace(/^Week of /, '');
    const match = label.match(/^([A-Za-z]+) (\d{1,2})(?:, (\d{4}))?$/);
    const parsed = match
      ? new Date(`${match[1]} ${match[2]}, ${match[3] ?? new Date().getFullYear()}`)
      : new Date(label);
    if (Number.isNaN(parsed.getTime())) return undefined;
    return getWeekStartForDate(new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()), fund.weeklyStartDay ?? 'Monday');
  }
  if (fund.recurringFrequency === 'Fortnightly') {
    const parsed = new Date(period.replace(/^Fortnight of /, ''));
    if (Number.isNaN(parsed.getTime())) return undefined;
    const date = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    if (fund.fortnightlyCycleBoundary === 'Start-Date Based — Every 14 Days') {
      const anchor = new Date(getFundCollectionStartTime(fund));
      const cycles = Math.floor((date.getTime() - new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate()).getTime()) / (14 * DAY_MS));
      return new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + Math.max(0, cycles) * 14);
    }
    const weekStart = getWeekStartForDate(date, fund.fortnightlyCycleBoundary === 'Sunday-based 14-day cycle' ? 'Sunday' : 'Monday');
    const anchor = new Date(getFundCollectionStartTime(fund));
    const boundary = getWeekStartForDate(new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate()), fund.fortnightlyCycleBoundary === 'Sunday-based 14-day cycle' ? 'Sunday' : 'Monday');
    const cycles = Math.floor((weekStart.getTime() - boundary.getTime()) / (14 * DAY_MS));
    return new Date(boundary.getFullYear(), boundary.getMonth(), boundary.getDate() + Math.max(0, cycles) * 14);
  }
  if (fund.recurringFrequency === 'Yearly') {
    const match = period.match(/(\d{4})$/);
    return match ? new Date(Number(match[1]), 0, 1) : undefined;
  }
  if (fund.recurringFrequency === 'Custom') {
    const parsed = new Date(period.replace(/^Cycle of /, ''));
    return Number.isNaN(parsed.getTime()) ? undefined : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }
  const parsed = new Date(`1 ${period}`);
  return Number.isNaN(parsed.getTime()) ? undefined : new Date(parsed.getFullYear(), parsed.getMonth(), 1);
}

export function getPeriodEnd(fund: GroupFund, period: string, member?: GroupFundMember): Date | undefined {
  const bounds = getPeriodBounds(fund, period, member);
  return bounds?.end;
}

function getMonthlyJoinDateBounds(periodStart: Date, member: GroupFundMember, fund: GroupFund, useMemberJoinDateOnly = false): PeriodBounds {
  const effective = new Date(useMemberJoinDateOnly ? getMemberStartTime(fund, member) : getEffectiveStartTime(fund, member));
  const startDay = Math.min(effective.getDate(), getDaysInMonth(periodStart.getFullYear(), periodStart.getMonth()));
  const start = new Date(periodStart.getFullYear(), periodStart.getMonth(), startDay);
  const end = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, startDay - 1);
  return { start, end };
}

export function getPeriodBounds(fund: GroupFund, period: string, member?: GroupFundMember, useMemberJoinDateOnly = false): PeriodBounds | undefined {
  const start = getPeriodStart(fund, period);
  if (!start) return undefined;
  if (fund.recurringFrequency === 'Daily') return { start, end: new Date(start) };
  if (fund.recurringFrequency === 'Weekly') return { start, end: new Date(start.getTime() + 6 * DAY_MS) };
  if (fund.recurringFrequency === 'Fortnightly') return { start, end: new Date(start.getTime() + 13 * DAY_MS) };
  if (fund.recurringFrequency === 'Yearly') return { start, end: new Date(start.getFullYear(), 11, 31) };
  if (fund.recurringFrequency === 'Custom') {
    const interval = Math.max(1, fund.customInterval ?? 1);
    if (fund.customIntervalUnit === 'weeks') return { start, end: new Date(start.getTime() + (interval * 7 - 1) * DAY_MS) };
    if (fund.customIntervalUnit === 'months') return { start, end: new Date(start.getFullYear(), start.getMonth() + interval, start.getDate() - 1) };
    if (fund.customIntervalUnit === 'years') return { start, end: new Date(start.getFullYear() + interval, start.getMonth(), start.getDate() - 1) };
    return { start, end: new Date(start.getTime() + (interval - 1) * DAY_MS) };
  }
  if (fund.monthlyCycleType === 'Join-Date Cycle (e.g. 15th to 14th)' && member) {
    return getMonthlyJoinDateBounds(start, member, fund, useMemberJoinDateOnly);
  }
  return { start, end: new Date(start.getFullYear(), start.getMonth() + 1, 0) };
}

export function isMemberApplicableToPeriod(fund: GroupFund, member: GroupFundMember, period: string, useMemberJoinDateOnly = false): boolean {
  if (!fund.isRecurring) return true;
  const effectiveStart = useMemberJoinDateOnly ? getMemberStartTime(fund, member) : getEffectiveStartTime(fund, member);
  const periodBounds = getPeriodBounds(fund, period, member, useMemberJoinDateOnly);
  if (!periodBounds) return effectiveStart <= Date.now();
  if (effectiveStart > periodBounds.end.getTime()) return false;
  const stopFrom = member.stopFrom ? new Date(`${member.stopFrom}T00:00:00`).getTime() : undefined;
  const stopUntil = member.stopUntil ? new Date(`${member.stopUntil}T23:59:59`).getTime() : undefined;
  const fullyStopped = stopFrom !== undefined && stopUntil !== undefined && stopFrom <= periodBounds.start.getTime() && stopUntil >= periodBounds.end.getTime();
  if (fullyStopped) return false;
  return member.recurringActive !== false;
}

function inclusiveDays(start: Date, end: Date): number {
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1);
}

function isPausedOnDay(member: GroupFundMember, day: Date): boolean {
  const pauseStart = member.stopFrom ? new Date(`${member.stopFrom}T00:00:00`) : undefined;
  const pauseEnd = member.stopUntil ? new Date(`${member.stopUntil}T23:59:59`) : undefined;
  if (!pauseStart || !pauseEnd || Number.isNaN(pauseStart.getTime()) || Number.isNaN(pauseEnd.getTime())) return false;
  const time = day.getTime();
  return time >= pauseStart.getTime() && time <= pauseEnd.getTime();
}

function activeDaysBetween(member: GroupFundMember, start: Date, end: Date): number {
  let activeDays = 0;
  const totalDays = inclusiveDays(start, end);
  for (let offset = 0; offset < totalDays; offset += 1) {
    const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset);
    if (!isPausedOnDay(member, day)) activeDays += 1;
  }
  return activeDays;
}

function baseAmountFor(fund: GroupFund, member: GroupFundMember): number {
  return fund.amountType === 'Variable Amount'
    ? (member.expectedAmount ?? 0)
    : (member.expectedAmount ?? fund.defaultContributionAmount ?? 0);
}

function calculateAmountForBounds(fund: GroupFund, member: GroupFundMember, bounds: PeriodBounds, useMemberJoinDateOnly = false): number {
  const baseAmount = baseAmountFor(fund, member);
  if (!fund.isRecurring || fund.amountType === 'Variable Amount') return baseAmount;

  const effectiveStart = new Date(useMemberJoinDateOnly ? getMemberStartTime(fund, member) : getEffectiveStartTime(fund, member));
  if (effectiveStart.getTime() > bounds.end.getTime()) return 0;
  const chargeStart = effectiveStart.getTime() > bounds.start.getTime() ? effectiveStart : bounds.start;
  const totalCycleDays = inclusiveDays(bounds.start, bounds.end);
  const eligibleDays = activeDaysBetween(member, chargeStart, bounds.end);
  if (eligibleDays <= 0) return 0;
  if (fund.prorationRule === 'Full Amount') return baseAmount;
  return Number(((baseAmount / totalCycleDays) * eligibleDays).toFixed(2));
}

function getBoundsForDate(fund: GroupFund, member: GroupFundMember, targetDate: Date): PeriodBounds | undefined {
  if (!fund.recurringFrequency) return undefined;
  if (fund.recurringFrequency === 'Daily') {
    const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    return { start, end: start };
  }
  if (fund.recurringFrequency === 'Weekly') {
    const start = getWeekStartForDate(targetDate, fund.weeklyStartDay ?? 'Monday');
    return { start, end: new Date(start.getTime() + 6 * DAY_MS) };
  }
  if (fund.recurringFrequency === 'Fortnightly') {
    const period = getPeriodStart(fund, `Fortnight of ${targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
    return period ? { start: period, end: new Date(period.getTime() + 13 * DAY_MS) } : undefined;
  }
  if (fund.recurringFrequency === 'Yearly') {
    const start = new Date(targetDate.getFullYear(), 0, 1);
    return { start, end: new Date(targetDate.getFullYear(), 11, 31) };
  }
  if (fund.recurringFrequency === 'Custom') {
    const anchor = new Date(getFundCollectionStartTime(fund));
    const interval = Math.max(1, fund.customInterval ?? 1);
    let index = 0;
    let start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
    while (start.getTime() > targetDate.getTime() && index > -120) { index -= 1; start = customCycleStart(start, fund, -1); }
    while (customCycleStart(start, fund, 1).getTime() <= targetDate.getTime() && index < 120) { index += 1; start = customCycleStart(start, fund, 1); }
    return getPeriodBounds(fund, `Cycle of ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
  }
  const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
  if (fund.monthlyCycleType === 'Join-Date Cycle (e.g. 15th to 14th)') {
    return getMonthlyJoinDateBounds(monthStart, member, fund);
  }
  return { start: monthStart, end: new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0) };
}

/** Calculate the expected amount for a target date using the same per-member recurring engine. */
export function calculateExpectedAmount(fund: GroupFund, member: GroupFundMember, targetDate: Date = new Date()): number {
  const baseAmount = baseAmountFor(fund, member);
  if (!fund.isRecurring || fund.amountType === 'Variable Amount' || fund.prorationRule === 'Full Amount') return baseAmount;
  const bounds = getBoundsForDate(fund, member, targetDate);
  return bounds ? calculateAmountForBounds(fund, member, bounds) : baseAmount;
}

/** Calculate the member-add Expected Amount for a specific cycle from the fund Default Amount. */
export function calculateMemberAddExpectedAmount(fund: GroupFund, member: GroupFundMember, joinDate: Date, period?: string): number {
  if (fund.amountType === 'Variable Amount') return member.expectedAmount ?? 0;
  const draftMember = { ...member, expectedAmount: undefined, startDate: joinDate.toISOString().slice(0, 10) };
  return period
    ? calculateExpectedAmountForPeriod(fund, draftMember, period, false)
    : calculateExpectedAmount(fund, draftMember, joinDate);
}

/** Resolve the configured Fund collection cycle first, then calculate member-add Expected Amount from that cycle. */
export function calculateMemberAddExpectedAmountForConfiguredPeriod(fund: GroupFund, member: GroupFundMember, joinDate: Date, collectionDate: Date = new Date()): number {
  const mode = fund.recurringFrequency === 'Daily'
    ? 'future'
    : fund.collectionTiming === 'previous'
      ? 'past'
      : fund.collectionTiming === 'advance'
        ? 'future'
        : (fund.collectionPeriodMode ?? 'future');
  const period = resolveCollectionPeriod(fund, collectionDate, mode);
  if (mode === 'future' && fund.isRecurring && fund.amountType === 'Default Amount') {
    return fund.defaultContributionAmount ?? 0;
  }
  if (mode === 'past' && fund.isRecurring && fund.amountType === 'Default Amount') {
    const draftMember = { ...member, expectedAmount: undefined, startDate: joinDate.toISOString().slice(0, 10) };
    return calculateExpectedAmountForPeriod(fund, draftMember, period, true);
  }
  return calculateMemberAddExpectedAmount(fund, member, joinDate, period);
}

/** Calculate one recurring period independently for the selected member. */
export function calculateExpectedAmountForPeriod(fund: GroupFund, member: GroupFundMember, period: string, useMemberJoinDateOnly = false): number {
  if (!fund.isRecurring) return baseAmountFor(fund, member);
  if (!isMemberApplicableToPeriod(fund, member, period, useMemberJoinDateOnly)) return 0;
  const bounds = getPeriodBounds(fund, period, member, useMemberJoinDateOnly);
  return bounds ? calculateAmountForBounds(fund, member, bounds, useMemberJoinDateOnly) : baseAmountFor(fund, member);
}

/** Human-readable local date value for the member form. */
export function getMemberStartDateValue(fund: GroupFund, member?: GroupFundMember): string {
  if (member?.startDate) return member.startDate;
  return new Date(member?.dateJoined ?? member?.createdAt ?? fund.createdAt).toISOString().slice(0, 10);
}
