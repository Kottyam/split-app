import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, CalendarDays, CheckCircle2, ChevronRight, Home as HomeIcon, Plus, Receipt, Settings, Users, Wallet } from 'lucide-react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import SharedHomeExpenseDialog from '@/components/SharedHomeExpenseDialog';
import SharedHomeMemberDialog from '@/components/SharedHomeMemberDialog';
import SharedHomeRecurringDialog from '@/components/SharedHomeRecurringDialog';
import SharedHomeRentDialog from '@/components/SharedHomeRentDialog';
import { getSharedHomeById, saveSharedHome } from '@/sharedHome/storage';
import { buildRentPeriod, upsertRentPeriod } from '@/sharedHome/rentPersistence';
import { materializeRecurringExpenses, calculateMonthlyBalances, generatePendingHouseholdSettlements, getExpenseTotals, monthKeyFromDate } from '@/sharedHome/calculations';
import type { HouseholdExpense, RecurringRule, RentConfig, SharedHome, SharedHomeMember } from '@/sharedHome/types';
import { nanoid } from 'nanoid';

type Tab = 'overview' | 'money' | 'recurring' | 'members' | 'reports';
const tabs: { id: Tab; key: any; icon: React.ElementType }[] = [
  { id: 'overview', key: 'sharedHomeOverview', icon: BarChart3 }, { id: 'money', key: 'sharedHomeExpenses', icon: Wallet },
  { id: 'recurring', key: 'sharedHomeRecurring', icon: CalendarDays }, { id: 'members', key: 'sharedHomeMembers', icon: Users }, { id: 'reports', key: 'sharedHomeReports', icon: BarChart3 },
];
const money = (value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function SharedHomeRedesign() {
  const [, params] = useRoute('/shared-home/:id'); const [, navigate] = useLocation(); const { t } = useLanguage();
  const [home, setHome] = useState<SharedHome | null>(null); const [tab, setTab] = useState<Tab>('overview');
  const [showExpense, setShowExpense] = useState(false); const [expenseKind, setExpenseKind] = useState<'expense'|'bill'|'grocery'>('expense');
  const [showMember, setShowMember] = useState(false); const [editingMember, setEditingMember] = useState<SharedHomeMember | undefined>();
  const [showRecurring, setShowRecurring] = useState(false); const [editingRecurring, setEditingRecurring] = useState<RecurringRule | undefined>();
  const [showRent, setShowRent] = useState(false); const monthKey = monthKeyFromDate(Date.now());

  useEffect(() => { if (!params?.id) return; const loaded = getSharedHomeById(params.id); if (!loaded) { setHome(null); return; } const result = materializeRecurringExpenses(loaded, monthKey); const next = result.added.length ? result.home : loaded; setHome(next); if (result.added.length) saveSharedHome(next); }, [params?.id, monthKey]);
  const refresh = (next: SharedHome) => { setHome(next); saveSharedHome(next); };
  const addActivity = (next: SharedHome, message: string) => ({ ...next, activity: [{ id: nanoid(), message, createdAt: Date.now() }, ...next.activity].slice(0, 100), updatedAt: Date.now() });
  const saveExpense = (expense: HouseholdExpense) => { if (!home) return; refresh(addActivity({ ...home, expenses: [...home.expenses, expense] }, `Added ${expense.name}`)); };
  const saveMember = (member: SharedHomeMember) => { if (!home) return; const exists = home.members.some(m => m.id === member.id); refresh(addActivity({ ...home, members: exists ? home.members.map(m => m.id === member.id ? member : m) : [...home.members, member] }, exists ? `Updated ${member.name}` : `Added ${member.name}`)); setEditingMember(undefined); };
  const saveMembers = (members: SharedHomeMember[]) => { if (!home) return; const ids = new Set(members.map(m => m.id)); refresh(addActivity({ ...home, members: [...home.members.filter(m => !ids.has(m.id)), ...members] }, `Added ${members.length} member(s)`)); };
  const saveRecurring = (rule: RecurringRule) => { if (!home) return; const exists = home.recurringRules.some(r => r.id === rule.id); const next = { ...home, recurringRules: exists ? home.recurringRules.map(r => r.id === rule.id ? rule : r) : [...home.recurringRules, rule] }; refresh(addActivity(next, `${exists ? 'Updated' : 'Added'} recurring ${rule.name}`)); setEditingRecurring(undefined); };
  const saveRent = (config: RentConfig, allocations: Record<string, number>, calculation: any, adjustment?: any) => { if (!home) return; const previous = home.rentPeriods.find(p => p.monthKey === monthKey); const period = buildRentPeriod({ previous, monthKey, config, allocations, calculation, adjustment, now: Date.now() }); refresh(addActivity({ ...home, rentConfig: config, rentPeriods: upsertRentPeriod(home.rentPeriods, period) }, 'Updated rent')); };

  const stats = useMemo(() => {
    if (!home) return { expenses: 0, paid: 0, pending: 0, members: 0, balances: [], settlements: [] as Array<{fromMemberId:string;toMemberId:string;amount:number}> };
    const rent = home.rentPeriods.find(r => r.monthKey === monthKey);
    const expenses = getExpenseTotals(home, monthKey).total + (rent?.totalRent ?? 0);
    const balances = calculateMonthlyBalances(home, monthKey, rent);
    const settlements = generatePendingHouseholdSettlements(balances, home.settlements);
    const paid = balances.reduce((sum, b) => sum + b.paid, 0);
    const pending = settlements.reduce((sum, s) => sum + s.amount, 0);
    return { expenses, paid, pending, members: home.members.filter(m => m.isActive).length, balances, settlements };
  }, [home, monthKey]);

  if (!home) return <div className="min-h-screen p-6 flex items-center justify-center text-sm font-semibold">Shared home not found.</div>;
  const memberName = (id: string) => home.members.find(m => m.id === id)?.name ?? 'Member';

  return <div className="min-h-screen bg-[#f7f8f6] pb-24"><header className="sticky top-0 z-20 bg-white border-b border-gray-200"><div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3"><Button variant="ghost" size="icon" onClick={() => navigate('/shared-homes')}><ArrowLeft size={20}/></Button><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><HomeIcon size={18}/><h1 className="font-black truncate">{home.name}</h1></div><p className="text-xs text-gray-500 truncate">{home.address || home.homeType}</p></div><Button variant="outline" size="sm" className="gap-2" onClick={() => navigate(`/shared-home/${home.id}/manage`)}><Settings size={16}/>Manage</Button></div><div className="max-w-5xl mx-auto px-3 overflow-x-auto"><div className="flex min-w-max gap-1 pb-1">{tabs.map(({id,key,icon:Icon}) => <button key={id} onClick={() => setTab(id)} className={`px-4 py-3 rounded-t-xl text-sm font-bold flex items-center gap-2 ${tab===id?'bg-[#16834b] text-white':'text-gray-600 hover:bg-gray-100'}`}><Icon size={16}/>{t(key)}</button>)}</div></div></header>
  <main className="max-w-5xl mx-auto p-4 space-y-4">
    {tab === 'overview' && <><div className="grid grid-cols-2 md:grid-cols-4 gap-3"><Stat label={t('sharedHomeExpenses')} value={money(stats.expenses)} icon={Receipt}/><Stat label={t('sharedHomeSettlements')} value={money(stats.paid)} icon={CheckCircle2}/><Stat label="Pending" value={money(stats.pending)} icon={Wallet}/><Stat label={t('sharedHomeMembers')} value={String(stats.members)} icon={Users}/></div><div className="grid grid-cols-2 md:grid-cols-4 gap-2"><Quick onClick={()=>{setExpenseKind('expense');setShowExpense(true)}} label={t('sharedHomeAddExpense')}/><Quick onClick={()=>{setExpenseKind('bill');setShowExpense(true)}} label={t('sharedHomeAddBill')}/><Quick onClick={()=>setShowRent(true)} label={t('sharedHomeRent')}/><Quick onClick={()=>setShowMember(true)} label={t('sharedHomeAddMember')}/></div><Section title={t('sharedHomeSettlements')}>{stats.settlements.length===0?<Empty/>:stats.settlements.map((s,i)=><Row key={`${s.fromMemberId}-${s.toMemberId}-${i}`} title={`${memberName(s.fromMemberId)} → ${memberName(s.toMemberId)}`} meta="Pending settlement" value={money(s.amount)}/>)}</Section></>}
    {tab === 'money' && <><div className="flex flex-wrap gap-2"><Button onClick={()=>{setExpenseKind('expense');setShowExpense(true)}}><Plus size={16}/> {t('sharedHomeAddExpense')}</Button><Button variant="outline" onClick={()=>{setExpenseKind('bill');setShowExpense(true)}}>{t('sharedHomeAddBill')}</Button><Button variant="outline" onClick={()=>{setExpenseKind('grocery');setShowExpense(true)}}>{t('sharedHomeAddGrocery')}</Button><Button variant="outline" onClick={()=>setShowRent(true)}>{t('sharedHomeRent')}</Button></div><Section title={t('sharedHomeExpenses')}>{home.expenses.length===0?<Empty/>:home.expenses.slice().sort((a,b)=>b.date-a.date).map(e=><Row key={e.id} title={e.name} meta={`${new Date(e.date).toLocaleDateString('en-IN')} · ${e.category}`} value={money(e.amount)}/>)}</Section><Section title={t('sharedHomeSettlements')}>{stats.settlements.length===0?<Empty/>:stats.settlements.map((s,i)=><Row key={`${s.fromMemberId}-${s.toMemberId}-${i}`} title={`${memberName(s.fromMemberId)} → ${memberName(s.toMemberId)}`} value={money(s.amount)}/>)}</Section></>}
    {tab === 'recurring' && <><Button onClick={()=>{setEditingRecurring(undefined);setShowRecurring(true)}}><Plus size={16}/> {t('sharedHomeAddRecurring')}</Button><Section title={t('sharedHomeRecurring')}>{home.recurringRules.length===0?<Empty/>:home.recurringRules.map(r=><div key={r.id} className="flex items-center gap-2"><div className="flex-1"><Row title={r.name} meta={`${r.frequency} · ${r.amountMode} · ${r.status} · ${r.paymentResponsibility === 'individual_shares' ? 'Individual payment' : `Paid by ${memberName(r.payerMemberId ?? '')}`}`} value={r.fixedAmount!=null?money(r.fixedAmount):'Variable'}/></div><Button variant="outline" size="sm" onClick={()=>{setEditingRecurring(r);setShowRecurring(true)}}>Edit</Button></div>)}</Section></>}
    {tab === 'members' && <><Button onClick={()=>{setEditingMember(undefined);setShowMember(true)}}><Plus size={16}/> {t('sharedHomeAddMember')}</Button><Section title={t('sharedHomeMembers')}>{home.members.length===0?<Empty/>:home.members.map(m=><div key={m.id} className="flex items-center gap-2"><div className="flex-1"><Row title={m.name} meta={`${m.mobileNumber || 'No phone'} · ${m.isActive ? 'Active' : 'Inactive'}`} value={m.upiId || ''}/></div><Button variant="outline" size="sm" onClick={()=>{setEditingMember(m);setShowMember(true)}}>Edit</Button></div>)}</Section><Section title="Current balances">{stats.balances.map(b=><Row key={b.memberId} title={memberName(b.memberId)} meta={`Paid ${money(b.paid)} · Share ${money(b.share)}`} value={b.balance >= 0 ? `+${money(b.balance)}` : `-${money(Math.abs(b.balance))}`}/>)}</Section></>}
    {tab === 'reports' && <><Section title={t('sharedHomeReports')}><div className="grid md:grid-cols-3 gap-3"><Mini label="Total expenses" value={money(stats.expenses)}/><Mini label="Recorded payments" value={money(stats.paid)}/><Mini label="Pending settlement" value={money(stats.pending)}/></div></Section><Section title="Monthly activity">{Object.values(home.months).length===0?<Empty/>:Object.values(home.months).slice().sort((a,b)=>b.monthKey.localeCompare(a.monthKey)).map(m=><Row key={m.monthKey} title={m.monthKey} meta={`${m.balances.length} balances`} value={money(m.totalExpenses)}/>)}</Section></>}
  </main><SharedHomeExpenseDialog open={showExpense} kind={expenseKind} home={home} onOpenChange={setShowExpense} onSave={saveExpense}/><SharedHomeMemberDialog open={showMember} initial={editingMember} onOpenChange={setShowMember} onSave={saveMember} onSaveMultiple={saveMembers}/><SharedHomeRecurringDialog open={showRecurring} home={home} initial={editingRecurring} onOpenChange={setShowRecurring} onSave={saveRecurring}/><SharedHomeRentDialog open={showRent} home={home} monthKey={monthKey} onOpenChange={setShowRent} onSave={saveRent}/></div>;
}
function Stat({label,value,icon:Icon}:{label:string;value:string;icon:React.ElementType}){return <Card className="p-4 bg-white border-0 shadow-sm"><Icon size={18} className="text-[#16834b]"/><p className="text-xs text-gray-500 mt-2">{label}</p><p className="text-lg font-black mt-1">{value}</p></Card>}
function Quick({label,onClick}:{label:string;onClick:()=>void}){return <Button variant="outline" className="h-auto min-h-11 py-3 font-bold" onClick={onClick}>{label}</Button>}
function Section({title,children}:{title:string;children:React.ReactNode}){return <Card className="p-4 bg-white border-0 shadow-sm"><div className="flex items-center justify-between mb-3"><h2 className="font-black">{title}</h2><ChevronRight size={16} className="text-gray-400"/></div>{children}</Card>}
function Row({title,meta,value}:{title:string;meta?:string;value?:string}){return <div className="flex items-center gap-3 py-3 border-b last:border-0"><div className="min-w-0 flex-1"><p className="font-bold truncate">{title}</p>{meta&&<p className="text-xs text-gray-500 truncate">{meta}</p>}</div>{value&&<p className="font-black whitespace-nowrap">{value}</p>}</div>}
function Mini({label,value}:{label:string;value:string}){return <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">{label}</p><p className="font-black text-lg mt-1">{value}</p></div>}
function Empty(){return <p className="py-6 text-center text-sm text-gray-500">No records yet.</p>}
