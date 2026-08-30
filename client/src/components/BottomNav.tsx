import { Home, MoreHorizontal, PieChart, Wallet, UsersRound } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export default function BottomNav() {
  const [location, navigate] = useLocation();
  const { t } = useLanguage();
  const items = [
    { path: '/', label: t('home' as any), icon: Home, active: location === '/' },
    { path: '/trips', label: t('tripsNav' as any), icon: PieChart, active: location.startsWith('/trips') || location.startsWith('/trip/') },
    { path: '/shared-homes', label: t('sharedNav' as any), icon: UsersRound, active: location.startsWith('/shared-homes') || location.startsWith('/shared-home') },
    { path: '/personal-budget', label: t('budget'), icon: Wallet, active: location.startsWith('/personal-budget') },
  ];

  return (
    <nav aria-label="Primary navigation" className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5 gap-1 border-t border-[#d7e4dc] bg-[#fffdf8]/96 px-2 pt-2 shadow-[0_-10px_28px_rgba(24,50,75,0.10)] backdrop-blur safe-area-inset-bottom">
      {items.map(item => <Button key={item.path} variant={item.active ? 'default' : 'ghost'} size="sm" aria-current={item.active ? 'page' : undefined} className={`min-h-12 rounded-xl font-bold transition-all ${item.active ? 'bg-[#16834b] text-white shadow-[0_4px_12px_rgba(22,131,75,0.22)]' : 'bg-transparent text-kharcha-navy hover:bg-[#f2fbf3]'}`} onClick={() => navigate(item.path)} aria-label={item.label}><span className="flex min-w-0 flex-col items-center gap-0.5"><item.icon size={18} /><span className="max-w-full truncate text-[9px] leading-none sm:text-[10px]">{item.label}</span></span></Button>)}
      <Button variant={location.startsWith('/more') ? 'default' : 'ghost'} size="sm" aria-current={location.startsWith('/more') ? 'page' : undefined} className={`min-h-12 rounded-xl font-bold transition-all ${location.startsWith('/more') ? 'bg-[#16834b] text-white shadow-[0_4px_12px_rgba(22,131,75,0.22)]' : 'bg-transparent text-kharcha-navy hover:bg-[#fffaf3]'}`} onClick={() => navigate('/more')} aria-label={t('more' as any)}><span className="flex min-w-0 flex-col items-center gap-0.5"><MoreHorizontal size={18} /><span className="max-w-full truncate text-[9px] leading-none sm:text-[10px]">{t('more' as any)}</span></span></Button>
    </nav>
  );
}
