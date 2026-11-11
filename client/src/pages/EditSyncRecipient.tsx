import { useMemo } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppSectionHeader from '@/components/AppSectionHeader';
import { decodeEditPackage, payloadFromPath, randomId, type Snapshot } from '@/sync/serverlessSync';
import { findCopyForShare, getBaseSnapshot, getShare, saveCopy } from '@/sync/syncStore';
import { matchOwnerForEdit } from '@/sync/ownerMatch';
import { useLanguage } from '@/contexts/LanguageContext';
import { kindLabelKey, loadSnapshot, routeFor, storeSnapshot } from '@/sync/contextData';

/** Opens an edit link (/s/e…): save (or refresh) an editable copy on this device. */
export default function EditSyncRecipient() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const kindLabel = (type: Parameters<typeof kindLabelKey>[0]) => t(kindLabelKey(type) as any);
  const pkg = useMemo(() => { const p = payloadFromPath('e', window.location.pathname); return p ? decodeEditPackage(p) : null; }, []);
  if (!pkg) return <main className="mx-auto max-w-xl p-4"><Card className="p-5"><h1 className="text-xl font-black text-kharcha-navy">{t('syncEditBrokenTitle' as any)}</h1><p className="mt-2 text-sm text-gray-700">{t('syncEditBrokenBody' as any)}</p></Card></main>;
  // On the owner's device this link must update the original trip/fund, never create a second one.
  const ownerMatch = matchOwnerForEdit(pkg, { getShare, getBase: getBaseSnapshot, exists: (type, id) => Boolean(loadSnapshot(type, id)) });
  if (ownerMatch.kind !== 'none') return <main className="min-h-screen bg-kharcha-cream p-4"><div className="mx-auto max-w-xl space-y-4"><AppSectionHeader title={t('syncSharedForEditing' as any)} /><Card data-testid="edit-link-owner-card" className="border-2 border-[#c7d8cc] bg-white p-5">
    <p className="text-xs font-black uppercase tracking-wide text-[#16834b]">{t('syncYourKind' as any, { kind: kindLabel(ownerMatch.type) })}</p>
    <p className="mt-1 text-xl font-black text-kharcha-navy">{ownerMatch.name}</p>
    <p className="mt-2 text-sm text-gray-700">{ownerMatch.kind === 'update' ? t('syncOwnerUpdateBody' as any, { count: ownerMatch.changes, kind: kindLabel(ownerMatch.type) }) : t('syncOwnerNoChanges' as any, { kind: kindLabel(ownerMatch.type) })}</p>
    <Button data-testid={ownerMatch.kind === 'update' ? 'review-into-existing' : 'open-existing'} onClick={() => navigate(ownerMatch.kind === 'update' ? ownerMatch.path : routeFor(ownerMatch.type, ownerMatch.contextId))} className="mt-4 w-full bg-[#16834b] text-white hover:bg-[#11663b]">{ownerMatch.kind === 'update' ? t('syncReviewChanges' as any) : t('syncOpenName' as any, { name: ownerMatch.name })}</Button>
  </Card></div></main>;
  const existing = findCopyForShare(pkg.s);
  const existingSnap = existing ? loadSnapshot(existing.type, existing.copyId) : undefined;
  const save = () => {
    const copyId = existingSnap ? existing!.copyId : `copy-${randomId()}`;
    const snap: Snapshot = { ...JSON.parse(JSON.stringify(pkg.d)), id: copyId };
    storeSnapshot(pkg.t, snap);
    saveCopy({ copyId, sid: pkg.s, type: pkg.t, ver: pkg.n, name: pkg.m, from: pkg.f, baseJson: JSON.stringify(pkg.d), savedAt: Date.now() });
    toast.success(existingSnap ? t('syncCopyUpdated' as any) : t('syncCopySaved' as any));
    navigate(routeFor(pkg.t, copyId));
  };
  return <main className="min-h-screen bg-kharcha-cream p-4"><div className="mx-auto max-w-xl space-y-4"><AppSectionHeader title={t('syncSharedForEditing' as any)} /><Card data-testid="edit-link-card" className="border-2 border-[#c7d8cc] bg-white p-5">
    <div className="rounded-xl bg-[#f2fbf3] p-4"><p className="text-xs font-black uppercase tracking-wide text-[#16834b]">{pkg.f ? t('syncSharedWithYouFrom' as any, { name: pkg.f, kind: kindLabel(pkg.t) }) : t('syncSharedWithYou' as any, { kind: kindLabel(pkg.t) })}</p><p className="mt-1 text-xl font-black text-kharcha-navy">{pkg.m}</p><p className="mt-2 text-sm text-gray-700">{t('syncRecipientHelp' as any)}</p></div>
    {existingSnap && <p className="mt-3 rounded-lg bg-blue-50 p-2 text-xs font-semibold text-blue-900">{t('syncAlreadyHaveCopy' as any)}</p>}
    <div className="mt-4 grid gap-2">{existingSnap && <Button variant="outline" onClick={() => navigate(routeFor(pkg.t, existing!.copyId))}>{t('syncOpenExistingCopy' as any)}</Button>}<Button data-testid="save-editable-copy" onClick={save} className="w-full bg-[#16834b] text-white hover:bg-[#11663b]">{existingSnap ? t('syncReplaceCopy' as any) : t('syncSaveEditableCopy' as any)}</Button></div>
  </Card></div></main>;
}
