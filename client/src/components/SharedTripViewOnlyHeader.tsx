import React from 'react';
import { Copy } from 'lucide-react';
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
    onBack={onBack}
    backLabel={t('auditBackToKharcha' as any)}
    actions={<Button variant="outline" onClick={onCopy} className="w-full rounded-xl border border-[#d7e4dc] bg-white font-bold text-kharcha-navy shadow-sm"><Copy size={16} className="mr-2" />{t('copyLink')}</Button>}
  />;
}
