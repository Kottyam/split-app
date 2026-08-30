import { useEffect, useState } from 'react';
import { ArrowRight, Bell, BarChart3, Home as HomeIcon, Plane, Search, Settings, WalletCards } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import AppSettingsDialog from '@/components/AppSettingsDialogExtended';
import BrandLogo from '@/components/BrandLogo';
import HelpGuideModal from '@/components/HelpGuideModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { appCategories } from '@/lib/appNavigation';
import { getUnreadNotificationCount, subscribeToNotifications } from '@/lib/notifications';

export default function Home() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [notificationCount, setNotificationCount] = useState(() => getUnreadNotificationCount());

  useEffect(() => {
    const unsubscribe = subscribeToNotifications(() => setNotificationCount(getUnreadNotificationCount()));
    return unsubscribe;
  }, []);

  useEffect(() => {
    const seen = localStorage.getItem('hasSeenHelpGuide');
    if (!seen) {
      setShowHelpGuide(true);
    }
  }, []);

  const handleDismissHelpGuide = (open: boolean) => {
    setShowHelpGuide(open);
    if (!open) localStorage.setItem('hasSeenHelpGuide', 'true');
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-kharcha-cream px-3 pb-4 pt-3 sm:px-6 sm:pt-5">
      <HelpGuideModal open={showHelpGuide} onOpenChange={handleDismissHelpGuide} showLanguageSelector />

      <header className="relative z-10 mx-auto flex max-w-4xl items-center justify-between gap-2 rounded-2xl border border-[#d7e4dc] bg-white/95 px-3 py-2.5 shadow-[0_8px_24px_rgba(24,50,75,0.08)] backdrop-blur supports-[backdrop-filter]:backdrop-blur sm:gap-3 sm:rounded-3xl sm:px-4">
        <div className="min-w-0 flex-1"><BrandLogo variant="landing" imageClassName="mix-blend-multiply" className="w-40 sm:w-52" /></div>
        <div className="flex shrink-0 items-start gap-0.5 sm:gap-2">
          <HeaderAction label={t('search' as any)} ariaLabel={t('search' as any)} onClick={() => navigate('/search')}><Search size={18} /></HeaderAction>
          <HeaderAction label={t('notifications' as any)} ariaLabel={t('notifications' as any)} onClick={() => navigate('/notifications')} badge={notificationCount > 0 ? String(notificationCount) : undefined}><Bell size={18} /></HeaderAction>
          <HeaderAction label={t('settings')} ariaLabel={t('settings')} onClick={() => setShowSettings(true)}><Settings size={18} /></HeaderAction>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl py-6 sm:py-10">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="text-3xl font-black text-kharcha-navy sm:text-4xl">{t('whatManage')}</h1>
          <p className="mt-2 text-sm font-medium text-[#65747f]">{t('chooseCategory' as any)}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          <CategoryCard icon={<Plane size={30} />} title={t('myTrips')} description={t('tripsDescription')} action={t('openTrips')} accent="orange" onClick={() => navigate(appCategories.trips.path)} />
          <CategoryCard icon={<HomeIcon size={30} />} title={t('mySharedHomes')} description={t('sharedHomesDescription')} action={t('openSharedHomes')} accent="green" onClick={() => navigate(appCategories.sharedHomes.path)} />
          <CategoryCard icon={<WalletCards size={30} />} title={t('groupFunds')} description={t('groupFundsDescription')} action={t('openFunds')} accent="orange" onClick={() => navigate(appCategories.groupFunds.path)} />
          <CategoryCard icon={<BarChart3 size={30} />} title={t('personalBudget')} description={t('personalBudgetDescription')} action={t('personalBudgetOverview')} accent="green" onClick={() => navigate(appCategories.personalBudget.path)} />
        </div>
      </main>

      <AppSettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
}


function HeaderAction({ children, label, ariaLabel, onClick, badge }: { children: React.ReactNode; label: string; ariaLabel: string; onClick: () => void; badge?: string }) {
  return <div className="flex w-12 flex-col items-center gap-1 sm:w-14"><button type="button" aria-label={ariaLabel} onClick={onClick} className="relative grid h-9 w-9 place-items-center rounded-full border border-[#d7e4dc] bg-white text-kharcha-navy shadow-sm transition-all hover:border-[#16834b] hover:bg-[#f2fbf3] sm:h-10 sm:w-10">{children}{badge !== undefined && <span aria-label={`${badge} ${label}`} className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#e87817] px-1 text-[9px] font-black leading-none text-white">{badge}</span>}</button><span className="max-w-full truncate text-[9px] font-bold leading-none text-[#65747f] sm:text-[10px]">{label}</span></div>;
}

function CategoryCard({ icon, title, description, action, accent, onClick }: { icon: React.ReactNode; title: string; description: string; action: string; accent: 'orange' | 'green'; onClick: () => void }) {
  const styles = accent === 'orange' ? 'border-[#e87817] bg-[#fffaf3] hover:bg-[#fff3e3]' : 'border-[#16834b] bg-[#f2fbf3] hover:bg-[#e6f3e8]';
  const iconStyles = accent === 'orange' ? 'bg-[#ffe0bc] text-[#b95000]' : 'bg-[#b9ddc9] text-[#16834b]';
  return <Card role="button" tabIndex={0} onClick={onClick} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') onClick(); }} className={`cursor-pointer rounded-3xl border p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg sm:p-5 ${styles}`}><div className="flex items-start gap-3"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl ${iconStyles}`}>{icon}</span><div className="min-w-0 flex-1"><h2 className="text-lg font-black text-kharcha-navy sm:text-xl">{title}</h2><p className="mt-1.5 text-sm leading-5 text-gray-600">{description}</p><span className="mt-4 inline-flex items-center text-sm font-black text-kharcha-navy">{action}<ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" /></span></div></div></Card>;
}
