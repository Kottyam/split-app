import { useMemo, useState } from 'react';
import { CheckCircle2, Send, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { normalizeSnapshotContextId, summarizeChanges, type SyncContextType, type SyncSnapshot } from '@/lib/editSync';

interface EditSyncBackBarProps {
  contextType: SyncContextType;
  contextId: string;
  snapshot: SyncSnapshot;
}

type CopyMetadata = { shareToken?: string; baseSnapshotJson?: string; baseSnapshotHash?: string };

export default function EditSyncBackBar({ contextType, contextId, snapshot }: EditSyncBackBarProps) {
  const { t } = useLanguage();
  const metadata = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(`kharcha_edit_sync_copy:${contextType}:${contextId}`) || 'null') as CopyMetadata | null;
    } catch {
      return null;
    }
  }, [contextType, contextId]);
  if (!metadata?.shareToken || !metadata.baseSnapshotJson) return null;
  let base: SyncSnapshot;
  try {
    base = JSON.parse(metadata.baseSnapshotJson) as SyncSnapshot;
  } catch {
    return null;
  }
  const comparisonSnapshot = normalizeSnapshotContextId(snapshot, base.id);
  const summary = summarizeChanges(base, comparisonSnapshot);
  if (summary.total === 0) return null;
  return <EditSyncSubmitCard contextType={contextType} snapshot={comparisonSnapshot} base={base} metadata={metadata} summary={summary} t={t} />;
}

function EditSyncSubmitCard({ contextType, snapshot, base, metadata, summary, t }: { contextType: SyncContextType; snapshot: SyncSnapshot; base: SyncSnapshot; metadata: CopyMetadata; summary: ReturnType<typeof summarizeChanges>; t: (key: any, variables?: any) => string }) {
  const [sent, setSent] = useState(false);
  const [reviewUrl, setReviewUrl] = useState('');
  const submit = trpc.sync.submit.useMutation({
    onSuccess: (result) => {
      if (!result) {
        toast.error(t('editSyncUnavailable' as any));
        return;
      }
        setReviewUrl(result.url);
        setSent(true);
      toast.success(t('editSyncPending' as any));
    },
    onError: () => toast.error(t('editSyncUnavailable' as any)),
  });
  if (sent) {
    return <Card className="mb-4 border-2 border-[#16834b] bg-[#e9f7ed] p-4 text-kharcha-navy"><div className="flex items-center gap-2 font-black"><CheckCircle2 size={18} className="text-[#16834b]" /> {t('editSyncPending' as any)}</div><p className="mt-2 text-xs font-semibold text-gray-700">{t('editSyncReviewChanges' as any)}</p><p className="mt-1 rounded-lg bg-white p-2 text-xs font-semibold text-gray-600">{t('editAndSyncTitle' as any)}</p><Button type="button" onClick={() => navigator.clipboard?.writeText(reviewUrl)} className="mt-2 bg-[#16834b] text-white hover:bg-[#11683c]">{t('copyLink')}</Button></Card>;
  }
  return <Card className="mb-4 border-2 border-[#e87817] bg-[#fff8ed] p-4 text-kharcha-navy shadow-sm"><div className="flex items-start gap-3"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-[#16834b]" /><div className="min-w-0 flex-1"><p className="font-black">{t('editSyncRecipientDescription' as any)}</p><p className="mt-1 text-sm font-semibold text-gray-700">{summary.total} {t('editSyncReviewChanges' as any)}</p><Button type="button" disabled={submit.isPending} onClick={() => submit.mutate({ shareToken: metadata.shareToken!, baseSnapshotHash: metadata.baseSnapshotHash || 'missing-base-hash', editedSnapshotJson: JSON.stringify(snapshot), changeSummaryJson: JSON.stringify(summary), recipientName: t('editSyncRecipientUnknown' as any), origin: window.location.origin })} className="mt-3 bg-[#16834b] text-white hover:bg-[#11683c]"><Send size={16} className="mr-2" /> {submit.isPending ? t('sharing' as any) : t('editSyncSendBack' as any)}</Button></div></div></Card>;
}
