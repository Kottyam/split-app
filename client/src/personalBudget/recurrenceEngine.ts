import type { BudgetProfile, ExpenseTransaction, RecurringExpenseRule } from './types';

function parseDateStr(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
}

function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isDateInPauseWindow(dateStr: string, rule: RecurringExpenseRule): boolean {
  if (!rule.pauseWindows || rule.pauseWindows.length === 0) return false;
  return rule.pauseWindows.some(window => dateStr >= window.startDate && dateStr <= window.endDate);
}

export function isDateInSkipRange(dateStr: string, rule: RecurringExpenseRule): boolean {
  if (!rule.skipRanges || rule.skipRanges.length === 0) return false;
  return rule.skipRanges.some(range => dateStr >= range.startDate && dateStr <= range.endDate);
}

export function calculateNextOccurrenceDate(rule: RecurringExpenseRule, fromDateStr: string = formatDateStr(new Date())): string | null {
  if (rule.status !== 'Active') return null;
  const start = parseDateStr(rule.startDate);
  const end = rule.endDate ? parseDateStr(rule.endDate) : null;
  const cursor = parseDateStr(fromDateStr);
  if (cursor < start) cursor.setTime(start.getTime());

  for (let i = 0; i < 400; i++) {
    const dateStr = formatDateStr(cursor);
    if (end && dateStr > rule.endDate!) return null;
    if (dateStr >= rule.startDate && !isDateInPauseWindow(dateStr, rule) && isEligibleDate(cursor, rule)) {
      return dateStr;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return null;
}

function isEligibleDate(date: Date, rule: RecurringExpenseRule): boolean {
  const dateStr = formatDateStr(date);
  const start = parseDateStr(rule.startDate);
  if (date < start) return false;
  if (rule.endDate && dateStr > rule.endDate) return false;

  const freq = rule.frequency;
  if (freq === 'Daily') return true;

  if (freq === 'Weekly') {
    const targetDay = rule.dayOfWeek ?? start.getDay();
    const diffDays = Math.round((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const intervalWeeks = Math.max(1, rule.intervalCount ?? 1);
    return date.getDay() === targetDay && diffDays >= 0 && Math.floor(diffDays / 7) % intervalWeeks === 0;
  }

  if (freq === 'Monthly') {
    const targetDay = rule.dayOfMonth ?? start.getDate();
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const expectedDay = targetDay === 31 || targetDay > lastDayOfMonth ? lastDayOfMonth : targetDay;
    return date.getDate() === expectedDay;
  }

  if (freq === 'Quarterly') {
    const startMonth = start.getMonth();
    const currentMonth = date.getMonth();
    const monthDiff = (date.getFullYear() - start.getFullYear()) * 12 + (currentMonth - startMonth);
    const targetDay = rule.dayOfMonth ?? start.getDate();
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const expectedDay = targetDay === 31 || targetDay > lastDayOfMonth ? lastDayOfMonth : targetDay;
    return monthDiff >= 0 && monthDiff % 3 === 0 && date.getDate() === expectedDay;
  }

  if (freq === 'Yearly') {
    const targetMonth = (rule.monthOfYear ?? (start.getMonth() + 1)) - 1;
    const targetDay = rule.dayOfMonth ?? start.getDate();
    const lastDayOfMonth = new Date(date.getFullYear(), targetMonth + 1, 0).getDate();
    const expectedDay = targetDay === 31 || targetDay > lastDayOfMonth ? lastDayOfMonth : targetDay;
    return date.getMonth() === targetMonth && date.getDate() === expectedDay;
  }

  if (freq === 'Custom') {
    const interval = Math.max(1, rule.intervalCount || 1);
    if (rule.customUnit === 'weeks') {
      const diffDays = Math.round((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays % (interval * 7) === 0;
    }
    if (rule.customUnit === 'months') {
      const monthDiff = (date.getFullYear() - start.getFullYear()) * 12 + date.getMonth() - start.getMonth();
      const targetDay = rule.dayOfMonth ?? start.getDate();
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      return monthDiff >= 0 && monthDiff % interval === 0 && date.getDate() === (targetDay > lastDay ? lastDay : targetDay);
    }
    if (rule.customUnit === 'years') {
      const yearDiff = date.getFullYear() - start.getFullYear();
      const targetMonth = (rule.monthOfYear ?? start.getMonth() + 1) - 1;
      const targetDay = rule.dayOfMonth ?? start.getDate();
      const lastDay = new Date(date.getFullYear(), targetMonth + 1, 0).getDate();
      return yearDiff >= 0 && yearDiff % interval === 0 && date.getMonth() === targetMonth && date.getDate() === (targetDay > lastDay ? lastDay : targetDay);
    }
    const diffTime = date.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays % interval === 0;
  }

  return false;
}

export function materializeRecurringCycles(profile: BudgetProfile, targetMonth: string): ExpenseTransaction[] {
  const [yearStr, monthStr] = targetMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) return [];

  const firstDay = new Date(year, month - 1, 1, 12, 0, 0);
  const lastDay = new Date(year, month, 0, 12, 0, 0);
  const existingMap = new Map(profile.expenseTransactions.map(item => [item.id, item]));
  const generated: ExpenseTransaction[] = [];

  for (const rule of profile.recurringExpenseRules) {
    if (rule.status !== 'Active') continue;
    const start = parseDateStr(rule.startDate);
    const end = rule.endDate ? parseDateStr(rule.endDate) : null;

    const cursor = new Date(Math.max(firstDay.getTime(), start.getTime()));
    const limit = new Date(Math.min(lastDay.getTime(), end ? end.getTime() : lastDay.getTime()));

    while (cursor <= limit) {
      const dateStr = formatDateStr(cursor);
      const occurrenceId = `rec_${rule.id}_${dateStr}`;

      const existingForDate = profile.expenseTransactions.some(item => item.recurringRuleId === rule.id && item.date === dateStr);
      if (!existingMap.has(occurrenceId) && !existingForDate && !isDateInPauseWindow(dateStr, rule) && isEligibleDate(cursor, rule)) {
        const skipped = isDateInSkipRange(dateStr, rule);
        generated.push({
          id: occurrenceId,
          title: rule.title,
          category: rule.category,
          subcategory: rule.subcategory,
          amount: rule.amount,
          date: dateStr,
          status: skipped ? 'Skipped' : 'Planned',
          paymentMethod: rule.paymentMethod ?? 'UPI',
          personId: rule.personId ?? 'Self',
          includeInBudget: rule.includeInBudget !== false,
          recurringRuleId: rule.id,
          isOccurrence: true,
          amountOverride: rule.amount,
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return generated;
}

export function calculateMonthlyCommitment(rules: RecurringExpenseRule[], targetMonth: string): { commitment: number; dailyTotal: number; weeklyTotal: number; monthlyTotal: number; yearlyProvision: number } {
  let commitment = 0;
  let dailyTotal = 0;
  let weeklyTotal = 0;
  let monthlyTotal = 0;
  let yearlyProvision = 0;

  const [y, m] = targetMonth.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();

  for (const rule of rules) {
    if (rule.status === 'Archived' || rule.status === 'Deleted') continue;
    if (rule.frequency === 'Daily') {
      const ruleMonthly = rule.amount * daysInMonth;
      dailyTotal += ruleMonthly;
      commitment += ruleMonthly;
    } else if (rule.frequency === 'Weekly') {
      const ruleMonthly = rule.amount * (52 / 12);
      weeklyTotal += ruleMonthly;
      commitment += ruleMonthly;
    } else if (rule.frequency === 'Monthly' || rule.frequency === 'Quarterly') {
      const monthlyEquivalent = rule.frequency === 'Quarterly' ? rule.amount / 3 : rule.amount;
      monthlyTotal += monthlyEquivalent;
      commitment += monthlyEquivalent;
    } else if (rule.frequency === 'Yearly') {
      const monthlyProvision = rule.amount / 12;
      yearlyProvision += monthlyProvision;
      commitment += monthlyProvision;
    } else if (rule.frequency === 'Custom') {
      const interval = Math.max(1, rule.intervalCount || 1);
      const divisor = rule.customUnit === 'weeks' ? interval * 7 : rule.customUnit === 'months' ? interval * 30 : rule.customUnit === 'years' ? interval * 365 : interval;
      const monthlyEquivalent = (rule.amount / divisor) * daysInMonth;
      commitment += monthlyEquivalent;
    }
  }

  return { commitment: Math.round(commitment), dailyTotal: Math.round(dailyTotal), weeklyTotal: Math.round(weeklyTotal), monthlyTotal: Math.round(monthlyTotal), yearlyProvision: Math.round(yearlyProvision) };
}
