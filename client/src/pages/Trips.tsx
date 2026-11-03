import React, { useMemo, useState } from 'react';
import { CalendarDays, Plane, Plus, Users, Wallet, X } from 'lucide-react';
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
        subtitle={t('tripsDescription')}
        icon={<Plane size={24} />}
        accent="orange"
        onBack={() => navigate('/')}
        backLabel={t('backToKharcha')}
        actions={<Button variant="trip" onClick={() => setShowCreate(true)} className="w-full min-h-12 px-3 text-base sm:px-4"><Plus size={18} className="mr-1" />{t('addTrip')}</Button>}
      /><div className="mt-3 grid gap-2 sm:mt-4 sm:grid-cols-[1fr_auto]"><Input value={query} onChange={event => setQuery(event.target.value)} placeholder={t('searchTrips')} /><Select value={sort} onValueChange={value => setSort(value as SortOption)}><SelectTrigger className="bg-white text-sm sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="newest">{t('newestFirst')}</SelectItem><SelectItem value="oldest">{t('oldestFirst')}</SelectItem><SelectItem value="name-asc">{t('nameAZ')}</SelectItem><SelectItem value="name-desc">{t('nameZA')}</SelectItem></SelectContent></Select></div>{visibleTrips.length === 0 ? <Card className="mt-4 items-center rounded-[26px] border border-[#ffd9b8] bg-white p-8 text-center shadow-[0_10px_28px_rgba(253,109,0,0.10)]"><span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#fd6d00] text-white shadow-md"><Plane size={30} /></span><p className="font-bold text-[#5b6b78]">{query ? t('noSearchResults') : t('noTrips')}</p><Button variant="trip" onClick={() => setShowCreate(true)} className="mt-2 min-h-12 w-full max-w-xs"><Plus size={18} />{t('addTrip')}</Button></Card> : <div className="mt-4 space-y-3">{visibleTrips.map(trip => { const budget = calculateTripBudget({ trip, config: trip.budget }); return <Card key={trip.id} className="relative mx-auto w-full max-w-2xl cursor-pointer gap-0 overflow-hidden rounded-[22px] border border-[#e3ebf3] bg-white py-0 pl-5 pr-3 pt-4 pb-4 shadow-[0_10px_28px_rgba(2,59,129,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(2,59,129,0.14)] sm:pr-4" onClick={() => navigate(`/trip/${trip.id}`)}><span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-[#fd6d00]" /><div className="flex items-start justify-between gap-2 sm:gap-3"><div className="flex min-w-0 items-start gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fff1e5] text-[#fd6d00]"><Plane size={22} /></span><div className="min-w-0"><h2 className="truncate text-base font-black text-[#023b81] sm:text-lg">{trip.name}</h2><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-gray-600"><span className="inline-flex items-center gap-1"><CalendarDays size={14} />{formatTripDate(trip.startDate, language)} – {formatTripDate(trip.endDate, language)}</span><span className="inline-flex items-center gap-1"><Users size={14} />{trip.members.length} {t('tripMembers')}</span></div></div></div><Button variant="ghost" size="icon" onClick={event => { event.stopPropagation(); setTripPendingDelete({ id: trip.id, name: trip.name }); }} aria-label={t('delete')} className="shrink-0 text-red-600"><X size={18} /></Button></div><div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px] font-bold sm:mt-4 sm:gap-2 sm:text-xs sm:grid-cols-3"><div className="rounded-2xl bg-[#fff1e5] p-2.5"><p className="text-gray-500">{t('tripExpenseTotal')}</p><p className="mt-1 text-base text-[#fd6d00]">{formatCurrency(trip.expenses.filter(expense => expense.status !== 'cancelled').reduce((sum, expense) => sum + expense.amount, 0))}</p></div>{budget.configured && <div className="rounded-2xl bg-[#e6f6ea] p-2.5"><p className="text-gray-500">{budget.status === 'exceeded' ? t('budgetOver') : t('budgetRemaining')}</p><p className={`mt-1 inline-flex items-center gap-1 text-base ${budget.status === 'exceeded' ? 'text-red-600' : 'text-[#16834b]'}`}><Wallet size={14} />{formatCurrency(budget.status === 'exceeded' ? budget.overBudget : budget.remaining)}</p></div>}</div></Card>; })}</div>}<CreateTripDialog open={showCreate} onOpenChange={setShowCreate} onCreateTrip={handleCreate} /><DeleteConfirmationDialog open={tripPendingDelete !== null} onOpenChange={open => { if (!open) setTripPendingDelete(null); }} title={t('deleteTripConfirm')} message={t('deleteTripConfirm')} cancelLabel={t('auditCancel' as any)} deleteLabel={t('delete')} onConfirm={() => { if (tripPendingDelete) removeTrip(tripPendingDelete.id); }} /></PageShell>;
}

function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-kharcha-cream px-3 pb-12 pt-4 sm:px-4 sm:pt-6"><div className="mx-auto max-w-3xl">{children}</div></div>;
}
