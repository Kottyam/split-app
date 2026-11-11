import { useEffect, useState } from 'react';
import { ArrowRight, Bell, Landmark, Plane, Search, Settings } from 'lucide-react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';

import AppSettingsDialog from '@/components/AppSettingsDialogExtended';
import BrandLogo from '@/components/BrandLogo';
import BottomNavigation from '@/components/BottomNavigation';
import HelpGuideModal from '@/components/HelpGuideModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { appCategories } from '@/lib/appNavigation';
import { getUnreadNotificationCount, subscribeToNotifications } from '@/lib/notifications';
import { refreshAutomaticNotifications } from '@/lib/notificationEngine';

export default function Home() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [notificationCount, setNotificationCount] = useState(() => getUnreadNotificationCount());

  useEffect(() => {
    refreshAutomaticNotifications();
    setNotificationCount(getUnreadNotificationCount());
    const unsubscribe = subscribeToNotifications(() => setNotificationCount(getUnreadNotificationCount()));
    return unsubscribe;
  }, []);

  useEffect(() => {
    const seen = localStorage.getItem('hasSeenHelpGuide');
    if (!seen) setShowHelpGuide(true);
  }, []);

  const handleDismissHelpGuide = (open: boolean) => {
    setShowHelpGuide(open);
    if (!open) localStorage.setItem('hasSeenHelpGuide', 'true');
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-kharcha-cream px-3 pb-24 pt-3 sm:px-6 sm:pt-5">
      <HelpGuideModal open={showHelpGuide} onOpenChange={handleDismissHelpGuide} showLanguageSelector />
      <header className="relative z-10 mx-auto flex max-w-4xl items-center justify-between gap-2 rounded-2xl border border-[#d7e4dc] bg-white/95 px-3 py-2.5 shadow-[0_8px_24px_rgba(24,50,75,0.08)] backdrop-blur supports-[backdrop-filter]:backdrop-blur sm:gap-3 sm:rounded-3xl sm:px-4">
        <div className="min-w-0 flex-1"><BrandLogo variant="landing" imageClassName="mix-blend-multiply" className="w-52 max-w-full sm:w-64" /></div>
        <div className="flex shrink-0 items-start gap-0.5 sm:gap-2">
          <HeaderAction label={t('search' as any)} ariaLabel={t('search' as any)} onClick={() => navigate('/search')}><Search size={18} /></HeaderAction>
          <HeaderAction label={t('notifications' as any)} ariaLabel={t('notifications' as any)} onClick={() => navigate('/notifications')} badge={notificationCount > 0 ? String(notificationCount) : undefined}><Bell size={18} /></HeaderAction>
          <HeaderAction label={t('settings')} ariaLabel={t('settings')} onClick={() => setShowSettings(true)}><Settings size={18} /></HeaderAction>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-4xl py-6 sm:py-10">
        <section className="relative mb-6 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#023b81] via-[#0a4f96] to-[#038f27] px-5 py-6 text-white shadow-[0_18px_40px_rgba(2,59,129,0.25)] sm:mb-8 sm:px-8 sm:py-8">
          <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#fd6d00]/30 blur-2xl" />
          <span aria-hidden className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/10 blur-xl" />
          <p className="relative text-xs font-bold uppercase tracking-[0.18em] text-white/75">{t('homeWelcome' as any)}</p>
          <h1 className="relative mt-2 text-[1.7rem] font-black leading-tight sm:text-4xl">{t('whatManage')}</h1>
          <p className="relative mt-2 text-sm font-medium text-white/85">{t('chooseCategory' as any)}</p>
        </section>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          <CategoryCard icon={<Plane size={30} />} title={t('myTrips')} description={t('tripsDescription')} action={t('openTrips')} accent="orange" onClick={() => navigate(appCategories.trips.path)} />
          <CategoryCard icon={<Landmark size={30} />} title={t('groupFunds')} description={t('groupFundsDescription')} action={t('openFunds')} accent="green" onClick={() => navigate(appCategories.groupFunds.path)} />
        </div>
      </main>
      <AppSettingsDialog open={showSettings} onOpenChange={setShowSettings} />
      <BottomNavigation />
    </div>
  );
}

function HeaderAction({ children, label, ariaLabel, onClick, badge }: { children: React.ReactNode; label: string; ariaLabel: string; onClick: () => void; badge?: string }) {
  return <div className="flex w-12 flex-col items-center gap-1 sm:w-14"><button type="button" aria-label={ariaLabel} onClick={onClick} className="relative grid h-9 w-9 place-items-center rounded-full border border-[#d7e4dc] bg-white text-kharcha-navy shadow-sm transition-all hover:border-[#16834b] hover:bg-[#f2fbf3] sm:h-10 sm:w-10">{children}{badge !== undefined && <span aria-label={`${badge} ${label}`} className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#e87817] px-1 text-[9px] font-black leading-none text-white">{badge}</span>}</button><span className="max-w-full truncate text-[9px] font-bold leading-none text-[#65747f] sm:text-[10px]">{label}</span></div>;
}

function CategoryCard({ icon, title, description, action, accent, onClick }: { icon: React.ReactNode; title: string; description: string; action: string; accent: 'orange' | 'green'; onClick: () => void }) {
  const color = accent === 'orange' ? '#fd6d00' : '#038f27';
  const tint = accent === 'orange' ? 'var(--kharcha-tint-orange, #fff1e5)' : 'var(--kharcha-tint-green, #e6f6ea)';
  return (
    <Card role="button" tabIndex={0} data-testid={`home-card-${accent}`} onClick={onClick} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') onClick(); }}
      className="group relative min-h-[150px] cursor-pointer overflow-hidden rounded-[26px] border border-[#e3ebf3] bg-white p-5 shadow-[0_10px_28px_rgba(2,59,129,0.10)] transition-all hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(2,59,129,0.16)] active:scale-[0.99] sm:p-6">
      <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: color }} />
      <span aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full" style={{ background: tint }} />
      <div className="relative flex items-center gap-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-white shadow-md" style={{ background: color }}>{icon}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-black text-[#023b81] sm:text-2xl">{title}</h2>
          <p className="mt-1 text-sm leading-5 text-[#5b6b78]">{description}</p>
        </div>
      </div>
      <span className="relative mt-5 flex items-center justify-between rounded-2xl px-4 py-2.5 text-sm font-black" style={{ background: tint, color }}>
        {action}<span className="grid h-7 w-7 place-items-center rounded-full text-white transition-transform group-hover:translate-x-1" style={{ background: color }}><ArrowRight size={16} /></span>
      </span>
    </Card>
  );
}
