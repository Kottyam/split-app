import { ArrowLeft, Search as SearchIcon, Plane, Home as HomeIcon, WalletCards, BarChart3 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllTrips } from '@/lib/storage';
import { getAllSharedHomes } from '@/sharedHome/storage';
import { getGroupFunds } from '@/groupFund/storage';
import AppSectionHeader from '@/components/AppSectionHeader';

export default function Search() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    const matches: Array<{ id: string; title: string; type: string; path: string; icon: typeof Plane; tone: string }> = [];
    getAllTrips().forEach(item => { if (`${item.name} ${item.description ?? ''}`.toLowerCase().includes(normalized)) matches.push({ id: item.id, title: item.name, type: t('myTrips' as any), path: `/trip/${item.id}`, icon: Plane, tone: 'text-[#e87817]' }); });
    getAllSharedHomes().forEach(item => { if (`${item.name} ${item.description ?? ''}`.toLowerCase().includes(normalized)) matches.push({ id: item.id, title: item.name, type: t('mySharedHomes' as any), path: `/shared-home/${item.id}`, icon: HomeIcon, tone: 'text-[#16834b]' }); });
    getGroupFunds().forEach(item => { if (`${item.name} ${item.description ?? ''}`.toLowerCase().includes(normalized)) matches.push({ id: item.id, title: item.name, type: t('groupFunds' as any), path: `/group-fund/${item.id}`, icon: WalletCards, tone: 'text-[#e87817]' }); });
    if (t('personalBudget' as any).toLowerCase().includes(normalized)) matches.push({ id: 'personal-budget', title: t('personalBudget' as any), type: t('budget' as any), path: '/personal-budget', icon: BarChart3, tone: 'text-[#16834b]' });
    return matches;
  }, [query, t]);

  return <div className="min-h-screen bg-kharcha-cream px-3 pb-12 pt-4 sm:px-4 sm:pt-6"><div className="mx-auto max-w-3xl space-y-3"><AppSectionHeader title={t('searchKharchaTitle' as any)} onBack={() => navigate('/')} backLabel={t('backToKharcha' as any)} /><div className="relative"><SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-kharcha-navy" size={18} /><Input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder={t('searchKharchaPlaceholder' as any)} className="pl-10" /></div>{!query.trim() ? <Card className="border-2 border-dashed border-[#16834b] bg-[#f2fbf3] p-8 text-center"><SearchIcon className="mx-auto mb-3 text-[#16834b]" size={30} /><p className="font-bold text-gray-600">{t('searchKharchaHint' as any)}</p></Card> : results.length === 0 ? <Card className="border-2 border-dashed border-[#e87817] bg-[#fffaf3] p-8 text-center"><p className="font-bold text-gray-600">{t('searchKharchaNoResults' as any)}</p></Card> : <div className="space-y-2">{results.map(result => { const Icon = result.icon; return <Card key={`${result.type}-${result.id}`} className="cursor-pointer rounded-2xl border border-[#d7e4dc] bg-white p-3 shadow-sm" onClick={() => navigate(result.path)}><div className="flex items-center gap-3"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef4fb] ${result.tone}`}><Icon size={20} /></span><div className="min-w-0"><p className="truncate font-black text-kharcha-navy">{result.title}</p><p className="text-xs font-bold text-gray-500">{result.type}</p></div></div></Card>; })}</div>}</div></div>;
}
