import { useState } from 'react';
import { Check, Copy, FileDown, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { fitsInLink, MAX_LINK_LENGTH } from './serverlessSync';
import { useLanguage } from '@/contexts/LanguageContext';
import { copyToClipboard, shareKharchaFile, shareLink } from './shareOut';

interface Props { url: string; fileContents: string; fileName: string; title: string; message: string; testIdPrefix: string }

/** Share/copy a sync link; when it is too long for chat apps, share a .kharcha file instead. */
export default function LinkOrFileActions({ url, fileContents, fileName, title, message, testIdPrefix }: Props) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const short = fitsInLink(url);
  const copy = async () => { if (await copyToClipboard(url)) { setCopied(true); toast.success(t('syncLinkCopied' as any)); window.setTimeout(() => setCopied(false), 1800); } else toast.error(t('syncCouldNotCopy' as any)); };
  const share = async () => { if (!(await shareLink(title, message, url))) await copy(); };
  const file = async () => {
    const result = await shareKharchaFile(fileName, fileContents, title);
    if (result === 'downloaded') toast.success(t('syncFileSaved' as any));
    else if (result === 'failed') toast.error(t('syncFileFailed' as any));
  };
  return <div className="space-y-2">
    {!short && <p data-testid={`${testIdPrefix}-too-long`} className="rounded-lg bg-amber-50 p-2 text-xs font-semibold text-amber-900">{t('syncLinkTooLong' as any, { length: url.length, max: MAX_LINK_LENGTH })}</p>}
    <div className="grid gap-2 sm:grid-cols-3">
      {short && <Button data-testid={`${testIdPrefix}-share`} onClick={share} className="bg-[#16834b] text-white hover:bg-[#11663b]"><Share2 className="mr-2" size={16} />{t('syncShareLink' as any)}</Button>}
      <Button data-testid={`${testIdPrefix}-copy`} variant={short ? 'default' : 'outline'} onClick={copy} className={short ? 'bg-kharcha-navy text-white' : ''}>{copied ? <Check className="mr-2" size={16} /> : <Copy className="mr-2" size={16} />}{short ? t('syncCopyLink' as any) : t('syncCopyLongLink' as any)}</Button>
      <Button data-testid={`${testIdPrefix}-file`} variant={short ? 'outline' : 'default'} onClick={file} className={short ? '' : 'bg-[#16834b] text-white hover:bg-[#11663b]'}><FileDown className="mr-2" size={16} />{t('syncShareFile' as any)}</Button>
    </div>
  </div>;
}
