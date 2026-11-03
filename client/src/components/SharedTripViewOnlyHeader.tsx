import React from 'react';
import { Copy, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import AppSectionHeader from '@/components/AppSectionHeader';

interface SharedTripViewOnlyHeaderProps {
  tripName: string;
  onBack: () => void;
  onCopy: () => void | Promise<void>;
}

export default function SharedTripViewOnlyHeader({
  tripName,
  onBack,
  onCopy,
}: SharedTripViewOnlyHeaderProps) {
  const { t } = useLanguage();

  return <AppSectionHeader
    title={tripName}
    subtitle={t('auditReadOnlyView' as any)}
    icon={<Plane size={26} />}
    accent="orange"
    onBack={onBack}
    backLabel={t('auditBackToKharcha' as any)}
    actions={<Button variant="soft" onClick={onCopy} className="w-full min-h-11"><Copy size={16} className="mr-2" />{t('copyLink')}</Button>}
  />;
}
