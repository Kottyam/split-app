import React, { useMemo, useState } from 'react';
import { CalendarDays, Home as HomeIcon, Plus, Users, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import SharedHomeCreateDialog from '@/components/SharedHomeCreateDialog';
import { useSharedHomes } from '@/hooks/useSharedHomes';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDeleteConfirmation } from '@/contexts/DeleteConfirmationContext';
import { calculateMonthlyBalances, getExpenseTotals, monthKeyFromDate } from '@/sharedHome/calculations';
import { formatCurrency, formatDate } from '@/lib/utils';
import AppSectionHeader from '@/components/AppSectionHeader';

export default function SharedHomes() {
  const [, navigate] = useLocation();
  const { homes, isLoading, createHome, removeHome } = useSharedHomes();
  const { t } = useLanguage();
  const { requestDelete } = useDeleteConfirmation();
  const [showCreate, setShowCreate] = useState(false);
  const [query, setQuery] = useState('');
  const monthKey = monthKeyFromDate(Date.now());

  const visibleHomes = useMemo(() => [...homes]
    .filter(home => `${home.name} ${home.description ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt)), [homes, query]);

  const handleCreate = (input: Parameters<typeof createHome>[0]) => {
    const home = createHome({ ...input, createdMessage: t('sharedHomeCreatedActivity', { name: input.name }) });
    setShowCreate(false);
    navigate(`/shared-home/${home.id}`);
  };

  if (isLoading) return <PageShell><p className="py-16 text-center font-bold text-gray-600">{t('loadingTrips')}</p></PageShell>;

  return <PageShell><AppSectionHeader
        title={t('mySharedHomes')}
        onBack={() => navigate('/')}
        backLabel={t('backToKharcha')}
        actions={<Button onClick={() => setShowCreate(true)} className="w-full min-h-10 rounded-xl bg-[#16834b] px-3 text-sm font-black text-white shadow-sm hover:bg-[#11663b] sm:px-4"><Plus size={17} className="mr-1" />{t('addSharedHome')}</Button>}
      /><div className="mt-3 sm:mt-4"><Input value={query} onChange={event => setQuery(event.target.value)} placeholder={t('searchSharedHomes')} /></div>{visibleHomes.length === 0 ? <Card className="mt-4 border-2 border-dashed border-[#16834b] bg-[#f2fbf3] p-8 text-center"><p className="font-bold text-gray-600">{query ? t('noSearchResults') : t('noSharedHomes')}</p><Button onClick={() => setShowCreate(true)} className="mt-4 bg-[#16834b] text-white">{t('addSharedHome')}</Button></Card> : <div className="mt-4 space-y-3">{visibleHomes.map(home => { const currentMonthExpenses = getExpenseTotals(home, monthKey); const rent = home.rentPeriods.find(period => period.monthKey === monthKey); const balances = calculateMonthlyBalances(home, monthKey, rent); const managerBalance = balances.find(balance => balance.memberId === home.managerMemberId)?.balance ?? 0; const totalExpense = currentMonthExpenses.total + (rent?.totalRent ?? 0); return <Card key={home.id} className="cursor-pointer rounded-3xl border border-[#b9ddc9] bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-4" onClick={() => navigate(`/shared-home/${home.id}`)}><div className="flex items-start justify-between gap-2 sm:gap-3"><div className="flex min-w-0 items-start gap-2 sm:gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#b9ddc9] text-kharcha-navy"><HomeIcon size={20} /></span><div className="min-w-0"><h2 className="truncate text-base font-black text-kharcha-navy sm:text-lg">{home.name}</h2><p className="mt-1 text-sm text-gray-600">{home.description || t('sharedHomeDescriptionFallback')}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-gray-600"><span className="inline-flex items-center gap-1"><CalendarDays size={14} />{t('sharedHomeCurrentMonth')}: {new Date(`${monthKey}-01T00:00:00Z`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span><span className="inline-flex items-center gap-1"><Users size={14} />{home.members.length} {t('sharedHomeMembersLabel')}</span></div></div></div><Button variant="ghost" size="icon" onClick={event => { event.stopPropagation(); requestDelete({ title: t('deleteSharedHomeConfirm'), message: t('auditActionCannotUndo' as any), onConfirm: () => removeHome(home.id) }); }} aria-label={t('delete')} className="shrink-0 text-red-600"><X size={18} /></Button></div><div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px] font-bold sm:mt-4 sm:gap-2 sm:text-xs sm:grid-cols-3"><div className="rounded-2xl bg-[#f2fbf3] p-2.5"><p className="text-gray-500">{t('sharedHomeExpenseTotal')}</p><p className="mt-1 text-base text-[#e87817]">{formatCurrency(totalExpense)}</p></div><div className="rounded-2xl bg-[#f2fbf3] p-2.5"><p className="text-gray-500">{t('sharedHomeBalance')}</p><p className={`mt-1 text-base ${managerBalance >= 0 ? 'text-[#16834b]' : 'text-red-600'}`}>{managerBalance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(managerBalance))}</p></div><div className="rounded-2xl bg-[#f2fbf3] p-2.5"><p className="text-gray-500">{t('sharedHomeRecent')}</p><p className="mt-1 text-base text-kharcha-navy">{formatDate(home.updatedAt ?? home.createdAt)}</p></div></div></Card>; })}</div>}<SharedHomeCreateDialog open={showCreate} onOpenChange={setShowCreate} onCreateHome={handleCreate} /></PageShell>;
}

function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-kharcha-cream px-3 pb-12 pt-4 sm:px-4 sm:pt-6"><div className="mx-auto max-w-3xl">{children}</div></div>;
}
