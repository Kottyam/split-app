import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import AppSectionHeader from '@/components/AppSectionHeader';
import { trpc } from '@/lib/trpc';
import { cloneSnapshot, parseSnapshot, type SyncContextType, type SyncSnapshot } from '@/lib/editSync';

import { getAllTrips, saveTrip } from '@/lib/storage';
import { getAllSharedHomes, saveSharedHome } from '@/sharedHome/storage';
import { getGroupFunds, saveGroupFund } from '@/groupFund/storage';
import type { Trip } from '@/types';
import type { SharedHome } from '@/sharedHome/types';
import type { GroupFund } from '@/groupFund/types';
import { toast } from 'sonner';

function tokenFromPath(prefix: string) { const value = window.location.pathname.split(`/${prefix}/`)[1]; return value ? decodeURIComponent(value) : ''; }
function copyForLocal(type: SyncContextType, snapshot: SyncSnapshot): SyncSnapshot { const copy = cloneSnapshot(snapshot) as SyncSnapshot & { id: string }; copy.id = `edit-copy-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; return copy; }
function findLocalCopy(type: SyncContextType, copyId: string): SyncSnapshot | undefined { if (type === 'trip') return getAllTrips().find(item => item.id === copyId); if (type === 'shared_home') return getAllSharedHomes().find(item => item.id === copyId); return getGroupFunds().find(item => item.id === copyId); }

export default function EditSyncRecipient() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const token = useMemo(() => tokenFromPath('edit-sync'), []);
  const query = trpc.sync.getShare.useQuery({ token }, { enabled: Boolean(token) });
  const [copyId, setCopyId] = useState<string | null>(() => { try { return JSON.parse(localStorage.getItem(`kharcha_edit_sync_copy:${token}`) ?? 'null')?.copyId ?? null; } catch { return null; } });
  const record = query.data;
  const snapshot = record ? parseSnapshot<SyncSnapshot>(record.snapshotJson) : null;
  const contextType = record?.contextType as SyncContextType | undefined;
  useEffect(() => { if (query.isError) toast.error(t('editSyncUnavailable' as any)); }, [query.isError, t]);

  const saveEditableCopy = () => {
    if (!snapshot || !contextType) return;
    const copy = copyForLocal(contextType, snapshot) as SyncSnapshot & { id: string };
    if (contextType === 'trip') saveTrip(copy as Trip);
    if (contextType === 'shared_home') saveSharedHome(copy as SharedHome);
    if (contextType === 'group_fund') saveGroupFund(copy as GroupFund);
    const metadata = { copyId: copy.id, contextType, baseSnapshotHash: record?.snapshotHash, baseSnapshotJson: record?.snapshotJson, sourceId: record?.contextId, shareToken: token };
    localStorage.setItem(`kharcha_edit_sync_copy:${token}`, JSON.stringify(metadata));
    localStorage.setItem(`kharcha_edit_sync_copy:${contextType}:${copy.id}`, JSON.stringify(metadata));
    setCopyId(copy.id);
    toast.success(t('editSyncCopyCreated' as any));
    navigate(contextType === 'trip' ? `/trip/${copy.id}` : contextType === 'shared_home' ? `/shared-home/${copy.id}` : `/group-fund/${copy.id}`);
  };

  if (query.isLoading) return <main className="mx-auto max-w-xl p-4"><Card className="p-5">{t('loading' as any)}</Card></main>;
  if (!record || !snapshot || !contextType) return <main className="mx-auto max-w-xl p-4"><Card className="p-5"><h1 className="text-xl font-black text-kharcha-navy">{t('editSyncUnavailable' as any)}</h1></Card></main>;
  return <main className="min-h-screen bg-kharcha-cream p-4"><div className="mx-auto max-w-xl space-y-4"><AppSectionHeader title={t('editSyncOpenTitle' as any)} /><Card className="border-2 border-[#c7d8cc] bg-white p-5"><div className="rounded-xl bg-[#f2fbf3] p-4"><p className="text-xs font-black uppercase tracking-wide text-[#16834b]">{t('editSyncSelectedItem' as any)}</p><p className="mt-1 text-xl font-black text-kharcha-navy">{record.contextName}</p><p className="mt-2 text-sm text-gray-700">{t('editSyncOwnerProtection' as any)}</p></div><div className="mt-4"><Button onClick={saveEditableCopy} className="w-full bg-[#16834b] text-white hover:bg-[#11663b]">{t('editSyncEditCopy' as any)}</Button></div></Card></div></main>;
}
