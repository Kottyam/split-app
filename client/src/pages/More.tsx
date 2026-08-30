import { Home as HomeIcon, Landmark, Settings, WalletCards, Plane, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppSettingsDialog from '@/components/AppSettingsDialogExtended';
import { useLanguage } from '@/contexts/LanguageContext';
import AppSectionHeader from '@/components/AppSectionHeader';

export default function More() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);
  const items = [
    { path: '/group-funds', label: t('groupFunds' as any), description: t('openFunds' as any), icon: Landmark, tone: 'text-[#e87817] bg-[#fff3e3]' },
    { path: '/trips', label: t('myTrips' as any), description: t('openTrips' as any), icon: Plane, tone: 'text-[#e87817] bg-[#fff3e3]' },
    { path: '/shared-homes', label: t('mySharedHomes' as any), description: t('openSharedHomes' as any), icon: HomeIcon, tone: 'text-[#16834b] bg-[#dff1e5]' },
    { path: '/personal-budget', label: t('personalBudget' as any), description: t('personalBudgetOverview' as any), icon: WalletCards, tone: 'text-[#16834b] bg-[#dff1e5]' },
  ];
  return <div className="min-h-screen bg-kharcha-cream px-3 pb-12 pt-4 sm:px-4 sm:pt-6"><div className="mx-auto max-w-3xl space-y-3"><AppSectionHeader
        title={t('moreTitle' as any)}
        onBack={() => navigate('/')}
        backLabel={t('backToKharcha' as any)}
        actions={<Button variant="outline" size="sm" onClick={() => setShowSettings(true)} className="w-full"><Settings size={18} className="mr-1.5" />{t('settings' as any)}</Button>}
      /><div className="grid gap-3 sm:grid-cols-2">{items.map(item => { const Icon = item.icon; return <Card key={item.path} role="button" tabIndex={0} onClick={() => navigate(item.path)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') navigate(item.path); }} className="cursor-pointer rounded-2xl border border-[#d7e4dc] bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><span className={`grid h-11 w-11 place-items-center rounded-xl ${item.tone}`}><Icon size={21} /></span><div className="min-w-0"><h2 className="truncate font-black text-kharcha-navy">{item.label}</h2><p className="mt-1 text-sm text-gray-600">{item.description}</p></div></div></Card>; })}<Card role="button" tabIndex={0} onClick={() => setShowSettings(true)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') setShowSettings(true); }} className="cursor-pointer rounded-2xl border border-[#d7e4dc] bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#eef4fb] text-kharcha-navy"><SlidersHorizontal size={21} /></span><div><h2 className="font-black text-kharcha-navy">{t('settings' as any)}</h2><p className="mt-1 text-sm text-gray-600">{t('openSettings' as any)}</p></div></div></Card></div><AppSettingsDialog open={showSettings} onOpenChange={setShowSettings} /></div></div>;
}
