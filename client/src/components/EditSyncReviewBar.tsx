import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { getOrCreateOwnerKey, type SyncContextType } from '@/lib/editSync';

interface Props { contextType: SyncContextType; contextId: string; }

export default function EditSyncReviewBar(props: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <EditSyncReviewBarMounted {...props} />;
}

function EditSyncReviewBarMounted({ contextType, contextId }: Props) {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const ownerKey = useMemo(() => getOrCreateOwnerKey(contextType, contextId), [contextType, contextId]);
  const pending = trpc.sync.getPendingForContext.useQuery({ contextType, contextId, ownerKey }, { staleTime: 15_000, refetchInterval: 20_000 });
  if (!pending.data?.length) return null;
  return <Card className="mb-4 border-2 border-[#e87817] bg-[#fff8ed] p-4 text-kharcha-navy shadow-sm"><div className="flex items-start gap-3"><ClipboardCheck size={21} className="mt-0.5 shrink-0 text-[#e87817]" /><div className="min-w-0 flex-1"><p className="font-black">{t('editSyncReviewChanges' as any)}</p><p className="mt-1 text-sm font-semibold text-gray-700">{pending.data.length} {t('editSyncPending' as any)}</p><div className="mt-3 space-y-2">{pending.data.slice(0, 3).map(item => item.packageToken ? <Button key={item.packageToken} type="button" variant="outline" onClick={() => navigate(`/sync-review/${item.packageToken}`)} className="flex w-full items-center justify-between border-[#e87817] bg-white text-left text-kharcha-navy hover:bg-[#fff3e3]"><span className="min-w-0 truncate"><span className="block font-black">{item.contextName}</span><span className="block text-xs text-gray-600">{item.recipientName || t('editSyncRecipientUnknown' as any)} · {new Date(item.createdAt).toLocaleString()}</span></span><ChevronRight size={16} className="shrink-0" /></Button> : null)}</div></div></div></Card>;
}
