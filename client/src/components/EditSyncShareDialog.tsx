import { useState } from 'react';
import { Copy, Link2, Share2, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { copyToClipboard, shareLink } from '@/lib/shareLink';
import { getOrCreateOwnerKey, serializeSnapshot, type SyncContextType, type SyncSnapshot } from '@/lib/editSync';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contextType: SyncContextType;
  contextId: string;
  contextName: string;
  snapshot: SyncSnapshot;
}

export default function EditSyncShareDialog(props: Props) {
  const { t } = useLanguage();
  if (!props.open) return null;
  return <EditSyncShareDialogOpen {...props} t={t} />;
}

function EditSyncShareDialogOpen({ open, onOpenChange, contextType, contextId, contextName, snapshot, t }: Props & { t: (key: any, variables?: any) => string }) {
  const createShare = trpc.sync.createShare.useMutation();
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const createLink = async () => {
    const ownerKey = getOrCreateOwnerKey(contextType, contextId);
    const result = await createShare.mutateAsync({ contextType, contextId, contextName, snapshotJson: serializeSnapshot(snapshot), ownerKey, origin: window.location.origin });
    setShareUrl(result.url);
    return result.url;
  };

  const handleShare = async () => {
    try {
      const url = shareUrl || await createLink();
      const shared = await shareLink(t('editAndSyncTitle' as any), t('editSyncShareMessage' as any, { name: contextName }), url);
      if (shared) toast.success(t('editSyncLinkShared' as any));
    } catch { toast.error(t('editSyncUnavailable' as any)); }
  };

  const handleCopy = async () => {
    try {
      const url = shareUrl || await createLink();
      if (await copyToClipboard(url)) {
        setCopied(true);
        toast.success(t('editSyncLinkCopied' as any));
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch { toast.error(t('editSyncUnavailable' as any)); }
  };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{t('editAndSyncTitle' as any)}</DialogTitle><DialogDescription>{t('editAndSyncDescription' as any, { name: contextName })}</DialogDescription></DialogHeader><div className="space-y-3"><div className="rounded-xl border border-[#c7d8cc] bg-[#f2fbf3] p-3"><p className="text-xs font-black uppercase tracking-wide text-[#16834b]">{t('editSyncSelectedItem' as any)}</p><p className="mt-1 break-words text-lg font-black text-kharcha-navy">{contextName}</p><p className="mt-1 text-xs text-gray-600">{t('editSyncOwnerProtection' as any)}</p></div>{shareUrl && <div className="flex items-center gap-2 rounded-xl border bg-white p-2"><Link2 size={16} className="shrink-0 text-[#16834b]" /><span className="min-w-0 flex-1 text-xs font-semibold text-gray-600">{t('editAndSyncTitle' as any)}</span></div>}</div><DialogFooter className="grid gap-2 sm:grid-cols-3"><Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button><Button onClick={handleShare} disabled={createShare.isPending} className="bg-[#16834b] text-white hover:bg-[#11663b]"><Share2 className="mr-2" size={16} />{t('editAndSyncTitle' as any)}</Button><Button onClick={handleCopy} disabled={createShare.isPending} className="bg-kharcha-navy text-white"><Copy className="mr-2" size={16} />{copied ? <><Check className="mr-1" size={16} />{t('copied')}</> : t('copyLink')}</Button></DialogFooter></DialogContent></Dialog>;
}
