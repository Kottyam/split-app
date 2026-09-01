import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, CalendarDays, CheckCircle2, ChevronRight, Home as HomeIcon, Receipt, Settings, Users, Wallet } from 'lucide-react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { getSharedHomeById } from '@/sharedHome/storage';
import type { SharedHome } from '@/sharedHome/types';

type Tab = 'overview' | 'money' | 'recurring' | 'members' | 'reports';

const tabs: { id: Tab; key: any; icon: React.ElementType }[] = [
  { id: 'overview', key: 'sharedHomeOverview', icon: BarChart3 },
  { id: 'money', key: 'sharedHomeSettlements', icon: Wallet },
  { id: 'recurring', key: 'sharedHomeRecurring', icon: CalendarDays },
  { id: 'members', key: 'sharedHomeMembers', icon: Users },
  { id: 'reports', key: 'sharedHomeReports', icon: BarChart3 },
];

const money = (value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function SharedHomeRedesign() {
  const [, params] = useRoute('/shared-home/:id');
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const [home, setHome] = useState<SharedHome | null>(null);
  const [tab, setTab] = useState<Tab>('overview');

  useEffect(() => {
    if (!params?.id) return;
    setHome(getSharedHomeById(params.id));
  }, [params?.id]);

  const stats = useMemo(() => {
    if (!home) return { expenses: 0, paid: 0, pending: 0, members: 0 };
    const activeExpenses = home.expenses.filter(e => e.status !== 'cancelled');
    const expenses = activeExpenses.reduce((sum, e) => sum + e.amount, 0);
    const paid = home.settlements.filter(s => s.status === 'recorded').reduce((sum, s) => sum + s.amount, 0);
    return { expenses, paid, pending: Math.max(0, expenses - paid), members: home.members.filter(m => m.isActive).length };
  }, [home]);

  if (!home) {
    return <div className="min-h-screen p-6 flex items-center justify-center text-sm font-semibold">Shared home not found.</div>;
  }

  return (
    <div className="min-h-screen bg-[#f7f8f6] pb-24">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/shared-homes')} aria-label="Back"><ArrowLeft size={20} /></Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><HomeIcon size={18} /><h1 className="font-black truncate">{home.name}</h1></div>
            <p className="text-xs text-gray-500 truncate">{home.address || home.homeType}</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate(`/shared-home/${home.id}/manage`)}><Settings size={16} />Manage</Button>
        </div>
        <div className="max-w-5xl mx-auto px-3 overflow-x-auto">
          <div className="flex min-w-max gap-1 pb-1">
            {tabs.map(({ id, key, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} className={`px-4 py-3 rounded-t-xl text-sm font-bold flex items-center gap-2 ${tab === id ? 'bg-[#16834b] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                <Icon size={16} />{t(key)}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-4">
        {tab === 'overview' && <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label={t('sharedHomeExpenses')} value={money(stats.expenses)} icon={Receipt} />
            <Stat label={t('sharedHomeSettlements')} value={money(stats.paid)} icon={CheckCircle2} />
            <Stat label="Pending" value={money(stats.pending)} icon={Wallet} />
            <Stat label={t('sharedHomeMembers')} value={String(stats.members)} icon={Users} />
          </div>
          <Section title={t('sharedHomeExpenses')}>
            {home.expenses.length === 0 ? <Empty /> : home.expenses.slice().sort((a,b) => b.date-a.date).slice(0,8).map(e => <Row key={e.id} title={e.name} meta={`${new Date(e.date).toLocaleDateString('en-IN')} · ${e.category}`} value={money(e.amount)} />)}
          </Section>
        </>}

        {tab === 'money' && <>
          <Section title={t('sharedHomeSettlements')}>
            <p className="text-sm text-gray-600 mb-3">Payments are kept separate from expenses, so settling a balance does not create another expense.</p>
            {home.settlements.length === 0 ? <Empty /> : home.settlements.slice().sort((a,b) => b.date-a.date).map(s => {
              const from = home.members.find(m => m.id === s.fromMemberId)?.name || 'Member';
              const to = home.members.find(m => m.id === s.toMemberId)?.name || 'Member';
              return <Row key={s.id} title={`${from} → ${to}`} meta={`${new Date(s.date).toLocaleDateString('en-IN')} · ${s.paymentMethod}`} value={money(s.amount)} />;
            })}
          </Section>
        </>}

        {tab === 'recurring' && <Section title={t('sharedHomeRecurring')}>
          {home.recurringRules.length === 0 ? <Empty /> : home.recurringRules.map(r => <Row key={r.id} title={r.name} meta={`${r.frequency} · ${r.amountMode} · ${r.status}`} value={r.fixedAmount != null ? money(r.fixedAmount) : 'Variable'} />)}
        </Section>}

        {tab === 'members' && <Section title={t('sharedHomeMembers')}>
          {home.members.length === 0 ? <Empty /> : home.members.map(m => <Row key={m.id} title={m.name} meta={`${m.mobileNumber || 'No phone'} · ${m.isActive ? 'Active' : 'Inactive'}`} value={m.upiId || ''} />)}
          {home.rooms.length > 0 && <div className="mt-4 border-t pt-4"><h3 className="font-black mb-2">Rooms</h3>{home.rooms.map(r => <Row key={r.id} title={r.name} meta={`${r.memberIds.length} member(s)`} value={r.defaultRent != null ? money(r.defaultRent) : ''} />)}</div>}
        </Section>}

        {tab === 'reports' && <>
          <Section title={t('sharedHomeReports')}>
            <div className="grid md:grid-cols-3 gap-3">
              <Mini label="Total expenses" value={money(stats.expenses)} />
              <Mini label="Recorded settlements" value={money(stats.paid)} />
              <Mini label="Net pending" value={money(stats.pending)} />
            </div>
          </Section>
          <Section title="Monthly activity">
            {Object.values(home.months).length === 0 ? <Empty /> : Object.values(home.months).slice().sort((a,b) => b.monthKey.localeCompare(a.monthKey)).map(m => <Row key={m.monthKey} title={m.monthKey} meta={`${m.balances.length} balances`} value={money(m.totalExpenses)} />)}
          </Section>
        </>}
      </main>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return <Card className="p-4 bg-white border-0 shadow-sm"><Icon size={18} className="text-[#16834b]" /><p className="text-xs text-gray-500 mt-2">{label}</p><p className="text-lg font-black mt-1">{value}</p></Card>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <Card className="p-4 bg-white border-0 shadow-sm"><div className="flex items-center justify-between mb-3"><h2 className="font-black">{title}</h2><ChevronRight size={16} className="text-gray-400" /></div>{children}</Card>;
}
function Row({ title, meta, value }: { title: string; meta?: string; value?: string }) {
  return <div className="flex items-center gap-3 py-3 border-b last:border-0"><div className="min-w-0 flex-1"><p className="font-bold truncate">{title}</p>{meta && <p className="text-xs text-gray-500 truncate">{meta}</p>}</div>{value && <p className="font-black whitespace-nowrap">{value}</p>}</div>;
}
function Mini({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">{label}</p><p className="font-black text-lg mt-1">{value}</p></div>; }
function Empty() { return <p className="py-6 text-center text-sm text-gray-500">No records yet.</p>; }
