import { useState, useMemo, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';
import { useTrips } from '@/hooks/useTrips';
import { getTripById } from '@/lib/storage';
import { generateTripSummary } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Users, BarChart3, CreditCard, Share2, Split, Wallet, FileText, Printer } from 'lucide-react';
import { Expense, Member } from '@/types';
import AddExpenseDialog from '@/components/AddExpenseDialog';
import AddMemberDialog from '@/components/AddMemberDialog';
import EditExpenseDialog from '@/components/EditExpenseDialog';
import EditMemberDialog from '@/components/EditMemberDialog';
import DeleteMemberDialog from '@/components/DeleteMemberDialog';
import ShareTripDialog from '@/components/ShareTripDialog';
import EditSyncShareDialog from '@/components/EditSyncShareDialog';
import EditSyncBackBar from '@/components/EditSyncBackBar';
import EditSyncReviewBar from '@/components/EditSyncReviewBar';
import TripPayExpenseDialog from '@/components/TripPayExpenseDialog';
import SettlementView from '@/components/SettlementView';
import DashboardView from '@/components/DashboardView';
import ExpenseListView from '@/components/ExpenseListView';
import { formatCurrency } from '@/lib/utils';
import { KHARCHA_LOGO_LOCKUP } from '@/components/BrandLogo';
import BudgetCard from '@/budget/BudgetCard';
import BudgetDialog from '@/budget/BudgetDialog';
import BudgetDetailsDialog from '@/budget/BudgetDetailsDialog';
import { calculateTripBudget } from '@/budget/types';
import { toast } from 'sonner';
import { buildTripReportModel, getTripReportCategoryKey, getTripSettlementStatus } from '@/lib/tripReport';
import AppSectionHeader from '@/components/AppSectionHeader';
import { PDF_LAYOUT_CSS } from '@/lib/pdfLayout';

interface TripDetailProps {
  params: { id: string };
}

export default function TripDetail({ params }: TripDetailProps) {
  const [, navigate] = useLocation();
  const { trips, updateTrip } = useTrips();
  const { t } = useLanguage();
  const tripId = params.id;
  const trip = getTripById(tripId);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditExpense, setShowEditExpense] = useState(false);
  const [showEditMember, setShowEditMember] = useState(false);
  const [showDeleteMember, setShowDeleteMember] = useState(false);
  const [showShareTrip, setShowShareTrip] = useState(false);
  const [showEditSyncTrip, setShowEditSyncTrip] = useState(false);
  const [showTripPayExpense, setShowTripPayExpense] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [showBudgetDetails, setShowBudgetDetails] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [, setTripRevision] = useState(0);
  const previousMemberCount = useRef(trip?.members.length ?? 0);
  const memberCount = trip?.members.length ?? 0;

  useEffect(() => {
    setActiveTab('dashboard');
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [tripId]);

  useEffect(() => {
    if (previousMemberCount.current === 0 && memberCount > 0) {
      setActiveTab('expenses');
    }
    previousMemberCount.current = memberCount;
  }, [memberCount]);

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowEditExpense(true);
  };

  const handleEditMember = (member: Member) => {
    setSelectedMember(member);
    setShowEditMember(true);
  };

  const handleDeleteMember = (member: Member) => {
    setSelectedMember(member);
    setShowDeleteMember(true);
  };

  if (!trip) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-kharcha-navy font-bold text-xl mb-4">{t('tripNotFound')}</p>
          <Button
            onClick={() => navigate('/')}
            className="bg-kharcha-navy text-white font-bold rounded-full"
          >
            <ArrowLeft className="mr-2" size={18} />
            {t('backToTrips')}
          </Button>
        </div>
      </div>
    );
  }

  const summary = useMemo(() => generateTripSummary(trip), [trip]);
  const budgetSummary = useMemo(() => calculateTripBudget({ trip, config: trip.budget }), [trip]);
  const saveBudget = (config: import('@/types').BudgetConfig) => updateTrip({ ...trip, budget: config });

  const handleGeneratePdfReport = (action: 'view' | 'print' | 'share' = 'view') => {
    const report = buildTripReportModel(trip);
    const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>\"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[character] ?? character));
    const money = (value: number) => formatCurrency(value);
    const displayDate = (timestamp: number) => new Date(timestamp).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    const reportTitle = `${trip.name} - ${t('auditPdfReport' as any)}`;
    const categoryRows = report.categoryRows.map(row => `<tr><td>${escapeHtml(t(getTripReportCategoryKey(row.category) as any))}</td><td>${money(row.amount)}</td></tr>`).join('');
    const memberRows = report.memberRows.map(row => {
      const balance = row.net >= 0 ? `${t('paid' as any)} ${money(row.net)}` : `${t('owes' as any)} ${money(Math.abs(row.net))}`;
      return `<tr><td>${escapeHtml(row.memberName)}</td><td>${money(row.paid)}</td><td>${money(row.owed)}</td><td>${escapeHtml(balance)}</td></tr>`;
    }).join('');
    let settlementStatusOverrides: Record<string, string | undefined> = {};
    try {
      const stored = localStorage.getItem(`settlement_status_${trip.id}`);
      if (stored) settlementStatusOverrides = JSON.parse(stored) as Record<string, string | undefined>;
    } catch {
      // Keep the report fallback status when persisted settlement state is unavailable.
    }
    const settlementRows = report.settlements.map(item => {
      const status = getTripSettlementStatus(item, settlementStatusOverrides);
      const statusLabel = status === 'settled' ? t('settled' as any) : status === 'received' ? t('received' as any) : t('auditPending' as any);
      return `<tr><td>${escapeHtml(item.from)}</td><td>${escapeHtml(item.to)}</td><td>${money(item.amount)}</td><td>${escapeHtml(statusLabel)}</td></tr>`;
    }).join('');
    const expenseRows = trip.expenses.slice().sort((a, b) => a.date - b.date).map(expense => {
      const payer = trip.members.find(member => member.id === expense.paidBy)?.name || t('auditUnknown' as any);
      return `<tr><td>${escapeHtml(displayDate(expense.date))}</td><td>${escapeHtml(expense.description)}</td><td>${escapeHtml(t(getTripReportCategoryKey(expense.category) as any))}</td><td>${escapeHtml(payer)}</td><td>${money(expense.amount)}</td></tr>`;
    }).join('');
    const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(reportTitle)}</title><style>${PDF_LAYOUT_CSS}</style></head><body><div class="report"><header><img src="${KHARCHA_LOGO_LOCKUP}" alt="${escapeHtml(t('brandLogoAlt' as any))}"><div><h1>${escapeHtml(report.tripName)}</h1><p class="meta">${escapeHtml(report.description)}</p><p class="meta">${escapeHtml(t('startDate' as any))}: ${escapeHtml(displayDate(report.startDate))} · ${escapeHtml(t('endDate' as any))}: ${escapeHtml(displayDate(report.endDate))}</p><p class="meta">${escapeHtml(t('auditGeneratedOn' as any))}: ${escapeHtml(displayDate(Date.now()))}</p></div></header><div class="summary"><div class="metric">${escapeHtml(t('totalExpenses' as any))}<strong>${money(report.totalExpenses)}</strong></div><div class="metric">${escapeHtml(t('members'))}<strong>${report.memberCount}</strong></div><div class="metric">${escapeHtml(t('expenses'))}<strong>${report.expenseCount}</strong></div></div><h2>${escapeHtml(t('auditCategoryWiseExpenses' as any))}</h2>${categoryRows ? `<table class="category"><thead><tr><th>${escapeHtml(t('category'))}</th><th>${escapeHtml(t('amount'))}</th></tr></thead><tbody>${categoryRows}</tbody></table>` : `<p class="empty">${escapeHtml(t('auditNoExpensesYet' as any))}</p>`}<h2>${escapeHtml(t('auditMemberWiseSummary' as any))}</h2>${memberRows ? `<table class="member"><thead><tr><th>${escapeHtml(t('members'))}</th><th>${escapeHtml(t('paid'))}</th><th>${escapeHtml(t('owes'))}</th><th>${escapeHtml(t('auditBalanceLabel' as any))}</th></tr></thead><tbody>${memberRows}</tbody></table>` : `<p class="empty">${escapeHtml(t('noMembers'))}</p>`}<h2>${escapeHtml(t('settlementSummary'))}</h2>${settlementRows ? `<table class="settlement"><thead><tr><th>${escapeHtml(t('auditPaidBy' as any))}</th><th>${escapeHtml(t('auditPayTo' as any))}</th><th>${escapeHtml(t('amount'))}</th><th>${escapeHtml(t('auditCurrentStatus' as any))}</th></tr></thead><tbody>${settlementRows}</tbody></table>` : `<p class="empty">${escapeHtml(t('noPaymentsNeeded'))}</p>`}<h2>${escapeHtml(t('expenses'))}</h2>${expenseRows ? `<table class="expenses"><thead><tr><th>${escapeHtml(t('date'))}</th><th>${escapeHtml(t('description'))}</th><th>${escapeHtml(t('category'))}</th><th>${escapeHtml(t('paidBy'))}</th><th>${escapeHtml(t('amount'))}</th></tr></thead><tbody>${expenseRows}</tbody></table>` : `<p class="empty">${escapeHtml(t('auditNoExpensesYet' as any))}</p>`}</div></body></html>`;
    const nativePdf = (window as Window & { KharchaPdf?: { showReport: (html: string, title: string, backLabel: string, printLabel: string, saveLabel: string, shareLabel: string) => boolean; showReportAction?: (html: string, title: string, backLabel: string, printLabel: string, saveLabel: string, shareLabel: string, action: string) => boolean } }).KharchaPdf;
    if (nativePdf && typeof nativePdf.showReport === 'function') {
      try {
        const opened = action !== 'view' && typeof nativePdf.showReportAction === 'function'
          ? nativePdf.showReportAction(htmlContent, reportTitle, t('auditPdfBack' as any), t('auditPdfPrint' as any), t('auditPdfSave' as any), t('sharedHomeShare' as any), action)
          : nativePdf.showReport(htmlContent, reportTitle, t('auditPdfBack' as any), t('auditPdfPrint' as any), t('auditPdfSave' as any), t('sharedHomeShare' as any));
        if (opened) {
          toast.success(t('auditPdfGenerated' as any));
          return;
        }
      } catch {
        // Use browser fallback only when the native report bridge is unavailable.
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
    window.setTimeout(() => printWindow.print(), 180);
  };

  return (
    <div className="min-h-screen bg-kharcha-cream pb-24 relative overflow-x-hidden">
      {/* Header */}
      <AppSectionHeader
        title={trip.name}
        onBack={() => navigate('/')}
        backLabel={t('backToKharcha')}
        actions={<><Button onClick={() => setShowTripPayExpense(true)} className="w-full bg-kharcha-saffron text-white font-black rounded-xl hover:brightness-95 shadow-md"><CreditCard size={18} className="mr-2" />{t('payAddExpenseAutomatically')}</Button><Button variant="default" size="sm" onClick={() => setShowShareTrip(true)} className="w-full rounded-xl bg-[#16834b] px-3 text-sm font-black text-white shadow-sm hover:bg-[#11663b]" title={t('shareThisTrip')}><Share2 size={16} className="mr-1.5" />{t('sharedHomeShare' as any)}</Button></>}
      >
        <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2">
          <Card className="rounded-xl border border-[#d7e4dc] bg-white p-1.5 text-center sm:p-2"><p className="text-xs font-bold text-gray-600">{t('total')}</p><p className="text-base font-black text-kharcha-navy sm:text-lg">{formatCurrency(summary.totalExpenses)}</p></Card>
          <Card className="rounded-xl border border-[#d7e4dc] bg-white p-1.5 text-center sm:p-2"><p className="text-xs font-bold text-gray-600">{t('members')}</p><p className="text-base font-black text-kharcha-navy sm:text-lg">{trip.members.length}</p></Card>
          <Card className="rounded-xl border border-[#d7e4dc] bg-white p-1.5 text-center sm:p-2"><p className="text-xs font-bold text-gray-600">{t('expenses')}</p><p className="text-base font-black text-kharcha-navy sm:text-lg">{trip.expenses.length}</p></Card>
        </div>
        <div className="mt-3"><BudgetCard summary={budgetSummary} onOpenDetails={() => setShowBudgetDetails(true)} onEdit={() => setShowBudget(true)} /></div>
      </AppSectionHeader>
      <div className="px-3 pt-3 sm:px-4 sm:pt-4">
        <EditSyncReviewBar contextType="trip" contextId={trip.id} />
        <EditSyncBackBar contextType="trip" contextId={trip.id} snapshot={trip} />
      </div>

      {/* Tabs */}
      <div className="px-3 py-3 sm:px-4 sm:py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="android-trip-tabs grid h-auto min-h-14 w-full grid-cols-5 gap-1 rounded-xl border border-[#d7e4dc] bg-[#e7f0ea] p-1">
            <TabsTrigger value="dashboard" className="min-h-12 min-w-0 rounded-xl px-1 text-center text-sm font-black leading-tight text-kharcha-navy whitespace-normal transition-colors data-[state=active]:border-kharcha-green data-[state=active]:bg-kharcha-green data-[state=active]:text-white data-[state=active]:shadow-[0_2px_0_0_rgba(0,0,0,0.22)] sm:px-2 sm:text-base">
              {t('dashboard')}
            </TabsTrigger>
            <TabsTrigger value="members" className="min-h-12 min-w-0 rounded-xl px-1 text-center text-sm font-black leading-tight text-kharcha-navy whitespace-normal transition-colors data-[state=active]:border-kharcha-green data-[state=active]:bg-kharcha-green data-[state=active]:text-white data-[state=active]:shadow-[0_2px_0_0_rgba(0,0,0,0.22)] sm:px-2 sm:text-base">
              {t('members')}
            </TabsTrigger>
            <TabsTrigger value="expenses" className="min-h-12 min-w-0 rounded-xl px-1 text-center text-sm font-black leading-tight text-kharcha-navy whitespace-normal transition-colors data-[state=active]:border-kharcha-green data-[state=active]:bg-kharcha-green data-[state=active]:text-white data-[state=active]:shadow-[0_2px_0_0_rgba(0,0,0,0.22)] sm:px-2 sm:text-base">
              {t('expenses')}
            </TabsTrigger>
            <TabsTrigger value="settle" className="min-h-12 min-w-0 rounded-xl px-1 text-center text-sm font-black leading-tight text-kharcha-navy whitespace-normal transition-colors data-[state=active]:border-kharcha-green data-[state=active]:bg-kharcha-green data-[state=active]:text-white data-[state=active]:shadow-[0_2px_0_0_rgba(0,0,0,0.22)] sm:px-2 sm:text-base">
              {t('settle')}
            </TabsTrigger>
            <TabsTrigger value="reports" className="min-h-12 min-w-0 rounded-xl px-1 text-center text-sm font-black leading-tight text-kharcha-navy whitespace-normal transition-colors data-[state=active]:border-kharcha-green data-[state=active]:bg-kharcha-green data-[state=active]:text-white data-[state=active]:shadow-[0_2px_0_0_rgba(0,0,0,0.22)] sm:px-2 sm:text-base">
              {t('auditPdfReport' as any)}
            </TabsTrigger>
          </TabsList>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4 mt-4">
            <ExpenseListView trip={trip} onEditExpense={handleEditExpense} onExpenseDeleted={() => setTripRevision(revision => revision + 1)} />
            {trip.members.length === 0 && (
              <Card className="border border-[#d7e4dc] bg-white p-5 text-center rounded-xl">
                <p className="font-semibold text-gray-600">{t('pleaseAddMembers')}</p>
                <Button
                  type="button"
                  data-testid="trip-add-members-from-expense"
                  onClick={() => {
                    setActiveTab('members');
                    setShowAddMember(true);
                  }}
                  className="mt-3 w-full bg-[#18324b] text-white font-bold rounded-xl border-2 border-[#18324b] hover:bg-[#10263a]"
                >
                  <Users size={18} className="mr-2" />
                  {t('addMember')}
                </Button>
              </Card>
            )}
            <Button
              type="button"
              data-testid="trip-add-expense"
              disabled={trip.members.length === 0}
              onClick={() => {
                if (trip.members.length > 0) setShowAddExpense(true);
              }}
              className="w-full min-h-12 bg-[#18324b] text-white font-bold rounded-xl border-2 border-[#18324b] hover:bg-[#10263a] disabled:cursor-not-allowed disabled:bg-[#18324b] disabled:text-white disabled:opacity-100"
            >
              <Split size={18} className="mr-2" />
              {t('howToSplitAddExpense')}
            </Button>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4 mt-4">
            <div className="space-y-2">
              {trip.members.length === 0 ? (
                <Card className="bg-white border border-[#d7e4dc] rounded-xl p-6 text-center">
                  <Users className="mx-auto mb-3 text-gray-400" size={32} />
                  <p className="text-gray-600 font-semibold">{t('noMembers')}</p>
                </Card>
              ) : (
                trip.members.map(member => (
                  <Card key={member.id} className="bg-white border border-[#d7e4dc] rounded-xl p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-bold text-kharcha-navy">{member.name}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {t('paid')}: {formatCurrency(summary.memberSpend[member.id] || 0)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {t('owes')}: {formatCurrency(summary.memberOwes[member.id] || 0)}
                        </p>
                      </div>
                      <div className="android-action-row flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditMember(member)}
                          className="text-blue-600 hover:bg-blue-50 text-xs"
                        >
                          {t('edit')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMember(member)}
                          className="text-red-600 hover:bg-red-50 text-xs"
                        >
                          {t('delete')}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                aria-label={t('addMember')}
                data-testid="trip-add-members"
                onClick={() => setShowAddMember(true)}
                className="flex-1 min-h-12 bg-[#18324b] text-white font-bold rounded-xl border-2 border-[#18324b] hover:bg-[#10263a]"
              >
                <Plus size={18} className="mr-2" />
                {t('addMember')}
              </Button>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4 mt-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <Button
                type="button"
                aria-label={`${t('auditPdfReport' as any)} - ${t('viewOnly')}`}
                onClick={() => handleGeneratePdfReport('view')}
                className="w-full bg-kharcha-navy text-white font-bold rounded-xl hover:bg-gray-800"
              >
                <FileText size={18} className="mr-2" />
                {t('auditPdfReport' as any)}
              </Button>
              <Button
                type="button"
                aria-label={t('auditPdfPrint' as any)}
                onClick={() => handleGeneratePdfReport('print')}
                className="w-full bg-kharcha-green text-white font-bold rounded-xl hover:bg-green-700"
              >
                <Printer size={18} className="mr-2" />
                {t('auditPdfPrint' as any)}
              </Button>
              <Button
                type="button"
                aria-label={t('sharedHomeShare' as any)}
                onClick={() => handleGeneratePdfReport('share')}
                className="w-full bg-[#265fa5] text-white font-bold rounded-xl hover:bg-blue-800"
              >
                <Share2 size={18} className="mr-2" />
                {t('sharedHomeShare' as any)}
              </Button>
            </div>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-4">
            <DashboardView trip={trip} summary={summary} />
          </TabsContent>

          {/* Settlement Tab */}
          <TabsContent value="settle" className="mt-4">
            <SettlementView
              summary={summary}
              trip={trip}
              onQuickExpense={() => {
                setActiveTab('expenses');
                setShowAddExpense(true);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <AddExpenseDialog
        open={showAddExpense}
        onOpenChange={setShowAddExpense}
        trip={trip}
      />
      <AddMemberDialog
        open={showAddMember}
        onOpenChange={setShowAddMember}
        trip={trip}
      />
      <EditExpenseDialog
        open={showEditExpense}
        onOpenChange={setShowEditExpense}
        trip={trip}
        expense={selectedExpense}
      />
      <EditMemberDialog
        open={showEditMember}
        onOpenChange={setShowEditMember}
        trip={trip}
        member={selectedMember}
      />
      <DeleteMemberDialog
        open={showDeleteMember}
        onOpenChange={setShowDeleteMember}
        trip={trip}
        member={selectedMember}
      />
      <ShareTripDialog
        open={showShareTrip}
        onOpenChange={setShowShareTrip}
        trip={trip}
        onEditSync={() => { setShowShareTrip(false); setShowEditSyncTrip(true); }}
        onSyncUpdates={() => { setShowShareTrip(false); navigate('/sync-updates'); }}
      />
      <EditSyncShareDialog
        open={showEditSyncTrip}
        onOpenChange={setShowEditSyncTrip}
        contextType="trip"
        contextId={trip.id}
        contextName={trip.name}
        snapshot={trip}
      />
      <BudgetDialog open={showBudget} onOpenChange={setShowBudget} title={t('budget')} periodLabel={t('budgetEntireTrip')} initial={trip.budget} onSave={saveBudget} />
      <BudgetDetailsDialog open={showBudgetDetails} onOpenChange={setShowBudgetDetails} periodLabel={t('budgetEntireTrip')} summary={budgetSummary} />
      <TripPayExpenseDialog
        open={showTripPayExpense}
        onOpenChange={setShowTripPayExpense}
        trip={trip}
      />
    </div>
  );
}
