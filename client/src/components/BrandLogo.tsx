import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const KHARCHA_ASSET_PREFIX = typeof window !== 'undefined' && window.location.hostname === 'appassets.androidplatform.net' ? '/assets/web' : '';\nexport const KHARCHA_LOGO_MOBILE_LOCKUP = `${KHARCHA_ASSET_PREFIX}/icons/kharcha-logo-mobile.webp`;
export const KHARCHA_TRANSPARENT_LOGO = KHARCHA_LOGO_MOBILE_LOCKUP;
export const KHARCHA_LOGO_LOCKUP = KHARCHA_LOGO_MOBILE_LOCKUP;
export const KHARCHA_LOGO_MARK = `${KHARCHA_ASSET_PREFIX}/icons/kharcha-logo-mark.png`;
export const KHARCHA_LANDING_LOGO = `${KHARCHA_ASSET_PREFIX}/icons/kharcha-logo-landing.png`;

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
