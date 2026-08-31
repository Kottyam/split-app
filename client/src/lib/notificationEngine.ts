import { getAllTrips } from './storage';
import { getAllSharedHomes } from '../sharedHome/storage';
import { getGroupFunds } from '../groupFund/storage';
import { getPersonalBudgetProfile } from '../personalBudget/storage';
import { simplifySettlements } from './calculations';
import { calculateExpectedAmountForPeriod, getPeriodBounds, isMemberApplicableToPeriod, resolveCollectionPeriod } from '../groupFund/calculations';
import type { KharchaNotification } from './notifications';

const AUTO_PREFIX = 'auto:';
const BACKUP_REMINDER_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

function add(list: KharchaNotification[], id: string, title: string, message: string, path: string, actionLabel = 'Open'): void {
  list.push({ id: `${AUTO_PREFIX}${id}`, title, message, createdAt: new Date().toISOString(), read: false, path, actionLabel });
}

function buildTripNotifications(): KharchaNotification[] {
  const result: KharchaNotification[] = [];
  for (const trip of getAllTrips()) {
    if (!trip?.id || !trip.endDate || !isPast(new Date(trip.endDate))) continue;
    const settlements = simplifySettlements(trip).filter(item => item.amount > 0.01);
    if (settlements.length === 0) continue;
    add(result, `trip-settlement-${trip.id}-${settlements.map(s => `${s.fromId}-${s.toId}-${s.amount}`).join('|')}`, 'Trip settlement pending', `${trip.name} has ended, but ${settlements.length} settlement${settlements.length === 1 ? '' : 's'} are still pending.`, `/trip/${trip.id}`, 'Settle now');
  }
  return result;
}

function buildSharedHomeNotifications(): KharchaNotification[] {
  const result: KharchaNotification[] = [];
  const now = new Date();
  for (const home of getAllSharedHomes()) {
    const pendingMonths = Object.entries(home.months ?? {}).filter(([monthKey, month]) => {
      const [year, monthNumber] = monthKey.split('-').map(Number);
      const monthEnd = new Date(year, monthNumber, 0, 23, 59, 59, 999);
      const outstanding = (month?.balances ?? []).some(balance => Math.abs(balance.balance) > 0.01);
      return outstanding && monthEnd.getTime() < now.getTime();
    });
    if (pendingMonths.length === 0) continue;
    const latest = pendingMonths[pendingMonths.length - 1][0];
    add(result, `home-settlement-${home.id}-${latest}-${pendingMonths.length}`, 'Shared Home settlement pending', `${home.name} has ${pendingMonths.length} month${pendingMonths.length === 1 ? '' : 's'} with unsettled balances.`, `/shared-home/${home.id}`, 'Review settlement');
  }
  return result;
}

function periodHasPendingCollection(fund: any, period: string, allowCurrentPeriod = false): boolean {
  if (!fund.isRecurring || !fund.recurringFrequency || !period || fund.closedPeriods?.includes(period)) return false;
  const bounds = getPeriodBounds(fund, period);
  if (!bounds) return false;
  if (!allowCurrentPeriod && bounds.end.getTime() >= Date.now()) return false;
  if (allowCurrentPeriod && bounds.start.getTime() > Date.now()) return false;

  return fund.members.some((member: any) => {
    if (!member.isActive || !isMemberApplicableToPeriod(fund, member, period)) return false;
    const memberBounds = getPeriodBounds(fund, period, member);
    if (!memberBounds) return false;
    const expected = Number(calculateExpectedAmountForPeriod(fund, member, period) || 0);
    if (expected <= 0) return false;
    const paid = (fund.contributions ?? [])
      .filter((c: any) => c.memberId === member.id && c.status !== 'Cancelled' && c.status !== 'Failed')
      .filter((c: any) => c.date >= memberBounds.start.getTime() && c.date <= memberBounds.end.getTime())
      .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
    return paid + 0.01 < expected;
  });
}

function buildGroupFundNotifications(): KharchaNotification[] {
  const result: KharchaNotification[] = [];
  const now = new Date();
  for (const fund of getGroupFunds()) {
    // One-time collections are also explicitly open until the manager closes them.
    // closedPeriods uses the same period-label mechanism as recurring collections.
    if (!fund.isRecurring && fund.contributionType === 'one_time') {
      const period = resolveCollectionPeriod(fund, new Date(fund.createdAt), 'future');
      if (period && !fund.closedPeriods?.includes(period)) {
        add(result, `fund-close-one-time-${fund.id}-${period}`, 'Close your collection', `${fund.name}: this one-time collection is still open. Close the collection when you are finished.`, `/group-fund/${fund.id}`, 'Close collection');
      }
      continue;
    }

    if (!fund.isRecurring || !fund.recurringFrequency) continue;
    const currentPeriod = resolveCollectionPeriod(fund, now, 'future');
    const previousPeriod = resolveCollectionPeriod(fund, now, 'past');
    const preferPrevious = fund.collectionTiming === 'previous' || fund.collectionPeriodMode === 'past';
    const duePeriod = preferPrevious
      ? (periodHasPendingCollection(fund, previousPeriod) ? previousPeriod : '')
      : (periodHasPendingCollection(fund, currentPeriod, true) ? currentPeriod : periodHasPendingCollection(fund, previousPeriod) ? previousPeriod : '');
    if (!duePeriod) continue;
    add(result, `fund-collection-${fund.id}-${duePeriod}`, 'Group Fund collection pending', `${fund.name}: the ${duePeriod} collection needs attention.`, `/group-fund/${fund.id}`, 'Open collection');
  }
  return result;
}

function buildPersonalBudgetNotifications(): KharchaNotification[] {
  const result: KharchaNotification[] = [];
  const profile: any = getPersonalBudgetProfile();
  const month = profile.selectedMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const monthExpenses = (profile.expenseTransactions ?? [])
    .filter((expense: any) => String(expense.date ?? '').slice(0, 7) === month && expense.status !== 'Cancelled' && expense.status !== 'Skipped')
    .reduce((sum: number, expense: any) => sum + Number(expense.amountOverride ?? expense.amount ?? 0), 0);
  const budgets = (profile.budgets ?? []).filter((budget: any) => budget.month === month || budget.period === month || budget.type === 'Monthly');
  const budgetAmount = budgets.length ? Number(budgets[budgets.length - 1].amount ?? 0) : 0;
  if (budgetAmount > 0 && monthExpenses >= budgetAmount) add(result, `budget-over-${month}-${Math.round(monthExpenses)}`, 'Personal budget exceeded', `Your ${month} spending is ₹${Math.round(monthExpenses).toLocaleString('en-IN')} against a ₹${Math.round(budgetAmount).toLocaleString('en-IN')} budget.`, '/personal-budget', 'Review budget');
  const overduePlanned = (profile.expenseTransactions ?? []).filter((expense: any) => expense.status === 'Planned' && expense.date && new Date(expense.date).getTime() < Date.now() - DAY_MS);
  if (overduePlanned.length) add(result, `budget-planned-${overduePlanned.length}`, 'Planned expense needs attention', `${overduePlanned.length} planned expense${overduePlanned.length === 1 ? '' : 's'} are past their planned date.`, '/personal-budget', 'Review expenses');
  return result;
}

function buildBackupNotification(): KharchaNotification[] {
  const last = localStorage.getItem('kharcha_last_backup_at');
  const stale = !last || Date.now() - new Date(last).getTime() > BACKUP_REMINDER_DAYS * DAY_MS;
  if (!stale) return [];
  const message = last ? `Your last backup was more than ${BACKUP_REMINDER_DAYS} days ago. Protect your Kharcha data with a new backup.` : 'You have not created a Kharcha backup yet. Create one to protect your data.';
  const result: KharchaNotification[] = [];
  add(result, `backup-${last ?? 'never'}`, 'Backup reminder', message, '/more', 'Open settings');
  return result;
}

export function refreshAutomaticNotifications(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const existing = JSON.parse(localStorage.getItem('kharcha_notifications') || '[]') as KharchaNotification[];
    const readState = new Map(existing.filter(item => item.id.startsWith(AUTO_PREFIX)).map(item => [item.id, item.read]));
    const generated = [...buildTripNotifications(), ...buildSharedHomeNotifications(), ...buildGroupFundNotifications(), ...buildPersonalBudgetNotifications(), ...buildBackupNotification()]
      .map(item => ({ ...item, read: readState.get(item.id) ?? false }));
    const manual = existing.filter(item => !item.id.startsWith(AUTO_PREFIX));
    localStorage.setItem('kharcha_notifications', JSON.stringify([...generated, ...manual].slice(0, 100)));
    window.dispatchEvent(new Event('kharcha-notifications-updated'));
  } catch (error) {
    console.error('Failed to refresh automatic notifications:', error);
  }
}
