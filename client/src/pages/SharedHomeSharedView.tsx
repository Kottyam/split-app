import React, { useMemo } from 'react';
import { Eye, Home as HomeIcon } from 'lucide-react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { decodeSharedHomeSnapshot } from '@/sharedHome/share';
import { generateHouseholdSettlements, monthBounds, monthKeyFromDate, roundMoney } from '@/sharedHome/calculations';
import type { SharedHome } from '@/sharedHome/types';
import { useLanguage } from '@/contexts/LanguageContext';
import AppSectionHeader from '@/components/AppSectionHeader';

function money(value: number): string {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function sharedHomeCategoryLabel(t: (key: any, variables?: any) => string, category: string): string {
  const keys: Record<string, string> = {
    Rent: 'sharedHomeRent',
    Food: 'sharedHomeCategoryFood',
    Groceries: 'sharedHomeGroceries',
    Electricity: 'sharedHomeCategoryElectricity',
    Utilities: 'auditUtilities',
    Water: 'sharedHomeCategoryWater',
    Gas: 'sharedHomeCategoryGas',
    Internet: 'sharedHomeCategoryInternet',
    'Wi-Fi / Internet': 'sharedHomeCategoryInternet',
    Cleaning: 'sharedHomeCategoryCleaning',
    Maintenance: 'sharedHomeCategoryMaintenance',
    Transport: 'auditTransport',
    'Household Supplies': 'sharedHomeCategorySupplies',
    Other: 'sharedHomeCategoryOther',
  };
  return keys[category] ? t(keys[category]) : category;
}

function localeFor(language: string): string {
  return language === 'en' ? 'en-IN' : `${language}-IN`;
}

function displayMonth(month: string, language: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString(localeFor(language), { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function displayDate(timestamp: number, language: string): string {
  return new Date(timestamp).toLocaleDateString(localeFor(language), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function inRange(timestamp: number, start: number, end: number): boolean {
  return timestamp >= start && timestamp <= end;
}

function periodInRange(monthKey: string, start: number, end: number): boolean {
  const bounds = monthBounds(monthKey);
  return bounds.end >= start && bounds.start <= end;
}

function reportLabel(snapshotRange: { startDate?: number; endDate?: number } | undefined, language: string, fullHistoryLabel: string): string {
  if (!snapshotRange || (snapshotRange.startDate === undefined && snapshotRange.endDate === undefined)) return fullHistoryLabel;
  const start = snapshotRange.startDate ?? snapshotRange.endDate ?? Date.now();
  const end = snapshotRange.endDate ?? snapshotRange.startDate ?? start;
  const startMonth = monthKeyFromDate(start);
  const endMonth = monthKeyFromDate(end);
  if (startMonth === endMonth) return displayMonth(startMonth, language);
  return `${displayDate(start, language)} – ${displayDate(end, language)}`;
}

export function buildSharedHomeViewReport(home: SharedHome, start: number, end: number) {
  const expenses = home.expenses.filter(expense => expense.status === 'active' && inRange(expense.date, start, end));
  const rentPeriods = home.rentPeriods.filter(period => periodInRange(period.monthKey, start, end));
  const byCategory: Record<string, number> = {};
  let shared = 0;
  let personal = 0;
  expenses.forEach(expense => {
    byCategory[expense.category] = roundMoney((byCategory[expense.category] ?? 0) + expense.amount);
    if (expense.sharedBy.length > 1) shared = roundMoney(shared + expense.amount);
    else personal = roundMoney(personal + expense.amount);
  });
  const rent = roundMoney(rentPeriods.reduce((sum, period) => sum + period.totalRent, 0));
  if (rent) byCategory.Rent = roundMoney((byCategory.Rent ?? 0) + rent);

  const shares: Record<string, number> = {};
  const paid: Record<string, number> = {};
  home.members.forEach(member => { shares[member.id] = 0; paid[member.id] = 0; });
  rentPeriods.forEach(period => Object.entries(period.allocations).forEach(([memberId, amount]) => { shares[memberId] = roundMoney((shares[memberId] ?? 0) + amount); }));
  expenses.forEach(expense => {
    if (expense.sharedBy.length <= 1) return;
    paid[expense.paidBy] = roundMoney((paid[expense.paidBy] ?? 0) + expense.amount);
    Object.entries(expense.shares).forEach(([memberId, amount]) => { shares[memberId] = roundMoney((shares[memberId] ?? 0) + amount); });
  });
  const balances = home.members.map(member => ({
    memberId: member.id,
    share: roundMoney(shares[member.id] ?? 0),
    paid: roundMoney(paid[member.id] ?? 0),
    balance: roundMoney((paid[member.id] ?? 0) - (shares[member.id] ?? 0)),
  }));
  return { expenses, balances, settlements: generateHouseholdSettlements(balances), totals: { total: roundMoney(expenses.reduce((sum, expense) => sum + expense.amount, 0) + rent), rent, shared, personal, byCategory } };
}

export default function SharedHomeSharedView() {
  const { t, language } = useLanguage();
  const [, params] = useRoute('/shared-home-share/:payload');
  const [, navigate] = useLocation();
  const snapshot = useMemo(() => params?.payload ? decodeSharedHomeSnapshot(params.payload) : null, [params?.payload]);
  const home = snapshot?.home;
  const rangeStart = snapshot?.range?.startDate ?? Number.NEGATIVE_INFINITY;
  const rangeEnd = snapshot?.range?.endDate ?? Number.POSITIVE_INFINITY;
  const report = useMemo(() => home ? buildSharedHomeViewReport(home as SharedHome, rangeStart, rangeEnd) : null, [home, rangeStart, rangeEnd]);
  const periodLabel = reportLabel(snapshot?.range, language, t('sharedHomeFullGroupHistory'));

  if (!home || !report) return <div className="min-h-screen grid place-items-center bg-kharcha-cream"><Card className="p-6"><p className="font-bold">{t('sharedHomeInvalidLink')}</p><Button className="mt-4" onClick={() => navigate('/')}>{t('sharedHomeBackToKharcha')}</Button></Card></div>;

  return <div className="min-h-screen bg-kharcha-cream pb-10"><AppSectionHeader title={home.name} onBack={() => navigate('/')} backLabel={t('sharedHomeBackAriaLabel')} actions={<span className="inline-flex w-full items-center gap-1 rounded-xl bg-[#f2fbf3] px-3 py-2 text-xs font-bold text-[#16834b]"><Eye size={14} /> {t('viewOnly')}</span>} /><main className="mx-auto max-w-4xl space-y-4 px-4 py-4"><Card className="rounded-2xl border-2 border-[#16834b] bg-[#f2fbf3] p-4"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#b9ddc9]"><HomeIcon size={21} /></span><div><p className="text-sm text-gray-600">{t('sharedHomeViewOnlySnapshot')}</p><p className="font-bold text-kharcha-navy">{t('sharedHomeOriginalNotEditable')}</p><p className="mt-1 text-xs text-gray-600">{periodLabel}</p></div></div></Card><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Summary label={t('sharedHomeMembers')} value={String(home.members.length)} /><Summary label={t('sharedHomeExpenses')} value={money(report.totals.total)} /><Summary label={t('sharedHomeRooms')} value={String(home.rooms.length)} /><Summary label={t('sharedHomeMonthLabel')} value={periodLabel} /></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-5"><Summary label={t('sharedHomeCommon')} value={money(report.totals.shared)} /><Summary label={t('sharedHomePersonal')} value={money(report.totals.personal)} /><Summary label={t('auditTotalRent' as any)} value={money(report.totals.rent)} /><Summary label={t('sharedHomeTotalShare')} value={money(report.balances.reduce((sum, item) => sum + item.share, 0))} /><Summary label={t('sharedHomePaidAmount')} value={money(report.balances.reduce((sum, item) => sum + item.paid, 0))} /></div><Card className="rounded-2xl border bg-white p-4"><h2 className="text-xl font-black text-kharcha-navy">{t('sharedHomeMembers')} & {t('summary')}</h2>{report.balances.length ? <div className="mt-3 space-y-2">{report.balances.map(balance => { const member = home.members.find(item => item.id === balance.memberId); return <div key={balance.memberId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#fffaf3] px-3 py-2"><div><p className="font-bold">{member?.name ?? t('sharedHomeUnknown')}</p><p className="text-xs text-gray-500">{t('sharedHomeShareAmount')} {money(balance.share)} · {t('sharedHomePaidAmount')} {money(balance.paid)}</p></div><strong className={balance.balance >= 0 ? 'text-[#16834b]' : 'text-red-600'}>{balance.balance >= 0 ? `${t('sharedHomeGetsAmount')} ${money(balance.balance)}` : `${t('sharedHomeOwesAmount')} ${money(Math.abs(balance.balance))}`}</strong></div>; })}</div> : <p className="mt-3 text-sm text-gray-600">{t('sharedHomeAddMembers')}</p>}</Card><Card className="rounded-2xl border bg-white p-4"><h2 className="text-xl font-black text-kharcha-navy">{t('sharedHomeSettlements')}</h2>{report.settlements.length ? <div className="mt-3 space-y-2">{report.settlements.map(item => <div key={`${item.fromMemberId}-${item.toMemberId}`} className="flex items-center justify-between rounded-xl bg-[#f2fbf3] px-3 py-2 text-sm"><span>{home.members.find(member => member.id === item.fromMemberId)?.name ?? t('sharedHomeUnknown')} {t('sharedHomeOwesTo')} {home.members.find(member => member.id === item.toMemberId)?.name ?? t('sharedHomeUnknown')}</span><strong>{money(item.amount)}</strong></div>)}</div> : <p className="mt-3 text-sm text-gray-600">{t('sharedHomeEveryoneSettled')}</p>}</Card><Card className="rounded-2xl border bg-white p-4"><h2 className="text-xl font-black text-kharcha-navy">{t('sharedHomeExpenses')}</h2>{report.expenses.length ? <div className="mt-3 space-y-2">{report.expenses.map(expense => <div key={expense.id} className="flex items-start justify-between gap-3 rounded-xl border px-3 py-2"><div><p className="font-bold">{expense.name}</p><p className="text-xs text-gray-500">{sharedHomeCategoryLabel(t, expense.category)} · {t('sharedHomePaidByLabel')} {home.members.find(member => member.id === expense.paidBy)?.name ?? t('sharedHomeUnknown')} · {displayDate(expense.date, language)}</p></div><strong>{money(expense.amount)}</strong></div>)}</div> : <p className="mt-3 text-sm text-gray-600">{t('sharedHomeNothingThisMonth')}</p>}</Card><Card className="rounded-2xl border bg-white p-4"><h2 className="text-xl font-black text-kharcha-navy">{t('sharedHomeCalculationDetails')}</h2>{Object.keys(report.totals.byCategory).length ? <div className="mt-3 space-y-2">{Object.entries(report.totals.byCategory).map(([category, amount]) => <div key={category} className="flex justify-between text-sm"><span>{sharedHomeCategoryLabel(t, category)}</span><strong>{money(amount)}</strong></div>)}<div className="flex justify-between border-t pt-2 font-black"><span>{t('total')}</span><span>{money(report.totals.total)}</span></div></div> : <p className="mt-3 text-sm text-gray-600">{t('sharedHomeNothingThisMonth')}</p>}</Card></main></div>;
}

function Summary({ label, value }: { label: string; value: string }) { return <Card className="rounded-xl border bg-white p-3"><p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{label}</p><p className="mt-1 text-lg font-black text-kharcha-navy">{value}</p></Card>; }
