import React, { type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import BrandLogo from '@/components/BrandLogo';
import { cn } from '@/lib/utils';

interface AppSectionHeaderProps {
  title: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export default function AppSectionHeader({
  title,
  onBack,
  backLabel,
  actions,
  children,
  className,
}: AppSectionHeaderProps) {
  const { t } = useLanguage();

  return (
    <header className={cn('kharcha-page-header sticky top-0 z-30 rounded-3xl border border-[#d7e4dc] bg-white/95 p-3 shadow-sm sm:p-4', className)}>
      <div className="relative flex min-w-0 flex-col items-center text-center">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onBack}
            aria-label={backLabel ?? t('backToKharcha' as any)}
            className="absolute left-0 top-0 h-9 w-9 shrink-0 rounded-xl border-[#d1e5d7] bg-white text-kharcha-navy shadow-sm hover:bg-[#f2fbf3]"
          >
            <ArrowLeft size={18} />
          </Button>
        )}
        <BrandLogo variant="landing" className="w-32 sm:w-44" imageClassName="mix-blend-multiply" />
        <h1 className="mt-1 max-w-full truncate text-lg font-black text-kharcha-navy sm:text-xl">{title}</h1>
      </div>
      {actions && <div className="mt-3 flex flex-col gap-2">{actions}</div>}
      {children && <div className="mt-3">{children}</div>}
    </header>
  );
}
