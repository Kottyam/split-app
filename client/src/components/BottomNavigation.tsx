import React from 'react';
import { Home as HomeIcon, MoreHorizontal, Plane, WalletCards } from 'lucide-react';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const items = [
  { key: 'home', path: '/', icon: HomeIcon },
  { key: 'trips', path: '/trips', icon: Plane },
  { key: 'shared', path: '/shared-homes', icon: HomeIcon },
  { key: 'budget', path: '/personal-budget', icon: WalletCards },
  { key: 'more', path: '/more', icon: MoreHorizontal },
] as const;

export default function BottomNavigation() {
  const [location, navigate] = useLocation();
  const { t } = useLanguage();

  const isActive = (path: string) => {
    if (path === '/') return location === '/';
    return location === path || location.startsWith(`${path}/`);
  };

  const labels: Record<(typeof items)[number]['key'], string> = {
    home: t('home' as any),
    trips: t('tripsNav' as any),
    shared: t('sharedNav' as any),
    budget: t('budget' as any),
    more: t('more' as any),
  };

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-50 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto flex max-w-md items-center justify-between rounded-2xl border border-[#d7e4dc] bg-white/95 p-1.5 shadow-[0_-6px_24px_rgba(24,50,75,0.10)] backdrop-blur">
        {items.map(({ key, path, icon: Icon }) => {
          const active = isActive(path);
          return (
            <button
              key={key}
              type="button"
              onClick={() => navigate(path)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-black transition-colors',
                active
                  ? 'bg-[#f2fbf3] text-[#16834b]'
                  : 'text-[#65747f] hover:bg-[#f7faf8] hover:text-kharcha-navy',
              )}
            >
              <Icon size={19} strokeWidth={active ? 2.5 : 2} />
              <span className="max-w-full truncate leading-tight">{labels[key]}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
