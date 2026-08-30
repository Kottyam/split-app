import { useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import AppSectionHeader from '@/components/AppSectionHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { addSyncHistory, cloneSnapshot, getOrCreateOwnerKey, mergeSnapshots, nextSyncVersion, parseSnapshot, serializeSnapshot, summarizeChanges, type SyncContextType, type SyncSnapshot } from '@/lib/editSync';
import { getAllTrips, saveTrip } from '@/lib/storage';
import { getAllSharedHomes, saveSharedHome } from '@/sharedHome/storage';
import { getGroupFunds, saveGroupFund } from '@/groupFund/storage';
import type { Trip } from '@/types';
import type { SharedHome } from '@/sharedHome/types';
import type { GroupFund } from '@/groupFund/types';
import { toast } from 'sonner';

function tokenFromPath() { return decodeURIComponent(window.location.pathname.split('/sync-review/')[1] ?? ''); }
function getOwnerSnapshot(type: SyncContextType, id: string): SyncSnapshot | undefined { if (type === 'trip') return getAllTrips().find(item => item.id === id); if (type === 'shared_home') return getAllSharedHomes().find((item: SharedHome) => item.id === id); return getGroupFunds().find(item => item.id === id); }
function saveOwnerSnapshot(type: SyncContextType, snapshot: SyncSnapshot) { if (type === 'trip') saveTrip(snapshot as Trip); else if (type === 'shared_home') saveSharedHome(snapshot as SharedHome); else saveGroupFund(snapshot as GroupFund); }
function readPath(value: unknown, path: string): unknown { return path.split('/').filter(Boolean).reduce<unknown>((current, key) => { if (Array.isArray(current)) return current.find(item => item && typeof item === 'object' && String((item as Record<string, unknown>).id) === key); if (current && typeof current === 'object') return (current as Record<string, unknown>)[key]; return undefined; }, value); }
function displayValue(value: unknown): string { if (value === undefined) return '—'; if (typeof value === 'string') return value || '—'; if (typeof value === 'number' || typeof value === 'boolean') return String(value); try { return JSON.stringify(value); } catch { return '—'; } }
function parseSummary(value: string) { try { const parsed = JSON.parse(value) as { added?: number; changed?: number; removed?: number; paths?: Array<{ kind: 'added' | 'removed' | 'changed'; path: string }> }; return { total: (parsed.added ?? 0) + (parsed.changed ?? 0) + (parsed.removed ?? 0), added: parsed.added ?? 0, changed: parsed.changed ?? 0, removed: parsed.removed ?? 0, paths: Array.isArray(parsed.paths) ? parsed.paths.slice(0, 100) : [] }; } catch { return { total: 0, added: 0, changed: 0, removed: 0, paths: [] }; } }

export default function SyncReview() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const token = useMemo(tokenFromPath, []);
  const query = trpc.sync.getPackage.useQuery({ token }, { enabled: Boolean(token) });
  const apply = trpc.sync.markApplied.useMutation();
  const [done, setDone] = useState(false);
  const [declined, setDeclined] = useState(false);
  const data = query.data;
  const contextType = data?.contextType as SyncContextType | undefined;
  const base = data ? parseSnapshot<SyncSnapshot>(data.baseSnapshotJson) : null;
  const edited = data ? parseSnapshot<SyncSnapshot>(data.editedSnapshotJson) : null;
  const owner = data && contextType ? getOwnerSnapshot(contextType, data.contextId) : undefined;
  const merge = base && edited && owner ? mergeSnapshots(base, owner, edited) : null;
  const submittedSummary = data ? parseSummary(data.changeSummaryJson) : { total: 0, added: 0, changed: 0, removed: 0, paths: [] };
  const summary = owner && edited ? summarizeChanges(owner, edited) : submittedSummary;

  const synchronize = async () => {
    if (!data || !contextType || !merge || !owner || merge.conflicts.length > 0) {
      if (merge?.conflicts.length) toast.error(t('editSyncConflict' as any));
      return;
    }
    if (summary.total === 0) return;
    const beforeSnapshot = cloneSnapshot(owner);
    const ownerKey = getOrCreateOwnerKey(contextType, data.contextId);
    const result = await apply.mutateAsync({ token, ownerKey });
    if (!result.success) { toast.error(t('editSyncOwnerVerificationFailed' as any)); return; }
    saveOwnerSnapshot(contextType, merge.merged);
    addSyncHistory({ contextType, contextId: data.contextId, contextName: data.contextName, version: nextSyncVersion(contextType, data.contextId), syncedAt: Date.now(), summary, beforeSnapshotJson: serializeSnapshot(beforeSnapshot), afterSnapshotJson: serializeSnapshot(merge.merged) });
    setDone(true);
    toast.success(t('editSyncCompleted' as any));
  };

  if (query.isLoading) return <main className="mx-auto max-w-xl p-4"><Card className="p-5">{t('loading' as any)}</Card></main>;
  if (!data || !base || !edited || !owner || !merge) return <main className="min-h-screen bg-kharcha-cream p-4"><Card className="mx-auto max-w-xl p-5"><h1 className="text-xl font-black text-kharcha-navy">{t('editSyncUnavailable' as any)}</h1><Button variant="outline" className="mt-4" onClick={() => navigate('/')}>{t('cancel')}</Button></Card></main>;

  return <main className="min-h-screen bg-kharcha-cream p-4"><div className="mx-auto max-w-2xl space-y-4"><AppSectionHeader title={done ? t('editSyncCompleted' as any) : t('editSyncReviewTitle' as any)} onBack={() => navigate('/')} backLabel={t('backToKharcha' as any)} /><Card className="border-2 border-[#c7d8cc] bg-white p-5"><div className="mt-4 rounded-xl bg-[#f2fbf3] p-4"><p className="text-xs font-black uppercase tracking-wide text-[#16834b]">{t('editSyncSelectedItem' as any)}</p><p className="mt-1 text-xl font-black text-kharcha-navy">{data.contextName}</p><p className="mt-2 text-xs text-gray-600">{data.recipientName || t('editSyncRecipientUnknown' as any)} · {new Date(data.createdAt).toLocaleString()}</p></div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-[#fff3e3] p-3"><p className="text-2xl font-black text-[#e87817]">{summary.added}</p><p className="text-xs font-bold text-gray-600">{t('editSyncAdded' as any)}</p></div><div className="rounded-xl bg-[#f2fbf3] p-3"><p className="text-2xl font-black text-[#16834b]">{summary.changed}</p><p className="text-xs font-bold text-gray-600">{t('editSyncChanged' as any)}</p></div><div className="rounded-xl bg-[#eef2f7] p-3"><p className="text-2xl font-black text-kharcha-navy">{summary.removed}</p><p className="text-xs font-bold text-gray-600">{t('editSyncRemoved' as any)}</p></div></div><section className="mt-4 rounded-xl border border-[#c7d8cc] bg-white p-4"><h2 className="font-black text-kharcha-navy">{summary.total === 0 ? t('editSyncReviewChanges' as any) : t('editSyncReviewChanges' as any)}</h2>{summary.paths.length === 0 ? <p className="mt-2 text-sm text-gray-600">{t('editSyncReviewChanges' as any)}</p> : <div className="mt-3 space-y-2">{summary.paths.map((change, index) => <div key={`${change.path}-${index}`} className="rounded-lg border border-[#e7d7bd] bg-[#fffdf8] p-3"><p className="break-all text-xs font-black text-kharcha-navy">{change.kind.toUpperCase()} · {change.path || '/'}</p><div className="mt-2 grid gap-2 text-xs sm:grid-cols-2"><div><p className="font-bold text-gray-500">{t('editSyncOwnerProtection' as any)}</p><p className="mt-1 break-words text-gray-800">{displayValue(readPath(owner, change.path))}</p></div><div><p className="font-bold text-[#16834b]">{t('editSyncPending' as any)}</p><p className="mt-1 break-words text-gray-800">{displayValue(readPath(edited, change.path))}</p></div></div></div>)}</div>}</section>{!done && merge.conflicts.length > 0 && <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3"><p className="font-black text-amber-900">{t('editSyncConflict' as any)}</p><p className="mt-1 text-sm text-amber-800">{merge.conflicts.length} {t('editSyncConflictFields' as any)}</p><div className="mt-2 space-y-1 text-xs text-amber-900">{merge.conflicts.slice(0, 20).map(conflict => <p key={conflict.path} className="break-all">{conflict.path || '/'}: {displayValue(conflict.ownerValue)} → {displayValue(conflict.editedValue)}</p>)}</div></div>}{summary.total > 0 && !done && <div className="mt-4 rounded-xl border-2 border-[#e87817] bg-[#fff8ed] p-4"><h2 className="font-black text-kharcha-navy">{t('editSyncPending' as any)}</h2><p className="mt-1 text-sm text-gray-700">{t('editSyncReviewDescription' as any)}</p></div>}<div className="mt-4 grid gap-2 sm:grid-cols-2"><Button variant="outline" onClick={() => { setDeclined(true); toast.message(t('cancel')); }}>{t('cancel')}</Button><Button onClick={synchronize} disabled={done || declined || apply.isPending || summary.total === 0 || merge.conflicts.length > 0} className="bg-[#16834b] text-white hover:bg-[#11663b]">{apply.isPending ? t('sharing' as any) : t('editSyncSynchronize' as any)}</Button></div></Card></div></main>;
}
