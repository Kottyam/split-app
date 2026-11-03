import React, { type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import BrandLogo from '@/components/BrandLogo';
import { cn } from '@/lib/utils';

export type SectionAccent = 'orange' | 'green' | 'blue';

const ACCENT_GRADIENT: Record<SectionAccent, string> = {
  orange: 'from-[#fd6d00] via-[#f2850f] to-[#023b81]',
  green: 'from-[#038f27] via-[#0a7a3a] to-[#023b81]',
  blue: 'from-[#023b81] via-[#0a4f96] to-[#038f27]',
};

interface AppSectionHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  accent?: SectionAccent;
  onBack?: () => void;
  backLabel?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** Branded page header (UI only): logo bar + gradient title banner in the section's accent colour. */
export default function AppSectionHeader({
  title,
  subtitle,
  icon,
  accent = 'blue',
  onBack,
  backLabel,
  actions,
  children,
  className,
}: AppSectionHeaderProps) {
  const { t } = useLanguage();

  return (
    <header data-accent={accent} className={cn('kharcha-page-header sticky top-0 z-30 rounded-[26px] border border-[#e3ebf3] bg-white/95 p-3 shadow-[0_10px_28px_rgba(2,59,129,0.10)] backdrop-blur sm:p-4', className)}>
      <div className="relative flex min-h-9 items-center justify-center">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onBack}
            aria-label={backLabel ?? t('backToKharcha' as any)}
            className="absolute left-0 top-0 h-9 w-9 shrink-0 rounded-full border-[#d7e4dc] bg-white text-[#023b81] shadow-sm hover:bg-[#f2fbf3]"
          >
            <ArrowLeft size={18} />
          </Button>
        )}
        <BrandLogo variant="landing" className="w-32 sm:w-40" imageClassName="mix-blend-multiply" />
      </div>
      <div className={cn('relative mt-2 overflow-hidden rounded-[20px] bg-gradient-to-br px-4 py-3 text-white shadow-[0_10px_24px_rgba(2,59,129,0.20)]', ACCENT_GRADIENT[accent])}>
        <span aria-hidden className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/15 blur-xl" />
        <div className="relative flex min-w-0 items-center gap-3">
          {icon && <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/20 text-white ring-1 ring-white/30">{icon}</span>}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-black leading-tight sm:text-2xl">{title}</h1>
            {subtitle && <p className="mt-0.5 truncate text-xs font-semibold text-white/85">{subtitle}</p>}
          </div>
        </div>
      </div>
      {actions && <div className="mt-3 flex flex-col gap-2">{actions}</div>}
      {children && <div className="mt-3">{children}</div>}
    </header>
  );
}
