import { useState } from 'react';
import { Check, Copy, FileDown, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { fitsInLink, MAX_LINK_LENGTH } from './serverlessSync';
import { copyToClipboard, shareKharchaFile, shareLink } from './shareOut';

interface Props { url: string; fileContents: string; fileName: string; title: string; message: string; testIdPrefix: string }

/** Share/copy a sync link; when it is too long for chat apps, share a .kharcha file instead. */
export default function LinkOrFileActions({ url, fileContents, fileName, title, message, testIdPrefix }: Props) {
  const [copied, setCopied] = useState(false);
  const short = fitsInLink(url);
  const copy = async () => { if (await copyToClipboard(url)) { setCopied(true); toast.success('Link copied'); window.setTimeout(() => setCopied(false), 1800); } else toast.error('Could not copy the link'); };
  const share = async () => { if (!(await shareLink(title, message, url))) await copy(); };
  const file = async () => {
    const result = await shareKharchaFile(fileName, fileContents, title);
    if (result === 'downloaded') toast.success('Saved a .kharcha file. Send it from your Downloads.');
    else if (result === 'failed') toast.error('Could not create the file');
  };
  return <div className="space-y-2">
    {!short && <p data-testid={`${testIdPrefix}-too-long`} className="rounded-lg bg-amber-50 p-2 text-xs font-semibold text-amber-900">This link is long ({url.length} characters, chat apps handle about {MAX_LINK_LENGTH}). Send it as a .kharcha file instead; the other person opens it with “Import .kharcha file”.</p>}
    <div className="grid gap-2 sm:grid-cols-3">
      {short && <Button data-testid={`${testIdPrefix}-share`} onClick={share} className="bg-[#16834b] text-white hover:bg-[#11663b]"><Share2 className="mr-2" size={16} />Share link</Button>}
      <Button data-testid={`${testIdPrefix}-copy`} variant={short ? 'default' : 'outline'} onClick={copy} className={short ? 'bg-kharcha-navy text-white' : ''}>{copied ? <Check className="mr-2" size={16} /> : <Copy className="mr-2" size={16} />}{short ? 'Copy link' : 'Copy long link'}</Button>
      <Button data-testid={`${testIdPrefix}-file`} variant={short ? 'outline' : 'default'} onClick={file} className={short ? '' : 'bg-[#16834b] text-white hover:bg-[#11663b]'}><FileDown className="mr-2" size={16} />Share .kharcha file</Button>
    </div>
  </div>;
}
