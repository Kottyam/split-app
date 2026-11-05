import { useMemo } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppSectionHeader from '@/components/AppSectionHeader';
import { decodeEditPackage, payloadFromPath, randomId, type Snapshot } from '@/sync/serverlessSync';
import { findCopyForShare, getBaseSnapshot, getShare, saveCopy } from '@/sync/syncStore';
import { matchOwnerForEdit } from '@/sync/ownerMatch';
import { kindLabel, loadSnapshot, routeFor, storeSnapshot } from '@/sync/contextData';

/** Opens an edit link (/s/e…): save (or refresh) an editable copy on this device. */
export default function EditSyncRecipient() {
  const [, navigate] = useLocation();
  const pkg = useMemo(() => { const p = payloadFromPath('e', window.location.pathname); return p ? decodeEditPackage(p) : null; }, []);
  if (!pkg) return <main className="mx-auto max-w-xl p-4"><Card className="p-5"><h1 className="text-xl font-black text-kharcha-navy">This edit link is broken or incomplete</h1><p className="mt-2 text-sm text-gray-700">Ask the owner to share it again, or send it as a .kharcha file.</p></Card></main>;
  // On the owner's device this link must update the original trip/fund, never create a second one.
  const ownerMatch = matchOwnerForEdit(pkg, { getShare, getBase: getBaseSnapshot, exists: (type, id) => Boolean(loadSnapshot(type, id)) });
  if (ownerMatch.kind !== 'none') return <main className="min-h-screen bg-kharcha-cream p-4"><div className="mx-auto max-w-xl space-y-4"><AppSectionHeader title="Shared for editing" /><Card data-testid="edit-link-owner-card" className="border-2 border-[#c7d8cc] bg-white p-5">
    <p className="text-xs font-black uppercase tracking-wide text-[#16834b]">Your {kindLabel(ownerMatch.type)}</p>
    <p className="mt-1 text-xl font-black text-kharcha-navy">{ownerMatch.name}</p>
    <p className="mt-2 text-sm text-gray-700">{ownerMatch.kind === 'update' ? `This link has ${ownerMatch.changes} change(s) to your ${kindLabel(ownerMatch.type)}. Review them and they will be added to the same ${kindLabel(ownerMatch.type)}, not saved as a new one.` : `This is your own ${kindLabel(ownerMatch.type)} and it has no new changes.`}</p>
    <Button data-testid={ownerMatch.kind === 'update' ? 'review-into-existing' : 'open-existing'} onClick={() => navigate(ownerMatch.kind === 'update' ? ownerMatch.path : routeFor(ownerMatch.type, ownerMatch.contextId))} className="mt-4 w-full bg-[#16834b] text-white hover:bg-[#11663b]">{ownerMatch.kind === 'update' ? 'Review changes' : `Open ${ownerMatch.name}`}</Button>
  </Card></div></main>;
  const existing = findCopyForShare(pkg.s);
  const existingSnap = existing ? loadSnapshot(existing.type, existing.copyId) : undefined;
  const save = () => {
    const copyId = existingSnap ? existing!.copyId : `copy-${randomId()}`;
    const snap: Snapshot = { ...JSON.parse(JSON.stringify(pkg.d)), id: copyId };
    storeSnapshot(pkg.t, snap);
    saveCopy({ copyId, sid: pkg.s, type: pkg.t, ver: pkg.n, name: pkg.m, from: pkg.f, baseJson: JSON.stringify(pkg.d), savedAt: Date.now() });
    toast.success(existingSnap ? 'Your copy was updated to the owner’s latest version' : 'Editable copy saved on this device');
    navigate(routeFor(pkg.t, copyId));
  };
  return <main className="min-h-screen bg-kharcha-cream p-4"><div className="mx-auto max-w-xl space-y-4"><AppSectionHeader title="Shared for editing" /><Card data-testid="edit-link-card" className="border-2 border-[#c7d8cc] bg-white p-5">
    <div className="rounded-xl bg-[#f2fbf3] p-4"><p className="text-xs font-black uppercase tracking-wide text-[#16834b]">{pkg.f ? `${pkg.f} shared a ${kindLabel(pkg.t)} with you` : `A ${kindLabel(pkg.t)} was shared with you`}</p><p className="mt-1 text-xl font-black text-kharcha-navy">{pkg.m}</p><p className="mt-2 text-sm text-gray-700">Save your own copy, make changes, then tap “Send changes to owner”. The owner reviews every change before it is added to their data.</p></div>
    {existingSnap && <p className="mt-3 rounded-lg bg-blue-50 p-2 text-xs font-semibold text-blue-900">You already have a copy. Saving again replaces it with this version; send your unsent changes first.</p>}
    <div className="mt-4 grid gap-2">{existingSnap && <Button variant="outline" onClick={() => navigate(routeFor(pkg.t, existing!.copyId))}>Open my existing copy</Button>}<Button data-testid="save-editable-copy" onClick={save} className="w-full bg-[#16834b] text-white hover:bg-[#11663b]">{existingSnap ? 'Replace my copy with this version' : 'Save editable copy'}</Button></div>
  </Card></div></main>;
}
