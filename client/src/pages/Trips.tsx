import React, { useMemo, useState } from 'react';
import { CalendarDays, Plus, Users, Wallet, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CreateTripDialog from '@/components/CreateTripDialog';
import { useTrips } from '@/hooks/useTrips';
import { useLanguage } from '@/contexts/LanguageContext';
import { calculateTripBudget } from '@/budget/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import AppSectionHeader from '@/components/AppSectionHeader';

type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc';

function formatTripDate(value: number, language: string): string {
  return new Date(value).toLocaleDateString(language === 'en' ? 'en-IN' : `${language}-IN`);
}

export default function Trips() {
  const [, navigate] = useLocation();
  const { trips, isLoading, createTrip, removeTrip } = useTrips();
  const { t, language } = useLanguage();
  const [showCreate, setShowCreate] = useState(false);
  const [sort, setSort] = useState<SortOption>('newest');
  const [query, setQuery] = useState('');
  const [tripPendingDelete, setTripPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const visibleTrips = useMemo(() => [...trips]
    .filter(trip => `${trip.name} ${trip.description}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => sort === 'newest' ? b.createdAt - a.createdAt : sort === 'oldest' ? a.createdAt - b.createdAt : sort === 'name-asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)), [trips, query, sort]);

  const handleCreate = (name: string, description: string, startDate: number, endDate: number) => {
    const trip = createTrip(name, description, startDate, endDate);
    setShowCreate(false);
    if (trip) navigate(`/trip/${trip.id}`);
  };

  if (isLoading) return <PageShell><p className="py-16 text-center font-bold text-gray-600">{t('loadingTrips')}</p></PageShell>;

  return <PageShell><AppSectionHeader
        title={t('myTrips')}
        onBack={() => navigate('/')}
        backLabel={t('backToKharcha')}
        actions={<Button onClick={() => setShowCreate(true)} className="w-full min-h-10 rounded-xl bg-[#e87817] px-3 text-sm font-black text-white shadow-sm hover:bg-[#c85f0b] sm:px-4"><Plus size={17} className="mr-1" />{t('addTrip')}</Button>}
      /><div className="mt-3 grid gap-2 sm:mt-4 sm:grid-cols-[1fr_auto]"><Input value={query} onChange={event => setQuery(event.target.value)} placeholder={t('searchTrips')} /><Select value={sort} onValueChange={value => setSort(value as SortOption)}><SelectTrigger className="bg-white text-sm sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="newest">{t('newestFirst')}</SelectItem><SelectItem value="oldest">{t('oldestFirst')}</SelectItem><SelectItem value="name-asc">{t('nameAZ')}</SelectItem><SelectItem value="name-desc">{t('nameZA')}</SelectItem></SelectContent></Select></div>{visibleTrips.length === 0 ? <Card className="mt-4 border-2 border-dashed border-[#e87817] bg-[#fffaf3] p-8 text-center"><p className="font-bold text-gray-600">{query ? t('noSearchResults') : t('noTrips')}</p><Button onClick={() => setShowCreate(true)} className="mt-4 bg-[#e87817] text-white">{t('addTrip')}</Button></Card> : <div className="mt-4 space-y-3">{visibleTrips.map(trip => { const budget = calculateTripBudget({ trip, config: trip.budget }); return <Card key={trip.id} className="mx-auto w-full max-w-2xl cursor-pointer rounded-3xl border border-[#f0c28f] bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-4" onClick={() => navigate(`/trip/${trip.id}`)}><div className="flex items-start justify-between gap-2 sm:gap-3"><div className="min-w-0"><h2 className="truncate text-base font-black text-kharcha-navy sm:text-lg">{trip.name}</h2><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-gray-600"><span className="inline-flex items-center gap-1"><CalendarDays size={14} />{formatTripDate(trip.startDate, language)} – {formatTripDate(trip.endDate, language)}</span><span className="inline-flex items-center gap-1"><Users size={14} />{trip.members.length} {t('tripMembers')}</span></div></div><Button variant="ghost" size="icon" onClick={event => { event.stopPropagation(); setTripPendingDelete({ id: trip.id, name: trip.name }); }} aria-label={t('delete')} className="shrink-0 text-red-600"><X size={18} /></Button></div><div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px] font-bold sm:mt-4 sm:gap-2 sm:text-xs sm:grid-cols-3"><div className="rounded-2xl bg-[#fffaf3] p-2.5"><p className="text-gray-500">{t('tripExpenseTotal')}</p><p className="mt-1 text-base text-[#e87817]">{formatCurrency(trip.expenses.filter(expense => expense.status !== 'cancelled').reduce((sum, expense) => sum + expense.amount, 0))}</p></div>{budget.configured && <div className="rounded-2xl bg-[#f2fbf3] p-2.5"><p className="text-gray-500">{budget.status === 'exceeded' ? t('budgetOver') : t('budgetRemaining')}</p><p className={`mt-1 inline-flex items-center gap-1 text-base ${budget.status === 'exceeded' ? 'text-red-600' : 'text-[#16834b]'}`}><Wallet size={14} />{formatCurrency(budget.status === 'exceeded' ? budget.overBudget : budget.remaining)}</p></div>}</div></Card>; })}</div>}<CreateTripDialog open={showCreate} onOpenChange={setShowCreate} onCreateTrip={handleCreate} /><DeleteConfirmationDialog open={tripPendingDelete !== null} onOpenChange={open => { if (!open) setTripPendingDelete(null); }} title={t('deleteTripConfirm')} message={t('deleteTripConfirm')} cancelLabel={t('auditCancel' as any)} deleteLabel={t('delete')} onConfirm={() => { if (tripPendingDelete) removeTrip(tripPendingDelete.id); }} /></PageShell>;
}

function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-kharcha-cream px-3 pb-12 pt-4 sm:px-4 sm:pt-6"><div className="mx-auto max-w-3xl">{children}</div></div>;
}
