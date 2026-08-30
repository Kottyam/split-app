import { useMemo, useState } from 'react';
import { History, RotateCcw } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import AppSectionHeader from '@/components/AppSectionHeader';
import { getSyncHistory, markSyncHistoryUndone, parseSnapshot, serializeSnapshot, type SyncContextType, type SyncHistoryRecord, type SyncSnapshot } from '@/lib/editSync';
import { getAllTrips, saveTrip } from '@/lib/storage';
import { getAllSharedHomes, saveSharedHome } from '@/sharedHome/storage';
import { getGroupFunds, saveGroupFund } from '@/groupFund/storage';
import type { Trip } from '@/types';
import type { SharedHome } from '@/sharedHome/types';
import type { GroupFund } from '@/groupFund/types';
import { toast } from 'sonner';

function currentSnapshot(record: SyncHistoryRecord): SyncSnapshot | undefined {
  if (record.contextType === 'trip') return getAllTrips().find(item => item.id === record.contextId);
  if (record.contextType === 'shared_home') return getAllSharedHomes().find(item => item.id === record.contextId);
  return getGroupFunds().find(item => item.id === record.contextId);
}
function saveSnapshot(type: SyncContextType, snapshot: SyncSnapshot) {
  if (type === 'trip') saveTrip(snapshot as Trip);
  else if (type === 'shared_home') saveSharedHome(snapshot as SharedHome);
  else saveGroupFund(snapshot as GroupFund);
}

export default function SyncUpdates() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [records, setRecords] = useState(() => typeof window === 'undefined' ? [] : getSyncHistory());
  const [selected, setSelected] = useState<SyncHistoryRecord | null>(null);
  const pending = useMemo(() => records.filter(item => item.status === 'synced'), [records]);
  const undo = (record: SyncHistoryRecord) => {
    const current = currentSnapshot(record);
    const before = parseSnapshot<SyncSnapshot>(record.beforeSnapshotJson);
    if (!current || !before) { toast.error(t('editSyncUnavailable' as any)); return; }
    if (serializeSnapshot(current) !== record.afterSnapshotJson) { toast.error(t('editSyncConflict' as any)); return; }
    saveSnapshot(record.contextType, before);
    markSyncHistoryUndone(record.id);
    setRecords(getSyncHistory());
    setSelected({ ...record, status: 'undone' });
    toast.success(t('editSyncCompleted' as any));
  };
  return <main className="min-h-screen bg-kharcha-cream p-4"><div className="mx-auto max-w-2xl space-y-4"><AppSectionHeader title={t('editSyncReviewChanges' as any)} onBack={() => navigate('/more')} backLabel={t('backToKharcha' as any)} /><Card className="border-2 border-[#c7d8cc] bg-white p-4"><div className="flex items-center gap-2"><History size={20} className="text-[#e87817]" /><h2 className="font-black text-kharcha-navy">{t('editSyncCompleted' as any)}</h2></div>{pending.length === 0 ? <p className="mt-3 text-sm text-gray-600">{t('editSyncReviewChanges' as any)}</p> : <div className="mt-3 space-y-2">{pending.map(record => <div key={record.id} className="rounded-xl border border-[#d7e4dc] bg-[#fffdf8] p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-black text-kharcha-navy">{record.contextName}</p><p className="text-xs text-gray-600">{t('editSyncSynchronize' as any)} · {record.version} · {new Date(record.syncedAt).toLocaleString()}</p><p className="mt-1 text-xs font-semibold text-[#16834b]">{record.summary.total} {t('editSyncReviewChanges' as any)}</p></div><Button type="button" variant="outline" onClick={() => setSelected(record)}>{t('editSyncReviewChanges' as any)}</Button></div></div>)}</div>}</Card>{selected && <Card className="border-2 border-[#e87817] bg-[#fff8ed] p-4"><h2 className="font-black text-kharcha-navy">{selected.contextName}</h2><p className="mt-1 text-sm text-gray-700">{selected.summary.added} {t('editSyncAdded' as any)} · {selected.summary.changed} {t('editSyncChanged' as any)} · {selected.summary.removed} {t('editSyncRemoved' as any)}</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><Button type="button" variant="outline" onClick={() => setSelected(null)}>{t('cancel')}</Button><Button type="button" onClick={() => undo(selected)} disabled={selected.status === 'undone'} className="bg-[#e87817] text-white hover:bg-[#c95f08]"><RotateCcw size={16} className="mr-2" />{selected.status === 'undone' ? t('editSyncCompleted' as any) : t('undo' as any)}</Button></div></Card>}</div></main>;
}
