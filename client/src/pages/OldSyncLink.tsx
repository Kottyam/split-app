import { Card } from '@/components/ui/card';
import { Link } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';

/** Old server-based /edit-sync and /sync-review links no longer work. */
export default function OldSyncLink() {
  const { t } = useLanguage();
  return <main className="mx-auto max-w-xl p-4"><Card data-testid="old-sync-link" className="p-5"><h1 className="text-xl font-black text-kharcha-navy">{t('syncOldLinkTitle' as any)}</h1><p className="mt-2 text-sm text-gray-700">{t('syncOldLinkBody' as any)}</p><Link href="/" className="mt-4 inline-block font-bold text-[#16834b]">{t('syncGoHome' as any)}</Link></Card></main>;
}
