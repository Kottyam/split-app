import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Check, Copy, Share2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trip } from '@/types';
import { copyToClipboard, shareLink } from '@/lib/shareLink';
import { getOrCreateOwnerKey, serializeSnapshot } from '@/lib/editSync';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface ShareTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: Trip;
  /** Retained for caller compatibility; Step One intentionally keeps these out of this popup. */
  onEditSync?: () => void;
  onSyncUpdates?: () => void;
}

export default function ShareTripDialog(props: ShareTripDialogProps) {
  if (!props.open) return null;
  return <ShareTripDialogOpen {...props} />;
}

function ShareTripDialogOpen({ open, onOpenChange, trip }: ShareTripDialogProps) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const { t } = useLanguage();
  const createShare = trpc.sync.createShare.useMutation();

  const getEditableLink = async () => {
    if (shareUrl) return shareUrl;
    const result = await createShare.mutateAsync({
      contextType: 'trip',
      contextId: trip.id,
      contextName: trip.name,
      snapshotJson: serializeSnapshot(trip),
      ownerKey: getOrCreateOwnerKey('trip', trip.id),
      origin: window.location.origin,
    });
    setShareUrl(result.url);
    return result.url;
  };

  const handleCopyLink = async () => {
    try {
      const url = await getEditableLink();
      if (await copyToClipboard(url)) {
        setCopied(true);
        toast.success(t('linkCopied'));
        window.setTimeout(() => setCopied(false), 1800);
      } else toast.error(t('failedCopy'));
    } catch { toast.error(t('editSyncUnavailable' as any)); }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const url = await getEditableLink();
      const didShare = await shareLink(t('shareTrip'), t('shareByName'), url);
      if (didShare) { toast.success(t('tripShared')); onOpenChange(false); }
      else await handleCopyLink();
    } catch { toast.error(t('editSyncUnavailable' as any)); }
    finally { setSharing(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-2 border-black rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="font-black text-black text-xl">{t('shareTrip')}</DialogTitle>
          <DialogDescription className="text-gray-600">{t('shareByName')}</DialogDescription>
        </DialogHeader>
        <Card className="bg-white border-2 border-yellow-300 rounded-lg p-4">
          <p className="text-xs uppercase tracking-wide font-black text-orange-700">{t('tripToShare')}</p>
          <p className="font-black text-black text-xl mt-1 break-words">{trip.name}</p>
          <p className="text-xs text-gray-600 mt-2">{t('auditShareCounts' as any, { members: trip.members.length, expenses: trip.expenses.length })}</p>
        </Card>
        <DialogFooter className="grid gap-2 sm:grid-cols-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-2 border-black font-bold rounded-lg">{t('close')}</Button>
          <Button type="button" onClick={handleCopyLink} disabled={createShare.isPending} className="bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 min-w-0 whitespace-normal text-center"><>{copied ? <Check size={16} /> : <Copy size={16} />}</>{copied ? t('copied') : t('copyLink')}</Button>
          <Button type="button" onClick={handleShare} disabled={sharing || createShare.isPending} className="bg-kharcha-green text-white font-bold rounded-lg hover:brightness-95 flex items-center justify-center gap-2 min-w-0 whitespace-normal text-center"><Share2 size={16} />{sharing ? t('sharing') : t('shareTrip')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
