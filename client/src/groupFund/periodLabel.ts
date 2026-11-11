import { ONE_TIME_PERIOD } from './calculations';

type Translate = (key: any, variables?: Record<string, string | number>) => string;

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** BCP-47 locale for Intl date formatting in the selected app language. */
export function intlLocale(language: string): string {
  return language === 'en' ? 'en-IN' : `${language}-IN`;
}

function monthIndex(name: string): number {
  return MONTHS.indexOf(name.slice(0, 3).toLowerCase());
}

function formatShortDate(text: string, language: string, withYear: boolean): string | null {
  // Matches the en-US output stored in period ids: "Nov 3" or "Nov 3, 2026".
  const match = text.trim().match(/^([A-Za-z]+)\s+(\d{1,2})(?:,\s*(\d{4}))?$/);
  if (!match) return null;
  const month = monthIndex(match[1]);
  if (month < 0) return null;
  const year = match[3] ? Number(match[3]) : 2000;
  const date = new Date(Date.UTC(year, month, Number(match[2]), 12));
  return date.toLocaleDateString(intlLocale(language), { month: 'short', day: 'numeric', ...(withYear && match[3] ? { year: 'numeric' } : {}), timeZone: 'UTC' });
}

/**
 * Period ids are stored in English (they are matched against contribution notes),
 * so this renders them for display only, in the selected language.
 */
export function formatPeriodLabel(period: string, language: string, t: Translate): string {
  if (!period) return period;
  if (period === ONE_TIME_PERIOD) return t('gfPeriodOneTime');
  if (language === 'en') return period;
  const prefixed = period.match(/^(Week|Fortnight|Cycle) of (.+)$/);
  if (prefixed) {
    const date = formatShortDate(prefixed[2], language, true);
    if (date) return t(prefixed[1] === 'Week' ? 'gfPeriodWeekOf' : prefixed[1] === 'Fortnight' ? 'gfPeriodFortnightOf' : 'gfPeriodCycleOf', { date });
    return period;
  }
  const year = period.match(/^Year (\d{4})$/);
  if (year) return t('gfPeriodYear', { year: year[1] });
  const monthYear = period.match(/^([A-Za-z]+) (\d{4})$/);
  if (monthYear && monthIndex(monthYear[1]) >= 0) {
    return new Date(Date.UTC(Number(monthYear[2]), monthIndex(monthYear[1]), 15)).toLocaleDateString(intlLocale(language), { month: 'long', year: 'numeric', timeZone: 'UTC' });
  }
  const daily = formatShortDate(period, language, true);
  return daily ?? period;
}
