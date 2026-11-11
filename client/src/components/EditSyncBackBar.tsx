import { useMemo, useState } from 'react';
import { Send, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { SyncContextType, SyncSnapshot } from '@/lib/editSync';
import { buildKharchaFile, diffSnapshots, randomId, updateLink, type Snapshot, type UpdatePackage } from '@/sync/serverlessSync';
import { getCopy } from '@/sync/syncStore';
import LinkOrFileActions from '@/sync/LinkOrFileActions';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props { contextType: SyncContextType; contextId: string; snapshot: SyncSnapshot }

/** On a recipient's editable copy: shows the badge and builds the "send changes" update link. */
export default function EditSyncBackBar({ contextId, snapshot }: Props) {
  const { t } = useLanguage();
  const copy = useMemo(() => getCopy(contextId), [contextId]);
  const [open, setOpen] = useState(false);
  const uid = useMemo(() => randomId(), [snapshot]);
  if (!copy) return null;
  let base: Snapshot; try { base = JSON.parse(copy.baseJson) as Snapshot; } catch { return null; }
  const current = { ...(snapshot as unknown as Snapshot), id: base.id };
  const ops = diffSnapshots(base, current);
  const pkg: UpdatePackage = { v: 1, t: copy.type, s: copy.sid, n: copy.ver, u: uid, m: copy.name, c: ops };
  const url = updateLink(pkg);
  return <Card data-testid="editable-copy-badge" className="mb-4 border-2 border-[#e87817] bg-[#fff8ed] p-4 text-kharcha-navy shadow-sm"><div className="flex items-start gap-3"><Users size={20} className="mt-0.5 shrink-0 text-[#e87817]" /><div className="min-w-0 flex-1">
    <p className="font-black">{copy.from ? t('syncEditableCopyFrom' as any, { name: copy.from }) : t('syncEditableCopy' as any)}</p>
    <p className="mt-1 text-sm font-semibold text-gray-700">{ops.length === 0 ? t('syncNoChangesYet' as any) : t('syncPendingChanges' as any, { count: ops.length })}</p>
    {ops.length > 0 && !open && <Button data-testid="send-changes" type="button" onClick={() => setOpen(true)} className="mt-3 bg-[#16834b] text-white hover:bg-[#11683c]"><Send size={16} className="mr-2" />{t('syncSendToOwner' as any)}</Button>}
    {ops.length > 0 && open && <div className="mt-3"><LinkOrFileActions url={url} fileContents={buildKharchaFile('update', pkg)} fileName={`${copy.name}-changes`} title={t('syncChangesTitle' as any, { name: copy.name })} message={t('syncChangesMessage' as any, { count: ops.length, name: copy.name })} testIdPrefix="update-link" /></div>}
  </div></div></Card>;
}
