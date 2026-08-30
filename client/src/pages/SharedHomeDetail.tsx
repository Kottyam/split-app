import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, CalendarDays, CheckCircle2, ChevronRight, Download, Home as HomeIcon, Plus, Printer, Receipt, Share2, Users, Wallet, X } from 'lucide-react';
import BudgetCard from '@/budget/BudgetCard';
import BudgetDialog from '@/budget/BudgetDialog';
import BudgetDetailsDialog from '@/budget/BudgetDetailsDialog';
import { calculateSharedHomeBudget, getEffectiveSharedHomeBudgetConfig } from '@/budget/types';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import SharedHomeExpenseDialog from '@/components/SharedHomeExpenseDialog';
import SharedHomeMemberDialog from '@/components/SharedHomeMemberDialog';
import SharedHomeRentDialog from '@/components/SharedHomeRentDialog';
import SharedHomeRoomDialog from '@/components/SharedHomeRoomDialog';
import SharedHomeShareDialog from '@/components/SharedHomeShareDialog';
import EditSyncBackBar from '@/components/EditSyncBackBar';
import EditSyncReviewBar from '@/components/EditSyncReviewBar';
import SharedHomeRecurringDialog from '@/components/SharedHomeRecurringDialog';
import SharedHomePaymentRequestDialog from '@/components/SharedHomePaymentRequestDialog';
import { copyToClipboard, shareLink } from '@/lib/shareLink';
import { appendUniqueMembers } from '@/lib/memberImport';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDeleteConfirmation } from '@/contexts/DeleteConfirmationContext';
import { toast } from 'sonner';
import type { LanguageCode, TranslationKey } from '@/contexts/LanguageContext';
import { generateSharedHomeShareLink } from '@/sharedHome/share';
import { launchSharedHomeUpiPayment, shareSharedHomePaymentRequest, type SharedHomePaymentRequest } from '@/sharedHome/paymentRequest';
import { buildRentPeriod, upsertRentPeriod } from '@/sharedHome/rentPersistence';
import type { RentAdjustmentAudit } from '@/sharedHome/rentPersistence';
import { getSharedHomeById, saveSharedHome } from '@/sharedHome/storage';
import AppSectionHeader from '@/components/AppSectionHeader';
import { KHARCHA_LOGO_LOCKUP } from '@/components/BrandLogo';
import { PDF_LAYOUT_CSS } from '@/lib/pdfLayout';
import { calculateMonthlyBalances, calculateRentAllocations, generateHouseholdSettlements, generatePendingHouseholdSettlements, getExpenseTotals, materializeRecurringExpenses, monthKeyFromDate, monthBounds } from '@/sharedHome/calculations';
import type { HouseholdExpense, HouseholdExpenseKind, MonthlyBalance, RentConfig, RentAllocationLine, RecurringRule, SharedHome, SharedHomeMember, SharedHomeRoom } from '@/sharedHome/types';
import { nanoid } from 'nanoid';

export const primaryTabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'recurring', label: 'Recurring', icon: CalendarDays },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'settlements', label: 'Settlements', icon: CheckCircle2 },
  { id: 'reports', label: 'Report', icon: BarChart3 },
] as const;

type TabId = typeof primaryTabs[number]['id'];
type ExpenseSort = 'newest' | 'oldest' | 'highest' | 'lowest';
type ReportRange = 'current' | 'previous' | 'custom';
const tabTranslationKeys: Record<TabId, TranslationKey> = { overview: 'sharedHomeOverview', expenses: 'sharedHomeExpenses', recurring: 'sharedHomeRecurring', members: 'sharedHomeMembers', settlements: 'sharedHomeSettlements', reports: 'sharedHomeReports' };
const rentMethodTranslationKeys: Record<RentConfig['splitMethod'], TranslationKey> = { 'equal-person': 'sharedHomeEqualPerPerson', 'equal-room': 'sharedHomeEqualPerRoom', 'room-fixed': 'sharedHomeRoomFixedRent', 'stay-days': 'sharedHomeStayDaysBased', custom: 'sharedHomeCustomAmount' };
const stayBasisTranslationKeys: Record<RentConfig['stayDayBasis'], TranslationKey> = { calendar: 'sharedHomeCalendarDays', fixed30: 'sharedHomeFixed30Days' };
const sharedHomeCategoryTranslationKeys: Record<string, TranslationKey> = { Rent: 'sharedHomeRent', Food: 'sharedHomeCategoryFood', Groceries: 'sharedHomeGroceries', Electricity: 'sharedHomeCategoryElectricity', Water: 'sharedHomeCategoryWater', Gas: 'sharedHomeCategoryGas', 'Wi-Fi / Internet': 'sharedHomeCategoryInternet', Maintenance: 'sharedHomeCategoryMaintenance', Cleaning: 'sharedHomeCategoryCleaning', 'Household Supplies': 'sharedHomeCategorySupplies', Transport: 'pbTransport' as TranslationKey, Utilities: 'sharedHomeCategoryUtilities', Other: 'sharedHomeCategoryOther' };
const sharedHomeCategoryValues = ['Rent', 'Food', 'Groceries', 'Electricity', 'Gas', 'Water', 'Wi-Fi / Internet', 'Cleaning', 'Maintenance', 'Transport', 'Other'];

function sharedHomeCategoryLabel(t: (key: TranslationKey, variables?: Record<string, string | number>) => string, category: string): string {
  const key = sharedHomeCategoryTranslationKeys[category];
  return key ? t(key) : category;
}

function displayDate(value: number, language: LanguageCode): string {
  const locale = language === 'en' ? 'en-IN' : `${language}-IN`;
  return new Date(value).toLocaleDateString(locale);
}

function recurringStatusLabel(t: (key: any, variables?: any) => string, status: RecurringRule['status']): string {
  return t(status === 'active' ? 'auditStatusActive' : status === 'paused' ? 'auditStatusPaused' : 'auditStatusStopped');
}

function paymentMethodLabel(t: (key: any, variables?: any) => string, method: string): string {
  return t(method.toLowerCase() === 'cash' ? 'auditPaymentCash' : 'auditPaymentUpi');
}

function money(value: number): string {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function displayMonth(monthKey: string, language: LanguageCode = 'en'): string {
  const [year, month] = monthKey.split('-').map(Number);
  const locale = language === 'en' ? 'en-IN' : `${language}-IN`;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function monthFromOffset(monthKey: string, offset: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function reportBounds(monthKey: string, range: ReportRange, fromDate: string, toDate: string): { start: number; end: number; label: string } {
  if (range === 'custom' && (fromDate || toDate)) {
    const start = fromDate ? new Date(`${fromDate}T00:00:00Z`).getTime() : Number.NEGATIVE_INFINITY;
    const end = toDate ? new Date(`${toDate}T23:59:59Z`).getTime() : Number.POSITIVE_INFINITY;
    return { start, end, label: `${fromDate || '…'} – ${toDate || '…'}` };
  }
  const key = range === 'previous' ? monthFromOffset(monthKey, -1) : monthKey;
  const bounds = monthBounds(key);
  return { start: bounds.start, end: bounds.end, label: displayMonth(key) };
}

function reportExpenses(home: SharedHome, bounds: { start: number; end: number }): HouseholdExpense[] {
  return home.expenses.filter(expense => expense.status === 'active' && expense.date >= bounds.start && expense.date <= bounds.end);
}

function aggregateReportBalances(home: SharedHome, expenses: HouseholdExpense[], rentAllocations: Record<string, number> = {}): MonthlyBalance[] {
  const shares: Record<string, number> = Object.fromEntries(home.members.map(member => [member.id, 0]));
  const paid: Record<string, number> = Object.fromEntries(home.members.map(member => [member.id, 0]));
  expenses.forEach(expense => {
    if (expense.sharedBy.length <= 1) return;
    paid[expense.paidBy] = roundCurrency((paid[expense.paidBy] ?? 0) + expense.amount);
    Object.entries(expense.shares).forEach(([memberId, amount]) => { shares[memberId] = roundCurrency((shares[memberId] ?? 0) + amount); });
  });
  Object.entries(rentAllocations).forEach(([memberId, amount]) => { shares[memberId] = roundCurrency((shares[memberId] ?? 0) + amount); });
  return home.members.map(member => ({ memberId: member.id, share: roundCurrency(shares[member.id] ?? 0), paid: roundCurrency(paid[member.id] ?? 0), balance: roundCurrency((paid[member.id] ?? 0) - (shares[member.id] ?? 0)) }));
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function appendActivity(home: SharedHome, message: string): SharedHome {
  return {
    ...home,
    activity: [{ id: nanoid(), message, createdAt: Date.now() }, ...home.activity].slice(0, 100),
    updatedAt: Date.now(),
  };
}

export function persistRentConfiguration(
  home: SharedHome,
  monthKey: string,
  config: RentConfig,
  allocations: Record<string, number>,
  calculation: RentAllocationLine[],
  adjustment?: RentAdjustmentAudit,
  now = Date.now(),
): SharedHome {
  const previous = home.rentPeriods.find(period => period.monthKey === monthKey);
  const period = buildRentPeriod({ previous, monthKey, config, allocations, calculation, adjustment, now });
  return { ...home, rentConfig: config, rentPeriods: upsertRentPeriod(home.rentPeriods, period) };
}

export default function SharedHomeDetail() {
  const [, params] = useRoute('/shared-home/:id');
  const [, navigate] = useLocation();
  const homeId = params?.id ?? '';
  const { t, language } = useLanguage();
  const { requestDelete } = useDeleteConfirmation();
  const storedHome = getSharedHomeById(homeId);
  const [home, setHome] = useState<SharedHome | null>(storedHome);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [setupStep, setSetupStep] = useState<'members' | 'recurring' | 'ready'>(() => storedHome?.setupStep ?? (storedHome?.members.length ? (storedHome.recurringRules.length ? 'ready' : 'recurring') : 'members'));
  const [monthKey, setMonthKey] = useState(monthKeyFromDate(Date.now()));
  const [expenseKind, setExpenseKind] = useState<HouseholdExpenseKind>('expense');
  const [showExpense, setShowExpense] = useState(false);
  const [showMember, setShowMember] = useState(false);
  const [editingMember, setEditingMember] = useState<SharedHomeMember | undefined>();
  const [showRoom, setShowRoom] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [editingRecurringRule, setEditingRecurringRule] = useState<RecurringRule | undefined>();
  const [paymentRequest, setPaymentRequest] = useState<SharedHomePaymentRequest | null>(null);
  const [showBudget, setShowBudget] = useState(false);
  const [showBudgetDetails, setShowBudgetDetails] = useState(false);
  const [editingRoom, setEditingRoom] = useState<SharedHomeRoom | undefined>();
  const [showRent, setShowRent] = useState(false);
  const [expenseQuery, setExpenseQuery] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('all');
  const [expenseMember, setExpenseMember] = useState('all');
  const [expensePaidBy, setExpensePaidBy] = useState('all');
  const [expenseScopeFilter, setExpenseScopeFilter] = useState<'all' | 'shared' | 'personal'>('all');
  const [expenseDateFilter, setExpenseDateFilter] = useState<'all' | 'range'>('all');
  const [expenseFromDate, setExpenseFromDate] = useState('');
  const [expenseToDate, setExpenseToDate] = useState('');
  const [expenseSort, setExpenseSort] = useState<ExpenseSort>('newest');
  const [reportRange, setReportRange] = useState<ReportRange>('current');
  const [reportFromDate, setReportFromDate] = useState('');
  const [reportToDate, setReportToDate] = useState('');

  const refresh = (next: SharedHome) => {
    setHome(next);
    saveSharedHome(next);
  };

  useEffect(() => {
    if (!home) return;
    const result = materializeRecurringExpenses(home, monthKey);
    if (result.added.length) refresh(appendActivity(result.home, t('sharedHomeRecurringAdded', { count: result.added.length, month: displayMonth(monthKey, language) })));
    // The month key is the trigger; once materialized, the generated ids make the operation idempotent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [home, homeId, monthKey]);

  const saveRecurringRule = (rule: RecurringRule) => {
    const existing = home!.recurringRules.some(item => item.id === rule.id);
    const recurringRules = existing ? home!.recurringRules.map(item => item.id === rule.id ? rule : item) : [...home!.recurringRules, rule];
    const nextSetupStep = !existing && setupStep === 'recurring' ? 'ready' : home!.setupStep ?? setupStep;
    refresh(appendActivity({ ...home!, recurringRules, setupStep: nextSetupStep }, t(existing ? 'sharedHomeRecurringRuleUpdated' : 'sharedHomeRecurringRuleAdded', { name: rule.name })));
    if (!existing && setupStep === 'recurring') setSetupStep('ready');
    setEditingRecurringRule(undefined);
  };

  const updateRecurringRule = (rule: RecurringRule, patch: Partial<RecurringRule>) => {
    refresh(appendActivity({ ...home!, recurringRules: home!.recurringRules.map(item => item.id === rule.id ? { ...item, ...patch, updatedAt: Date.now() } : item) }, t('sharedHomeRecurringRuleUpdated', { name: rule.name })));
  };

  const stopRecurringRule = (rule: RecurringRule) => {
    if (!window.confirm(t('sharedHomeStopRuleConfirm', { name: rule.name }))) return;
    refresh(appendActivity({ ...home!, recurringRules: home!.recurringRules.map(item => item.id === rule.id ? { ...item, status: 'stopped' as const, autoAdd: false, updatedAt: Date.now() } : item) }, t('sharedHomeRuleStopped', { name: rule.name })));
  };

  const monthRent = useMemo(() => home?.rentPeriods.find(period => period.monthKey === monthKey), [home, monthKey]);
  const totals = useMemo(() => home ? getExpenseTotals(home, monthKey) : { total: 0, byCategory: {} }, [home, monthKey]);
  const previousBalances = useMemo(() => home ? Object.fromEntries((home.months[monthFromOffset(monthKey, -1)]?.balances ?? []).map(balance => [balance.memberId, balance.balance])) : {}, [home, monthKey]);
  const balances = useMemo(() => home ? calculateMonthlyBalances(home, monthKey, monthRent, previousBalances) : [], [home, monthKey, monthRent, previousBalances]);
  const suggestedSettlements = useMemo(() => generatePendingHouseholdSettlements(balances, home?.settlements ?? []), [balances, home?.settlements]);
  const totalShares = balances.reduce((sum, item) => sum + item.share, 0) + (monthRent?.totalRent ?? 0);
  const totalPaid = balances.reduce((sum, item) => sum + item.paid, 0);
  const budgetConfig = useMemo(() => getEffectiveSharedHomeBudgetConfig(home?.monthlyBudgets, home?.budgetSettings, monthKey), [home?.monthlyBudgets, home?.budgetSettings, monthKey]);
  const budgetSummary = useMemo(() => home ? calculateSharedHomeBudget({ home, monthKey, config: budgetConfig }) : calculateSharedHomeBudget({ home: { expenses: [], rentPeriods: [] }, monthKey }), [home, monthKey, budgetConfig]);
  const reportPeriod = useMemo(() => reportBounds(monthKey, reportRange, reportFromDate, reportToDate), [monthKey, reportRange, reportFromDate, reportToDate]);
  const reportPeriodExpenses = useMemo(() => home ? reportExpenses(home, reportPeriod) : [], [home, reportPeriod]);
  const reportRentPeriods = useMemo(() => (home?.rentPeriods ?? []).filter(period => {
    const [year, month] = period.monthKey.split('-').map(Number);
    const periodStart = Date.UTC(year, month - 1, 1);
    return periodStart >= reportPeriod.start && periodStart <= reportPeriod.end;
  }), [home?.rentPeriods, reportPeriod]);
  const reportRentTotal = useMemo(() => roundCurrency(reportRentPeriods.reduce((sum, period) => sum + period.totalRent, 0)), [reportRentPeriods]);
  const reportRentAllocations = useMemo(() => reportRentPeriods.reduce<Record<string, number>>((all, period) => {
    Object.entries(period.allocations).forEach(([memberId, amount]) => { all[memberId] = roundCurrency((all[memberId] ?? 0) + amount); });
    return all;
  }, {}), [reportRentPeriods]);
  const reportTotals = useMemo(() => {
    const byCategory: Record<string, number> = {};
    let shared = 0;
    let personal = 0;
    let recurring = 0;
    reportPeriodExpenses.forEach(expense => {
      byCategory[expense.category] = roundCurrency((byCategory[expense.category] ?? 0) + expense.amount);
      if (expense.sharedBy.length > 1) shared = roundCurrency(shared + expense.amount);
      else personal = roundCurrency(personal + expense.amount);
      if (expense.recurringRuleId) recurring = roundCurrency(recurring + expense.amount);
    });
    if (reportRentTotal) byCategory.Rent = roundCurrency((byCategory.Rent ?? 0) + reportRentTotal);
    return { total: roundCurrency(reportPeriodExpenses.reduce((sum, expense) => sum + expense.amount, 0) + reportRentTotal), shared, personal, recurring, rent: reportRentTotal, byCategory };
  }, [reportPeriodExpenses, reportRentTotal]);
  const reportBalances = useMemo(() => home ? aggregateReportBalances(home, reportPeriodExpenses, reportRentAllocations) : [], [home, reportPeriodExpenses, reportRentAllocations]);
  const reportSettlements = useMemo(() => generatePendingHouseholdSettlements(reportBalances, home?.settlements ?? []), [home?.settlements, reportBalances]);

  const budgetHistory = useMemo(() => {
    if (!home) return [];
    const periods = new Set([monthKey, ...Object.keys(home.monthlyBudgets ?? {}), ...Object.keys(home.months), ...home.rentPeriods.map(period => period.monthKey)]);
    return Array.from(periods).sort((a, b) => b.localeCompare(a)).map(period => {
      const config = getEffectiveSharedHomeBudgetConfig(home.monthlyBudgets, home.budgetSettings, period);
      return config ? { label: displayMonth(period, language), summary: calculateSharedHomeBudget({ home, monthKey: period, config }) } : null;
    }).filter((item): item is { label: string; summary: ReturnType<typeof calculateSharedHomeBudget> } => Boolean(item));
  }, [home, monthKey, language]);

  if (!home) {
    return <div className="min-h-screen grid place-items-center bg-kharcha-cream"><Card className="p-6"><p className="font-bold">{t('sharedHomeNotFound')}</p><Button className="mt-4" onClick={() => navigate('/')}>{t('sharedHomeBackToKharcha')}</Button></Card></div>;
  }

  const saveBudget = (config: import('@/types').BudgetConfig, settings?: import('@/budget/types').SharedHomeBudgetSettings) => {
    const monthlyBudgets = { ...(home.monthlyBudgets ?? {}), [monthKey]: config };
    refresh(appendActivity({ ...home, monthlyBudgets, budgetSettings: settings ?? home.budgetSettings }, t('budgetSavedActivity', { period: displayMonth(monthKey, language) })));
  };

  const saveExpense = (expense: HouseholdExpense) => {
    refresh(appendActivity({ ...home, expenses: [...home.expenses, expense] }, t('sharedHomeExpenseAdded', { name: expense.name, amount: money(expense.amount) })));
  };

  const cancelExpense = (expense: HouseholdExpense) => {
    if (expense.status === 'cancelled' || !window.confirm(t('sharedHomeCancelExpenseConfirm'))) return;
    refresh(appendActivity({ ...home, expenses: home.expenses.map(item => item.id === expense.id ? { ...item, status: 'cancelled' as const, updatedAt: Date.now() } : item) }, t('sharedHomeExpenseCancelled', { name: expense.name })));
  };

  const downloadReportCsv = () => {
    const rows = [
      [t('auditSharedHomeSummaryReport' as any)],
      [t('auditHomeName' as any), home.name],
      [t('auditReportingPeriod' as any), reportPeriod.label],
      [t('auditTotalHouseholdOutlay' as any), String(reportTotals.total)],
      [t('auditTotalRent' as any), String(reportTotals.rent)],
      [t('auditTotalExpensesLabel' as any), String(reportTotals.total - reportTotals.rent)],
      [t('sharedHomeCommon'), String(reportTotals.shared)],
      [t('sharedHomePersonal'), String(reportTotals.personal)],
      [t('sharedHomeRecurring'), String(reportTotals.recurring)],
      [],
      [t('auditCategoryWiseExpenses' as any)],
      ...Object.entries(reportTotals.byCategory).map(([category, amount]) => [sharedHomeCategoryLabel(t, category), String(amount)]),
      [],
      [t('auditMemberWiseSummary' as any)],
      ...reportBalances.map(balance => {
        const member = home.members.find(item => item.id === balance.memberId);
        return [member?.name ?? t('auditUnknown' as any), `${t('auditShareLabel' as any)} ${balance.share}`, `${t('auditPaid' as any)}: ${balance.paid}`, `${t('auditBalanceLabel' as any)} ${balance.balance}`];
      }),
      [],
      [t('sharedHomeSettlements')],
      ...reportSettlements.map(settlement => {
        const from = home.members.find(member => member.id === settlement.fromMemberId)?.name ?? t('sharedHomeUnknown');
        const to = home.members.find(member => member.id === settlement.toMemberId)?.name ?? t('sharedHomeUnknown');
        return [from, to, String(settlement.amount)];
      }),
    ];
    const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${home.name.replaceAll(/[^a-z0-9]+/gi, '-').toLowerCase()}-summary-${reportRange}-${monthKey}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleGeneratePdfReport = () => {
    const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>\"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[character] ?? character));
    const reportTitle = `${home.name} - ${reportPeriod.label}`;
    const memberRows = reportBalances.map(balance => {
      const member = home.members.find(item => item.id === balance.memberId);
      const status = balance.balance >= 0 ? `${t('sharedHomeGetsAmount')} ${money(balance.balance)}` : `${t('sharedHomeOwesAmount')} ${money(Math.abs(balance.balance))}`;
      return `<tr><td>${escapeHtml(member?.name ?? t('sharedHomeUnknown'))}</td><td>${money(balance.paid)}</td><td>${money(balance.share)}</td><td>${escapeHtml(status)}</td></tr>`;
    }).join('');
    const categoryRows = Object.entries(reportTotals.byCategory).map(([category, amount]) => `<tr><td>${escapeHtml(sharedHomeCategoryLabel(t, category))}</td><td>${money(amount)}</td></tr>`).join('');
    const settlementRows = reportSettlements.map(item => {
      const from = home.members.find(member => member.id === item.fromMemberId)?.name ?? t('sharedHomeUnknown');
      const to = home.members.find(member => member.id === item.toMemberId)?.name ?? t('sharedHomeUnknown');
      return `<tr><td>${escapeHtml(from)}</td><td>${escapeHtml(to)}</td><td>${money(item.amount)}</td></tr>`;
    }).join('');
    const expenseRows = reportPeriodExpenses.map(expense => `<tr><td>${escapeHtml(expense.name)}</td><td>${escapeHtml(sharedHomeCategoryLabel(t, expense.category))}</td><td>${money(expense.amount)}</td><td>${escapeHtml(displayDate(expense.date, language))}</td></tr>`).join('');
    const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(reportTitle)}</title><style>${PDF_LAYOUT_CSS}</style></head><body><div class="report"><header><img class="report-logo" src="${KHARCHA_LOGO_LOCKUP}" alt="Kharcha"><div class="report-heading"><h1>${escapeHtml(home.name)}</h1><p class="meta">${escapeHtml(t('auditSharedHomeSummaryReport' as any))} · ${escapeHtml(reportPeriod.label)}</p></div></header><div class="summary"><div class="metric">${escapeHtml(t('auditTotalHouseholdOutlay' as any))}<strong>${money(reportTotals.total)}</strong></div><div class="metric">${escapeHtml(t('sharedHomeCommon'))}<strong>${money(reportTotals.shared)}</strong></div><div class="metric">${escapeHtml(t('sharedHomePersonal'))}<strong>${money(reportTotals.personal)}</strong></div><div class="metric">${escapeHtml(t('auditTotalRent' as any))}<strong>${money(reportTotals.rent)}</strong></div><div class="metric">${escapeHtml(t('sharedHomeRecurring'))}<strong>${money(reportTotals.recurring)}</strong></div></div><h2>${escapeHtml(t('auditCategoryWiseExpenses' as any))}</h2>${categoryRows ? `<table><thead><tr><th>${escapeHtml(t('sharedHomeCategory'))}</th><th>${escapeHtml(t('amount'))}</th></tr></thead><tbody>${categoryRows}</tbody></table>` : `<p class="empty">${escapeHtml(t('sharedHomeNothingThisMonth'))}</p>`}<h2>${escapeHtml(t('auditMemberWiseSummary' as any))}</h2>${memberRows ? `<table><thead><tr><th>${escapeHtml(t('members'))}</th><th>${escapeHtml(t('sharedHomePaidAmount'))}</th><th>${escapeHtml(t('sharedHomeShareAmount'))}</th><th>${escapeHtml(t('auditBalanceLabel' as any))}</th></tr></thead><tbody>${memberRows}</tbody></table>` : `<p class="empty">${escapeHtml(t('sharedHomeAddMembers'))}</p>`}<h2>${escapeHtml(t('sharedHomeSettlements'))}</h2>${settlementRows ? `<table><thead><tr><th>${escapeHtml(t('sharedHomePaidBy'))}</th><th>${escapeHtml(t('sharedHomePaidTo'))}</th><th>${escapeHtml(t('amount'))}</th></tr></thead><tbody>${settlementRows}</tbody></table>` : `<p class="empty">${escapeHtml(t('sharedHomeEveryoneSettled'))}</p>`}<h2>${escapeHtml(t('sharedHomeHouseholdExpenses'))}</h2>${expenseRows ? `<table><thead><tr><th>${escapeHtml(t('sharedHomeName'))}</th><th>${escapeHtml(t('sharedHomeCategory'))}</th><th>${escapeHtml(t('amount'))}</th><th>${escapeHtml(t('sharedHomeDate'))}</th></tr></thead><tbody>${expenseRows}</tbody></table>` : `<p class="empty">${escapeHtml(t('sharedHomeNothingThisMonth'))}</p>`}</div></body></html>`;
    const nativePdf = (window as Window & { KharchaPdf?: { showReport: (html: string, title: string, backLabel: string, printLabel: string, saveLabel: string, shareLabel: string) => boolean } }).KharchaPdf;
    if (nativePdf && typeof nativePdf.showReport === 'function') {
      try {
        if (nativePdf.showReport(htmlContent, reportTitle, t('auditPdfBack' as any), t('auditPdfPrint' as any), t('auditPdfSave' as any), t('sharedHomeShare'))) {
          toast.success(t('auditPdfGenerated' as any));
          return;
        }
      } catch {
        // Keep the Android guard below from opening an external standalone page.
      }
    }
    const isAndroidShell = new URLSearchParams(window.location.search).get('android') === '1' || /KharchaAndroid/i.test(navigator.userAgent);
    if (isAndroidShell) {
      toast.error(t('auditPdfUnavailable' as any));
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error(t('auditPopupBlocked' as any));
      return;
    }
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
      try {
        printWindow.print();
      } catch {
        toast.error(t('auditPdfUnavailable' as any));
      }
    }, 150);
    toast.success(t('auditPdfGenerated' as any));
  };

  const saveMember = (member: SharedHomeMember) => {
    const exists = home.members.some(item => item.id === member.id);
    const duplicate = home.members.some(item => item.id !== member.id && (item.name.trim().toLowerCase() === member.name.trim().toLowerCase() || (member.mobileNumber && item.mobileNumber === member.mobileNumber)));
    if (duplicate) { toast.error(t('sharedHomeInvalidExpense')); return; }
    const members = exists ? home.members.map(item => item.id === member.id ? member : item) : [...home.members, member];
    const nextSetupStep = !exists && setupStep === 'members' ? 'recurring' : home.setupStep ?? setupStep;
    const next = appendActivity({ ...home, members, setupStep: nextSetupStep, managerMemberId: home.managerMemberId ?? member.id }, t(exists ? 'sharedHomeMemberUpdated' : 'sharedHomeMemberAdded', { name: member.name }));
    refresh(next);
    if (!exists && setupStep === 'members') setSetupStep('recurring');
    setEditingMember(undefined);
  };

  const saveMultipleMembers = (newMembers: SharedHomeMember[]) => {
    const { members, added } = appendUniqueMembers(home.members, newMembers);
    if (added.length === 0) return;
    const nextSetupStep = setupStep === 'members' ? 'recurring' : home.setupStep ?? setupStep;
    const next = appendActivity({ ...home, members, setupStep: nextSetupStep, managerMemberId: home.managerMemberId ?? added[0].id }, t('auditAddedFromContacts' as any, { count: added.length }));
    refresh(next);
    if (setupStep === 'members') setSetupStep('recurring');
  };

  const removeMember = (member: SharedHomeMember) => {
    requestDelete({
      title: t('sharedHomeRemoveMemberConfirm', { name: member.name }),
      message: t('auditActionCannotUndo' as any),
      onConfirm: () => refresh(appendActivity({ ...home, members: home.members.map(item => item.id === member.id ? { ...item, isActive: false, moveOutDate: Date.now() } : item) }, t('sharedHomeMemberInactive', { name: member.name }))),
    });
  };

  const saveRoom = (room: SharedHomeRoom) => {
    const exists = home.rooms.some(item => item.id === room.id);
    const rooms = exists ? home.rooms.map(item => item.id === room.id ? room : item) : [...home.rooms, room];
    refresh(appendActivity({ ...home, rooms }, t(exists ? 'sharedHomeRoomUpdated' : 'sharedHomeRoomAdded', { name: room.name })));
    setEditingRoom(undefined);
  };

  const removeRoom = (room: SharedHomeRoom) => {
    requestDelete({
      title: t('sharedHomeDeleteRoomConfirm', { name: room.name }),
      message: t('auditActionCannotUndo' as any),
      onConfirm: () => refresh(appendActivity({ ...home, rooms: home.rooms.filter(item => item.id !== room.id) }, t('sharedHomeRoomDeleted', { name: room.name }))),
    });
  };

  const assignMember = (member: SharedHomeMember, roomId: string) => {
    const now = Date.now();
    const previous = member.roomAssignments.map(assignment => assignment.endDate ? assignment : { ...assignment, endDate: now - 1 });
    const roomAssignments = roomId === 'none' ? previous : [...previous, { roomId, startDate: now }];
    const updated = { ...member, roomAssignments };
    const rooms = home.rooms.map(room => {
      const memberIds = room.memberIds.filter(memberId => memberId !== member.id);
      return room.id === roomId && roomId !== 'none' ? { ...room, memberIds: [...memberIds, member.id] } : { ...room, memberIds };
    });
    const roomName = home.rooms.find(room => room.id === roomId)?.name ?? t('sharedHomeUnassigned');
    refresh(appendActivity({ ...home, members: home.members.map(item => item.id === member.id ? updated : item), rooms }, t('sharedHomeMemberAssigned', { member: member.name, room: roomName })));
  };

  const saveRent = (config: RentConfig, allocations: Record<string, number>, calculation: RentAllocationLine[], adjustment?: { calculatedAmount: number; adjustedAmount: number; reason?: string; createdAt: number }) => {
    const nextHome = persistRentConfiguration(home, monthKey, config, allocations, calculation, adjustment);
    refresh(appendActivity(nextHome, t('sharedHomeRentConfigured', { month: displayMonth(monthKey, language), amount: money(adjustment?.adjustedAmount ?? config.totalRent), adjustment: adjustment ? ` (${t('sharedHomeManualOverride')}: ${adjustment.reason ?? t('sharedHomeManualOverride')})` : '' })));
  };

  const recordSettlement = (fromMemberId: string, toMemberId: string, amount: number) => {
    const from = home.members.find(member => member.id === fromMemberId)?.name ?? t('sharedHomeUnknown');
    const to = home.members.find(member => member.id === toMemberId)?.name ?? t('sharedHomeUnknown');
    refresh(appendActivity({ ...home, settlements: [...home.settlements, { id: nanoid(), fromMemberId, toMemberId, amount, date: Date.now(), paymentMethod: 'upi', status: 'recorded', createdAt: Date.now() }] }, t('sharedHomeSettlementRecorded', { from, amount: money(amount), to })));
  };

  const openSettlementPaymentRequest = (fromMemberId: string, toMemberId: string, amount: number) => {
    const from = home.members.find(member => member.id === fromMemberId);
    const to = home.members.find(member => member.id === toMemberId);
    setPaymentRequest({
      homeName: home.name,
      payerName: from?.name ?? t('sharedHomeUnknown'),
      payeeName: to?.name ?? t('sharedHomeUnknown'),
      amount,
      reason: `${displayMonth(monthKey, language)} ${t('auditSharedHomeExpensesReason' as any)}`,
      upiId: to?.upiId,
    });
  };

  const paySharedHomeSettlementViaUpi = () => {
    if (!paymentRequest) return;
    const deepLink = launchSharedHomeUpiPayment(paymentRequest);
    if (!deepLink) {
      window.alert(t('sharedHomeNoUpiPaymentFallback'));
      return;
    }
    setPaymentRequest(null);
  };

  const shareSharedHomeSettlementRequest = async () => {
    if (!paymentRequest) return;
    const result = await shareSharedHomePaymentRequest(paymentRequest, {
      heading: t('sharedHomePaymentRequest'),
      pay: t('sharedHomePayViaUpi'),
      amount: t('amount'),
      forLabel: t('sharedHomeReason'),
      whoPays: t('sharedHomeWhoPays'),
      whoReceives: t('sharedHomeWhoReceives'),
      upiId: t('sharedHomeUpiId'),
      unavailable: t('sharedHomePaymentFallback'),
      footer: t('sharedHomePaymentPending'),
    });
    window.alert(result === 'shared' ? t('sharedHomeShareSuccess') : result === 'copied' ? t('sharedHomePaymentLinkCopied') : t('sharedHomeShareFailed'));
  };

  const handleShareHome = async (range: Parameters<typeof generateSharedHomeShareLink>[1], dateRange?: { startDate?: number; endDate?: number }) => {
    const url = generateSharedHomeShareLink(home, range, dateRange);
    const shared = await shareLink(home.name, `${home.name} — ${t('auditSharedHomeShareTitle' as any)}`, url);
    if (!shared) {
      const copied = await copyToClipboard(url);
      window.alert(copied ? t('sharedHomeShareCopied') : t('sharedHomeShareFailed'));
    }
  };

  const closeMonth = () => {
    const pending = suggestedSettlements.length;
    const activeExpenseCount = home.expenses.filter(expense => expense.status === 'active' && monthKeyFromDate(expense.date) === monthKey).length;
    const review = t('sharedHomeCloseSummary', { expenses: activeExpenseCount, total: money(totals.total + (monthRent?.totalRent ?? 0)), pending });
    if (!window.confirm(`${review}\\n${pending ? t('sharedHomeUnsettledCloseConfirm', { count: pending, month: displayMonth(monthKey, language) }) : t('sharedHomeEveryoneSettled')}`)) return;
    const months = { ...home.months, [monthKey]: { monthKey, closedAt: Date.now(), totalExpenses: totals.total + (monthRent?.totalRent ?? 0), totalShares, totalPaid, balances } };
    refresh(appendActivity({ ...home, months }, t('sharedHomeClosed', { month: displayMonth(monthKey, language) })));
  };

  const updateSetupStep = (next: 'members' | 'recurring' | 'ready', tab: TabId) => {
    setSetupStep(next);
    setActiveTab(tab);
    refresh({ ...home, setupStep: next });
  };

  const renderSetupGuide = () => {
    if (setupStep === 'ready') return null;
    const membersStep = setupStep === 'members';
    return <Card className="rounded-2xl border-2 border-[#16834b] bg-[#f2fbf3] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-[#16834b]">{t('sharedHomeOfflineFirst')}</p><h2 className="mt-1 text-lg font-black text-kharcha-navy">{membersStep ? t('sharedHomeAddMembers') : t('sharedHomeRecurringRules')}</h2><p className="mt-1 text-sm text-gray-600">{membersStep ? t('sharedHomeAddPeopleToSeeBalances') : t('sharedHomeRecurringHelp')}</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#16834b]">{membersStep ? '1/2' : '2/2'}</span></div><div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => { if (membersStep) { setEditingMember(undefined); setShowMember(true); } else { setEditingRecurringRule(undefined); setShowRecurring(true); } }} className="bg-[#16834b] text-white hover:bg-[#11663b]">{membersStep ? t('sharedHomeAddMember') : t('sharedHomeAddRule')}</Button><Button variant="outline" onClick={() => membersStep ? updateSetupStep('recurring', 'recurring') : updateSetupStep('ready', 'overview')}>{t('sharedHomeSkipNext')}</Button></div></Card>;
  };

  const renderOverview = () => (
    <div className="space-y-4">
      {renderSetupGuide()}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t('sharedHomeTotalExpense')} value={money(totals.total + (monthRent?.totalRent ?? 0))} accent="orange" />
        <StatCard label={t('sharedHomeTotalShare')} value={money(totalShares)} accent="green" />
        <StatCard label={t('sharedHomeTotalPaid')} value={money(totalPaid)} accent="navy" />
        <StatCard label={t('sharedHomePendingSettlements')} value={String(suggestedSettlements.length)} accent="cream" />
      </div>
      <BudgetCard summary={budgetSummary} onOpenDetails={() => setShowBudgetDetails(true)} onEdit={() => setShowBudget(true)} />
      <Card className="rounded-2xl border-2 border-[#e7d7bd] bg-white p-4">
        <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-gray-500">{t('sharedHomeThisMonth')}</p><h2 className="text-2xl font-black text-kharcha-navy">{displayMonth(monthKey, language)}</h2></div><CalendarDays className="text-[#e87817]" /></div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><QuickAction label={t('sharedHomeAddExpense')} onClick={() => { setExpenseKind('expense'); setShowExpense(true); }} /><QuickAction label={t('sharedHomeAddRule')} onClick={() => { setActiveTab('recurring'); setEditingRecurringRule(undefined); setShowRecurring(true); }} /><QuickAction label={t('sharedHomeAddMember')} onClick={() => { setActiveTab('members'); setEditingMember(undefined); setShowMember(true); }} /><QuickAction label={t('sharedHomeReports')} onClick={() => setActiveTab('reports')} /></div>
      </Card>
      <Card className="rounded-2xl border-2 border-[#e7d7bd] bg-white p-4"><h3 className="font-black text-kharcha-navy">{t('members')} · {t('summary')}</h3><div className="mt-3 space-y-2">{balances.length ? balances.map(balance => { const member = home.members.find(item => item.id === balance.memberId); return <div key={balance.memberId} className="flex items-center justify-between rounded-xl bg-[#fffaf3] px-3 py-2"><div><p className="font-bold">{member?.name}</p><p className="text-xs text-gray-500">{t('sharedHomeShareAmount')} {money(balance.share)} · {t('sharedHomePaidAmount')} {money(balance.paid)}{balance.previousBalance ? ` · ${t('sharedHomeCarryAmount')} ${money(balance.previousBalance)}` : ''}</p></div><span className={`font-black ${balance.balance >= 0 ? 'text-[#16834b]' : 'text-red-600'}`}>{balance.balance >= 0 ? `${t('sharedHomeGetsAmount')} ${money(balance.balance)}` : `${t('sharedHomeOwesAmount')} ${money(Math.abs(balance.balance))}`}</span></div>; }) : <p className="text-sm text-gray-600">{t('sharedHomeAddPeopleToSeeBalances')}</p>}</div></Card>
      <Card className="rounded-2xl border-2 border-[#e7d7bd] bg-white p-4"><h3 className="font-black text-kharcha-navy">{t('sharedHomeRecentActivity')}</h3><div className="mt-3 space-y-2">{home.activity.slice(0, 5).map(item => <div key={item.id} className="flex gap-2 text-sm"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#e87817]" /><span>{item.message}</span></div>)}</div></Card>
    </div>
  );

  const renderRecurringRules = () => (
    <Card className="rounded-2xl border-2 border-[#e7d7bd] bg-white p-4">
      <div className="android-section-header flex items-center justify-between gap-3"><div><h3 className="font-black text-kharcha-navy">{t('sharedHomeRecurringRules')}</h3><p className="text-xs text-gray-500">{t('sharedHomeRecurringHelp')}</p></div><Button size="sm" onClick={() => { setEditingRecurringRule(undefined); setShowRecurring(true); }} className="bg-[#16834b] text-white">{t('sharedHomeAddRule')}</Button></div>
      {home.recurringRules.length ? <div className="mt-3 space-y-2">{home.recurringRules.map(rule => { const generated = home.expenses.filter(expense => expense.recurringRuleId === rule.id); const included = rule.includeInBudget !== false; return <div key={rule.id} className="rounded-xl border bg-[#fffaf3] p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{rule.name}</p><p className="text-xs text-gray-500">{sharedHomeCategoryLabel(t, rule.category)} · {rule.amountMode === 'fixed' ? money(rule.fixedAmount ?? 0) : t('sharedHomeVariable')} · {recurringStatusLabel(t, rule.status)}</p><p className={`mt-1 text-xs font-bold ${included ? 'text-[#16834b]' : 'text-gray-500'}`}>{included ? `✓ ${t('sharedHomeIncludedInBudget')}` : `○ ${t('sharedHomeNotIncludedInBudget')}`}</p></div><div className="android-action-row flex flex-wrap justify-end gap-1"><Button size="sm" variant="outline" onClick={() => { setEditingRecurringRule(rule); setShowRecurring(true); }}>{t('edit')}</Button><Button size="sm" variant="outline" disabled={rule.status === 'stopped'} onClick={() => updateRecurringRule(rule, { status: rule.status === 'active' ? 'paused' : 'active' })}>{rule.status === 'active' ? t('sharedHomePause') : t('sharedHomeResume')}</Button>{rule.status === 'active' && <Button size="sm" variant="outline" onClick={() => updateRecurringRule(rule, { skipNext: !rule.skipNext })}>{rule.skipNext ? t('sharedHomeUnskip') : t('sharedHomeSkipNext')}</Button>}{rule.status !== 'stopped' && <Button size="sm" variant="outline" onClick={() => stopRecurringRule(rule)}>{t('sharedHomeStop')}</Button>}<Button size="sm" variant="ghost" onClick={() => window.alert(generated.length ? generated.map(expense => `${expense.billingPeriod ?? new Date(expense.date).toISOString().slice(0, 7)} · ${money(expense.amount)}`).join('\\n') : t('sharedHomeNoHistory'))}>{t('sharedHomeRuleHistory')}</Button></div></div></div>; })}</div> : <p className="mt-3 text-sm text-gray-600">{t('sharedHomeNoRecurringRules')}</p>}
    </Card>
  );

  const renderExpenses = () => {
    const categories = Array.from(new Set([...sharedHomeCategoryValues, ...home.expenses.map(expense => expense.category)])).sort();
    const expenses = home.expenses
      .filter(expense => monthKeyFromDate(expense.date) === monthKey)
      .filter(expense => expenseCategory === 'all' || expense.category === expenseCategory)
      .filter(expense => expenseMember === 'all' || expense.sharedBy.includes(expenseMember))
      .filter(expense => expensePaidBy === 'all' || expense.paidBy === expensePaidBy)
      .filter(expense => expenseScopeFilter === 'all' || (expenseScopeFilter === 'personal' ? expense.sharedBy.length === 1 : expense.sharedBy.length > 1))
      .filter(expense => {
        if (expenseDateFilter !== 'range') return true;
        const from = expenseFromDate ? new Date(`${expenseFromDate}T00:00:00Z`).getTime() : Number.NEGATIVE_INFINITY;
        const to = expenseToDate ? new Date(`${expenseToDate}T23:59:59Z`).getTime() : Number.POSITIVE_INFINITY;
        return expense.date >= from && expense.date <= to;
      })
      .filter(expense => {
        const paidBy = home.members.find(member => member.id === expense.paidBy)?.name ?? '';
        const sharedBy = expense.sharedBy.map(id => home.members.find(member => member.id === id)?.name ?? '').join(' ');
        const haystack = `${expense.name} ${expense.category} ${expense.amount} ${paidBy} ${sharedBy} ${displayDate(expense.date, language)}`.toLowerCase();
        return !expenseQuery.trim() || haystack.includes(expenseQuery.trim().toLowerCase());
      })
      .slice()
      .sort((a, b) => expenseSort === 'oldest' ? a.date - b.date : expenseSort === 'highest' ? b.amount - a.amount : expenseSort === 'lowest' ? a.amount - b.amount : b.date - a.date);
    return <div className="space-y-4">
      <SectionHeader title={t('sharedHomeHouseholdExpenses')} actionLabel={t('sharedHomeAddExpense')} onAction={() => { setExpenseKind('expense'); setShowExpense(true); }} />
      <Card className="rounded-2xl border bg-white p-3"><div className="grid gap-2 sm:grid-cols-2"><Input value={expenseQuery} onChange={event => setExpenseQuery(event.target.value)} placeholder={t('sharedHomeSearchPlaceholder')} /><Select value={expenseSort} onValueChange={value => setExpenseSort(value as ExpenseSort)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="newest">{t('sharedHomeSortNewest')}</SelectItem><SelectItem value="oldest">{t('sharedHomeSortOldest')}</SelectItem><SelectItem value="highest">{t('sharedHomeSortHighest')}</SelectItem><SelectItem value="lowest">{t('sharedHomeSortLowest')}</SelectItem></SelectContent></Select></div><div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Select value={expenseCategory} onValueChange={setExpenseCategory}><SelectTrigger><SelectValue placeholder={t('sharedHomeFilterCategory')} /></SelectTrigger><SelectContent><SelectItem value="all">{t('sharedHomeAllCategories')}</SelectItem>{categories.map(category => <SelectItem key={category} value={category}>{sharedHomeCategoryLabel(t, category)}</SelectItem>)}</SelectContent></Select><Select value={expenseMember} onValueChange={setExpenseMember}><SelectTrigger><SelectValue placeholder={t('sharedHomeFilterMember')} /></SelectTrigger><SelectContent><SelectItem value="all">{t('sharedHomeAllMembers')}</SelectItem>{home.members.map(member => <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>)}</SelectContent></Select><Select value={expensePaidBy} onValueChange={setExpensePaidBy}><SelectTrigger><SelectValue placeholder={t('sharedHomePaidBy')} /></SelectTrigger><SelectContent><SelectItem value="all">{t('sharedHomeAllMembers')}</SelectItem>{home.members.map(member => <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>)}</SelectContent></Select><Select value={expenseScopeFilter} onValueChange={value => setExpenseScopeFilter(value as 'all' | 'shared' | 'personal')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t('sharedHomeAllMembers')}</SelectItem><SelectItem value="shared">{t('sharedHomeCommon')}</SelectItem><SelectItem value="personal">{t('sharedHomePersonal')}</SelectItem></SelectContent></Select><Select value={expenseDateFilter} onValueChange={value => setExpenseDateFilter(value as 'all' | 'range')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t('sharedHomeCurrentMonth')}</SelectItem><SelectItem value="range">{t('sharedHomeCustomDateRange')}</SelectItem></SelectContent></Select></div>{expenseDateFilter === 'range' && <div className="mt-2 grid gap-2 rounded-xl bg-[#fffaf3] p-3 sm:grid-cols-3"><Input type="date" value={expenseFromDate} onChange={event => setExpenseFromDate(event.target.value)} aria-label={t('personalBudgetFrom' as any)} /><Input type="date" value={expenseToDate} onChange={event => setExpenseToDate(event.target.value)} aria-label={t('personalBudgetTo' as any)} /><Button type="button" variant="outline" onClick={() => { setExpenseQuery(''); setExpenseCategory('all'); setExpenseMember('all'); setExpensePaidBy('all'); setExpenseScopeFilter('all'); setExpenseDateFilter('all'); setExpenseFromDate(''); setExpenseToDate(''); setExpenseSort('newest'); }}>{t('clearAll')}</Button></div>}</Card>
      {expenses.length === 0 ? <EmptyPanel text={t('sharedHomeNothingThisMonth')} /> : <div className="space-y-2">{expenses.map(expense => { const paidBy = home.members.find(member => member.id === expense.paidBy)?.name ?? t('sharedHomeUnknown'); const cancelled = expense.status === 'cancelled'; return <Card key={expense.id} className={`rounded-xl border bg-white p-4 ${cancelled ? 'opacity-60' : ''}`}><div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-kharcha-navy">{expense.name}</h3><p className="text-sm text-gray-600">{sharedHomeCategoryLabel(t, expense.category)} · {t('sharedHomePaidByLabel')} {paidBy}</p><p className="mt-1 text-xs text-gray-500">{t('sharedHomeSharedByLabel')} {expense.sharedBy.map(id => home.members.find(member => member.id === id)?.name).filter(Boolean).join(', ')} · {displayDate(expense.date, language)}</p>{expense.receiptUrl && /^https?:\/\//.test(expense.receiptUrl) && <a className="mt-1 inline-block text-xs font-bold text-[#16834b] underline" href={expense.receiptUrl} target="_blank" rel="noreferrer">{t('sharedHomeReceipt')}</a>}{cancelled && <p className="mt-1 text-xs font-bold text-red-600">{t('sharedHomeCancelled')}</p>}</div><div className="text-right"><strong className="text-lg text-[#e87817]">{money(expense.amount)}</strong>{!cancelled && <div><Button size="sm" variant="ghost" className="mt-1 text-red-600" onClick={() => cancelExpense(expense)}>{t('sharedHomeCancel')}</Button></div>}</div></div></Card>; })}</div>}
    </div>;
  };

  const renderMembers = () => <div className="space-y-4"><SectionHeader title={t('members')} actionLabel={t('sharedHomeAddMember')} onAction={() => { setEditingMember(undefined); setShowMember(true); }} /><div className="space-y-2">{home.members.length === 0 ? <EmptyPanel text={t('sharedHomeAddMembers')} /> : home.members.map(member => <Card key={member.id} className="rounded-xl border bg-white p-4"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#b9ddc9] text-lg">{member.avatar?.startsWith('http') ? <img src={member.avatar} alt="" className="h-full w-full object-cover" /> : (member.avatar || member.name.slice(0, 1).toUpperCase())}</span><div><h3 className="font-black text-kharcha-navy">{member.name} {!member.isActive && <span className="text-xs font-bold text-gray-500">({t('sharedHomeInactiveLabel')})</span>}</h3>{member.mobileNumber && <p className="text-sm text-gray-600">{member.mobileNumber}</p>}{member.upiId && <p className="text-xs font-semibold text-[#16834b]">{t('auditUpiId' as any)}: {member.upiId}</p>}<p className="mt-1 text-xs text-gray-500">{t('sharedHomeMoveInLabel')} {displayDate(member.moveInDate, language)}</p>{member.pausePeriods?.length ? <p className="mt-1 text-xs font-semibold text-[#c45a00]">{t('pbPause' as any)}: {displayDate(member.pausePeriods[0].startDate, language)}{member.pausePeriods[0].endDate ? ` – ${displayDate(member.pausePeriods[0].endDate, language)}` : ''}</p> : null}<div className="mt-2 space-y-1 text-[11px] text-gray-500">{member.roomAssignments.length ? member.roomAssignments.slice().reverse().map((assignment, index) => <p key={`${assignment.roomId}-${assignment.startDate}-${index}`}>{t('sharedHomeRoom')}: {home.rooms.find(room => room.id === assignment.roomId)?.name ?? t('sharedHomeRemovedRoom')} · {displayDate(assignment.startDate, language)} – {assignment.endDate ? displayDate(assignment.endDate, language) : t('sharedHomeCurrent')}</p>) : <p>{t('sharedHomeNoRoomHistory')}</p>}</div></div><div className="android-action-row flex gap-1"><Button variant="outline" size="sm" onClick={() => { setEditingMember(member); setShowMember(true); }}>{t('edit')}</Button><Button variant="ghost" size="sm" onClick={() => removeMember(member)}><X size={16} /></Button></div></div></div><div className="mt-3 flex items-center gap-2"><Label className="text-xs">{t('sharedHomeRoom')}</Label><Select value={member.roomAssignments.length ? (member.roomAssignments.find(item => !item.endDate)?.roomId ?? 'none') : 'none'} onValueChange={roomId => assignMember(member, roomId)}><SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">{t('sharedHomeUnassigned')}</SelectItem>{home.rooms.map(room => <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>)}</SelectContent></Select></div></Card>)}</div></div>;

  const renderRooms = () => <div className="space-y-4"><SectionHeader title={t('sharedHomeRooms')} actionLabel={t('sharedHomeAddRoom')} onAction={() => { setEditingRoom(undefined); setShowRoom(true); }} />{home.rooms.length === 0 ? <EmptyPanel text={t('sharedHomeRoomsOptional')} /> : <div className="grid gap-3 sm:grid-cols-2">{home.rooms.map(room => <Card key={room.id} className="rounded-xl border bg-white p-4"><div className="flex items-start justify-between"><div><h3 className="font-black text-kharcha-navy">{room.name}</h3><p className="text-sm text-gray-600">{room.memberIds.length} {t('sharedHomeMembersCount')}</p><p className="mt-1 text-xs text-gray-500">{room.memberIds.map(memberId => home.members.find(member => member.id === memberId)?.name).filter(Boolean).join(', ') || t('sharedHomeNoCurrentMembers')}</p>{room.defaultRent && <p className="text-xs text-gray-500">{t('sharedHomeDefaultRent')} {money(room.defaultRent)}</p>}</div><div className="android-action-row flex gap-1"><Button variant="outline" size="sm" onClick={() => { setEditingRoom(room); setShowRoom(true); }}>{t('edit')}</Button><Button variant="ghost" size="sm" onClick={() => removeRoom(room)}><X size={16} /></Button></div></div></Card>)}</div>}</div>;

  const renderRent = () => <div className="space-y-4"><SectionHeader title={t('sharedHomeRent')} actionLabel={monthRent ? t('sharedHomeEditRent') : t('sharedHomeAddRent')} onAction={() => setShowRent(true)} />{monthRent ? <><Card className="rounded-xl border bg-white p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">{displayMonth(monthKey, language)}</p><h3 className="text-2xl font-black text-kharcha-navy">{money(monthRent.totalRent)}</h3><p className="text-sm text-gray-600">{t(rentMethodTranslationKeys[monthRent.config.splitMethod])} · {t(stayBasisTranslationKeys[monthRent.config.stayDayBasis])} {t('sharedHomeBasis')}</p></div><Wallet className="text-[#16834b]" /></div></Card><CalculationCard lines={monthRent.calculation} /></> : <EmptyPanel text={t('sharedHomeConfigureRent')} />}</div>;

  const renderSettlements = () => <div className="space-y-4"><SectionHeader title={t('sharedHomeSettlements')} actionLabel={t('sharedHomeCloseMonth')} onAction={closeMonth} />{suggestedSettlements.length === 0 ? <EmptyPanel text={t('sharedHomeEveryoneSettled')} /> : suggestedSettlements.map(item => { const from = home.members.find(member => member.id === item.fromMemberId); const to = home.members.find(member => member.id === item.toMemberId); return <Card key={`${item.fromMemberId}-${item.toMemberId}`} className="rounded-xl border bg-white p-4"><div className="flex items-center justify-between gap-3"><div><h3 className="font-black text-kharcha-navy">{from?.name} {t('sharedHomeOwesTo')} {to?.name}</h3><p className="text-sm text-gray-600">{t('sharedHomeSuggestedMinimum')}</p></div><div className="text-right"><p className="text-xl font-black text-red-600">{money(item.amount)}</p><div className="mt-2 flex flex-wrap justify-end gap-2"><Button size="sm" className="bg-[#16834b] text-white" onClick={() => openSettlementPaymentRequest(item.fromMemberId, item.toMemberId, item.amount)}>{t('sharedHomePaymentRequest')}</Button><Button size="sm" variant="outline" onClick={() => recordSettlement(item.fromMemberId, item.toMemberId, item.amount)}>{t('sharedHomeMarkPaid')}</Button></div></div></div></Card>; })}<Card className="rounded-2xl border bg-white p-4"><h3 className="font-black text-kharcha-navy">{t('sharedHomePaymentHistory')}</h3>{home.settlements.filter(item => item.status !== 'cancelled').length ? <div className="mt-3 space-y-2">{home.settlements.filter(item => item.status !== 'cancelled').slice().reverse().map(item => { const from = home.members.find(member => member.id === item.fromMemberId); const to = home.members.find(member => member.id === item.toMemberId); return <div key={item.id} className="flex items-center justify-between rounded-xl bg-[#f2fbf3] px-3 py-2"><div><p className="text-sm font-bold">{from?.name} {t('sharedHomePaidTo')} {to?.name}</p><p className="text-xs text-gray-500">{displayDate(item.date, language)} · {paymentMethodLabel(t, item.paymentMethod)}</p></div><div className="flex items-center gap-2"><strong className="text-[#16834b]">{money(item.amount)}</strong><Button size="sm" variant="ghost" onClick={() => refresh(appendActivity({ ...home, settlements: home.settlements.map(existing => existing.id === item.id ? { ...existing, status: 'cancelled' as const } : existing) }, t('sharedHomeSettlementCancelled', { member: from?.name ?? t('sharedHomeUnknown') })))}>{t('undo')}</Button></div></div>; })}</div> : <p className="mt-2 text-sm text-gray-600">{t('sharedHomeNoPaymentHistory')}</p>}</Card></div>;

  const renderReports = () => {
    const noData = reportPeriodExpenses.length === 0 && reportRentTotal === 0;
    return <div className="space-y-4">
      <SectionHeader title={t('sharedHomeReports')} />
      <Card className="rounded-2xl border-2 border-[#e7d7bd] bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="space-y-1"><Label>{t('pbCustomRange' as any)}</Label><Select value={reportRange} onValueChange={value => setReportRange(value as ReportRange)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="current">{t('sharedHomeThisMonth')}</SelectItem><SelectItem value="previous">{t('pbPreviousMonth' as any)}</SelectItem><SelectItem value="custom">{t('pbCustomRange' as any)}</SelectItem></SelectContent></Select></div>
            {reportRange === 'custom' && <><div className="space-y-1"><Label htmlFor="report-from">{t('pbFrom' as any)}</Label><Input id="report-from" type="date" value={reportFromDate} onChange={event => setReportFromDate(event.target.value)} /></div><div className="space-y-1"><Label htmlFor="report-to">{t('pbTo' as any)}</Label><Input id="report-to" type="date" value={reportToDate} onChange={event => setReportToDate(event.target.value)} /></div></>}
          </div>
          <div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={() => { setReportRange('current'); setReportFromDate(''); setReportToDate(''); }}>{t('clearAll')}</Button><Button size="sm" variant="outline" onClick={downloadReportCsv}><Download size={15} className="mr-1" />{t('sharedHomeDownloadCsv')}</Button><Button size="sm" variant="outline" onClick={handleGeneratePdfReport}><Printer size={15} className="mr-1" />{t('sharedHomePrintPdf')}</Button></div>
        </div>
        <p className="mt-3 text-sm font-semibold text-gray-600">{home.name} · {reportPeriod.label}</p>
      </Card>
      {noData ? <EmptyPanel text={t('sharedHomeNothingThisMonth')} /> : <>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5"><StatCard label={t('auditTotalHouseholdOutlay' as any)} value={money(reportTotals.total)} accent="green" /><StatCard label={t('sharedHomeCommon')} value={money(reportTotals.shared)} accent="orange" /><StatCard label={t('sharedHomePersonal')} value={money(reportTotals.personal)} accent="cream" /><StatCard label={t('auditTotalRent' as any)} value={money(reportTotals.rent)} accent="navy" /><StatCard label={t('sharedHomeRecurring')} value={money(reportTotals.recurring)} accent="green" /></div>
        <Card className="rounded-xl border bg-white p-4"><h3 className="font-black text-kharcha-navy">{t('auditCategoryWiseExpenses' as any)}</h3><div className="mt-3 space-y-2">{Object.entries(reportTotals.byCategory).map(([category, value]) => <div key={category} className="flex justify-between text-sm"><span>{sharedHomeCategoryLabel(t, category)}</span><strong>{money(value)}</strong></div>)}</div></Card>
        <Card className="rounded-xl border bg-white p-4"><h3 className="font-black text-kharcha-navy">{t('members')} · {t('summary')} & {t('auditBalanceLabel' as any)}</h3><div className="mt-3 space-y-2">{reportBalances.map(balance => { const member = home.members.find(item => item.id === balance.memberId); return <div key={balance.memberId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#fffaf3] px-3 py-2 text-sm"><span className="font-bold">{member?.name ?? t('sharedHomeUnknown')}</span><span>{t('sharedHomeShareAmount')} {money(balance.share)} · {t('sharedHomePaidAmount')} {money(balance.paid)} · {balance.balance >= 0 ? `${t('sharedHomeGetsAmount')} ${money(balance.balance)}` : `${t('sharedHomeOwesAmount')} ${money(Math.abs(balance.balance))}`}</span></div>; })}</div></Card>
        <Card className="rounded-xl border bg-white p-4"><h3 className="font-black text-kharcha-navy">{t('sharedHomeSettlements')}</h3>{reportSettlements.length ? <div className="mt-3 space-y-2">{reportSettlements.map(item => { const from = home.members.find(member => member.id === item.fromMemberId); const to = home.members.find(member => member.id === item.toMemberId); return <div key={`${item.fromMemberId}-${item.toMemberId}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#f2fbf3] px-3 py-2 text-sm"><span>{from?.name ?? t('sharedHomeUnknown')} {t('sharedHomeOwesTo')} {to?.name ?? t('sharedHomeUnknown')}</span><div className="flex items-center gap-2"><strong>{money(item.amount)}</strong><Button size="sm" variant="outline" onClick={() => openSettlementPaymentRequest(item.fromMemberId, item.toMemberId, item.amount)}>{t('sharedHomePaymentRequest')}</Button></div></div>; })}</div> : <p className="mt-3 text-sm text-gray-600">{t('sharedHomeEveryoneSettled')}</p>}</Card>
      </>}
    </div>;
  };

  const renderRecurring = () => <div className="space-y-4">{renderRent()}{renderRecurringRules()}</div>;
  const renderMembersSection = () => <div className="space-y-4">{renderMembers()}{renderRooms()}</div>;
  const content = activeTab === 'overview' ? renderOverview() : activeTab === 'expenses' ? renderExpenses() : activeTab === 'recurring' ? renderRecurring() : activeTab === 'members' ? renderMembersSection() : activeTab === 'settlements' ? renderSettlements() : renderReports();

  return <div className="min-h-screen bg-kharcha-cream pb-8"><AppSectionHeader
    title={home.name}
    onBack={() => navigate('/')}
    backLabel={t('sharedHomeBackAriaLabel')}
    actions={<Button variant="default" size="sm" onClick={() => setShowShare(true)} className="w-full h-9 shrink-0 rounded-xl bg-[#16834b] px-3 text-sm font-black text-white shadow-sm hover:bg-[#11663b]"><Share2 size={16} className="mr-1.5" />{t('sharedHomeShare')}</Button>}
  ><div className="mx-auto mt-2 flex max-w-5xl items-center gap-1.5 overflow-x-auto pb-1 whitespace-nowrap sm:mt-3 sm:gap-2" aria-label={t('sharedHomePrimaryNavigation')}><div className="flex shrink-0 items-center gap-1.5 sm:gap-2">{primaryTabs.map(tab => { const Icon = tab.icon; return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex min-h-9 shrink-0 items-center gap-1 rounded-full border px-2 py-1.5 text-[11px] font-bold leading-tight transition-colors sm:px-3 sm:text-xs ${activeTab === tab.id ? 'border-[#16834b] bg-[#16834b] text-white' : 'border-[#c7d8cc] bg-white text-kharcha-navy'}`}><Icon size={13} className="shrink-0 sm:h-3.5 sm:w-3.5" />{t(tabTranslationKeys[tab.id])}</button>; })}</div></div></AppSectionHeader><div className="mx-auto max-w-5xl px-3 pt-3 sm:px-4 sm:pt-4"><EditSyncReviewBar contextType="shared_home" contextId={home.id} /><EditSyncBackBar contextType="shared_home" contextId={home.id} snapshot={home} /></div><main className="mx-auto max-w-5xl space-y-3 px-3 py-3 sm:space-y-4 sm:px-4 sm:py-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-gray-500">{t('sharedHomeMonthlyView')}</p><h2 className="text-lg font-black text-kharcha-navy">{displayMonth(monthKey, language)}</h2></div><Select value={monthKey} onValueChange={setMonthKey}><SelectTrigger className="w-36 bg-white text-sm sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={monthFromOffset(monthKey, -1)}>{displayMonth(monthFromOffset(monthKey, -1), language)}</SelectItem><SelectItem value={monthKey}>{displayMonth(monthKey, language)}</SelectItem><SelectItem value={monthFromOffset(monthKey, 1)}>{displayMonth(monthFromOffset(monthKey, 1), language)}</SelectItem></SelectContent></Select></div>{content}</main><SharedHomeExpenseDialog open={showExpense} kind={expenseKind} home={home} onOpenChange={setShowExpense} onSave={saveExpense} /><SharedHomeMemberDialog open={showMember} initial={editingMember} onOpenChange={setShowMember} onSave={saveMember} onSaveMultiple={saveMultipleMembers} /><SharedHomeRoomDialog open={showRoom} initial={editingRoom} onOpenChange={setShowRoom} onSave={saveRoom} /><SharedHomeRentDialog open={showRent} home={home} monthKey={monthKey} onOpenChange={setShowRent} onSave={saveRent} /><SharedHomeShareDialog open={showShare} onOpenChange={setShowShare} onShare={handleShareHome} home={home ?? undefined} /><SharedHomeRecurringDialog open={showRecurring} home={home} initial={editingRecurringRule} onOpenChange={open => { setShowRecurring(open); if (!open) setEditingRecurringRule(undefined); }} onSave={saveRecurringRule} />{paymentRequest && <SharedHomePaymentRequestDialog open={Boolean(paymentRequest)} onOpenChange={open => { if (!open) setPaymentRequest(null); }} request={paymentRequest} onPayViaUpi={paySharedHomeSettlementViaUpi} onSharePaymentRequest={shareSharedHomeSettlementRequest} />}<BudgetDialog open={showBudget} onOpenChange={setShowBudget} title={t('budget')} periodLabel={displayMonth(monthKey, language)} initial={budgetConfig} sharedHome initialSettings={home.budgetSettings} onSave={saveBudget} /><BudgetDetailsDialog open={showBudgetDetails} onOpenChange={setShowBudgetDetails} periodLabel={displayMonth(monthKey, language)} summary={budgetSummary} history={budgetHistory} /></div>;
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: 'orange' | 'green' | 'navy' | 'cream' }) {
  const classes = { orange: 'border-[#e87817] bg-[#fff3e3]', green: 'border-[#16834b] bg-[#f2fbf3]', navy: 'border-[#18324b] bg-[#eef4fb]', cream: 'border-[#e7d7bd] bg-white' };
  return <Card className={`rounded-xl border-2 p-2.5 sm:p-3 ${classes[accent]}`}><p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 sm:text-[11px]">{label}</p><p className="mt-1 text-lg font-black text-kharcha-navy sm:text-xl">{value}</p></Card>;
}

function QuickAction({ label, onClick }: { label: string; onClick: () => void }) { return <Button variant="outline" onClick={onClick} className="h-auto min-h-11 rounded-xl border-[#c7d8cc] bg-white px-2 py-2.5 text-[11px] font-bold leading-tight text-kharcha-navy sm:py-3 sm:text-xs">{label}</Button>; }

function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) { return <div className="android-section-header flex items-center justify-between gap-2"><h2 className="text-xl font-black text-kharcha-navy sm:text-2xl">{title}</h2>{actionLabel && onAction && <Button onClick={onAction} className="shrink-0 bg-[#16834b] px-3 py-2 text-sm text-white hover:bg-[#11663b]"><Plus className="mr-1" size={16} />{actionLabel}</Button>}</div>; }

function EmptyPanel({ text }: { text: string }) { return <Card className="rounded-xl border-2 border-dashed border-[#c7d8cc] bg-white p-5 text-center text-sm font-semibold text-gray-600 sm:p-8">{text}</Card>; }

function CalculationCard({ lines }: { lines: RentAllocationLine[] }) { const { t } = useLanguage(); return <Card className="rounded-xl border bg-white p-4"><div className="flex items-center gap-2"><ChevronRight size={16} className="text-[#16834b]" /><h3 className="font-black text-kharcha-navy">{t('sharedHomeViewCalculation')}</h3></div><div className="mt-3 space-y-2">{lines.map(line => <div key={line.memberId} className="flex items-center justify-between rounded-lg bg-[#fffaf3] px-3 py-2 text-sm"><div><p className="font-bold">{line.memberName}</p><p className="text-xs text-gray-500">{t('sharedHomeCalculationDaysRate', { days: line.applicableDays ?? 0, rate: money(line.dailyRate ?? 0) })}</p></div><strong>{money(line.calculatedAmount)}</strong></div>)}</div></Card>; }
