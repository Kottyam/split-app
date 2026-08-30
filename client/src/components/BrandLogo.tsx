import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export const KHARCHA_LOGO_MOBILE_LOCKUP = '/manus-storage/kharcha-logo-mobile_25195552.png';
export const KHARCHA_TRANSPARENT_LOGO = KHARCHA_LOGO_MOBILE_LOCKUP;
export const KHARCHA_LOGO_LOCKUP = KHARCHA_LOGO_MOBILE_LOCKUP;
export const KHARCHA_LOGO_MARK = '/manus-storage/kharcha-logo-transparent_b8cc8f74.png';
export const KHARCHA_LANDING_LOGO = '/manus-storage/kharcha-landing-logo-reference_aaebb992.png';

interface Props {
  variant?: 'lockup' | 'mark' | 'landing';
  className?: string;
  imageClassName?: string;
}

export default function BrandLogo({ variant = 'lockup', className = '', imageClassName = '' }: Props) {
  const { t } = useLanguage();
  const logoSource = variant === 'mark' ? KHARCHA_LOGO_MARK : variant === 'landing' ? KHARCHA_LANDING_LOGO : KHARCHA_LOGO_LOCKUP;
  const isLandingLogo = variant === 'landing';
  return <div className={className}><img src={logoSource} alt={t('brandLogoAlt' as any)} loading={isLandingLogo ? 'eager' : undefined} fetchPriority={isLandingLogo ? 'high' : undefined} decoding={isLandingLogo ? 'sync' : undefined} className={`block h-auto w-full object-contain ${imageClassName}`} /></div>;
}
