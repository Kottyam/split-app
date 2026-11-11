import { useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import AppSectionHeader from '@/components/AppSectionHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { addSyncHistory, nextSyncVersion, summarizeChanges } from '@/lib/editSync';
import { buildReview, decodeUpdatePackage, mergeAccepted, payloadFromPath, type ReviewItem, type Snapshot } from '@/sync/serverlessSync';
import { getApplied, getBaseSnapshot, getShare, markApplied } from '@/sync/syncStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { kindLabelKey, loadSnapshot, routeFor, storeSnapshot } from '@/sync/contextData';

const SECTION: Record<string, string> = { members: 'syncSectionMembers', expenses: 'syncSectionExpenses', contributions: 'syncSectionCollections', payments: 'syncSectionPayments' };
const ACTION: Record<string, string> = { added: 'syncActionAdded', deleted: 'syncActionDeleted', edited: 'syncActionEdited', field: 'syncActionChanged' };
function show(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value !== 'object') return String(value);
  const r = value as Record<string, unknown>;
  const bits = [r.name ?? r.description ?? r.title, r.amount !== undefined ? `₹${r.amount}` : undefined].filter(Boolean);
  return bits.length ? bits.join(' · ') : JSON.stringify(value).slice(0, 80);
}

/** Opens an update link (/s/u…) on the owner's device: review, accept or reject, merge locally. */
export default function SyncReview() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const pkg = useMemo(() => { const p = payloadFromPath('u', window.location.pathname); return p ? decodeUpdatePackage(p) : null; }, []);
  const share = pkg ? getShare(pkg.s) : undefined;
  const base = pkg && share ? getBaseSnapshot(pkg.s, pkg.n) : null;
  const owner = share ? loadSnapshot(share.type, share.contextId) : undefined;
  const already = pkg ? getApplied(pkg.u) : undefined;
  const review = useMemo<ReviewItem[]>(() => (pkg && base && owner ? buildReview(base, owner, pkg.c) : []), [pkg, base, owner]);
  const [accepted, setAccepted] = useState<Set<string>>(() => new Set(review.filter(i => !i.conflict && !i.noop).map(i => i.key)));
  const [result, setResult] = useState<'accepted' | 'rejected' | null>(null);

  const box = (title: string, body: string) => <main className="mx-auto max-w-xl p-4"><Card data-testid="sync-review-message" className="p-5"><h1 className="text-xl font-black text-kharcha-navy">{title}</h1><p className="mt-2 text-sm text-gray-700">{body}</p>{share && <Button className="mt-4" variant="outline" onClick={() => navigate(routeFor(share.type, share.contextId))}>{t('syncOpenName' as any, { name: share.name })}</Button>}</Card></main>;
  if (!pkg) return box(t('syncUpdateBrokenTitle' as any), t('syncUpdateBrokenBody' as any));
  if (!share || !owner) return box(t('syncOpenOnOwnerTitle' as any), t('syncOpenOnOwnerBody' as any, { name: pkg.m }));
  if (!base) return box(t('syncTooOldTitle' as any), t('syncTooOldBody' as any));
  if (already && !result) return box(already.status === 'accepted' ? t('syncAlreadyAccepted' as any) : t('syncAlreadyRejected' as any), t((already.status === 'accepted' ? 'syncAlreadyAcceptedBody' : 'syncAlreadyRejectedBody') as any, { date: new Date(already.at).toLocaleString('en-IN') }));

  const actionable = review.filter(i => !i.noop);
  const conflicts = actionable.filter(i => i.conflict).length;
  const toggle = (key: string) => setAccepted(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  const accept = () => {
    const { merged, applied, blocked } = mergeAccepted(owner, review, accepted);
    const before = JSON.stringify(owner);
    if (applied > 0) {
      storeSnapshot(share.type, merged as Snapshot);
      addSyncHistory({ contextType: share.type, contextId: share.contextId, contextName: share.name, version: nextSyncVersion(share.type, share.contextId), syncedAt: Date.now(), summary: summarizeChanges(owner as never, merged as never), beforeSnapshotJson: before, afterSnapshotJson: JSON.stringify(merged) });
    }
    markApplied({ uid: pkg.u, sid: pkg.s, status: 'accepted', at: Date.now() });
    if (blocked.length) toast.warning(t('syncDeletionsSkipped' as any, { count: blocked.length }));
    toast.success(t('syncAcceptedToast' as any, { count: applied }));
    setResult('accepted');
  };
  const reject = () => { markApplied({ uid: pkg.u, sid: pkg.s, status: 'rejected', at: Date.now() }); toast.message(t('syncRejectedToast' as any)); setResult('rejected'); };

  return <main className="min-h-screen bg-kharcha-cream p-4"><div className="mx-auto max-w-2xl space-y-4"><AppSectionHeader title={t('syncReviewChanges' as any)} /><Card data-testid="sync-review" className="border-2 border-[#c7d8cc] bg-white p-5">
    <p className="text-xs font-black uppercase tracking-wide text-[#16834b]">{t('syncChangesToYour' as any, { kind: t(kindLabelKey(share.type) as any) })}</p>
    <h1 className="text-xl font-black text-kharcha-navy">{share.name}</h1>
    <p className="mt-1 text-sm text-gray-700">{t('syncChangeCount' as any, { count: actionable.length })}{conflicts ? `, ${t('syncConflictCount' as any, { count: conflicts })}` : ''}. {t('syncTickWhatToKeep' as any)}</p>
    {review.length - actionable.length > 0 && <p className="mt-1 text-xs text-gray-500">{t('syncAlreadyMatch' as any, { count: review.length - actionable.length })}</p>}
    <div className="mt-4 space-y-2">{actionable.map(item => <label key={item.key} data-testid="sync-review-item" className={`flex gap-3 rounded-xl border p-3 ${item.conflict ? 'border-amber-400 bg-amber-50' : 'border-gray-200'}`}>
      <input type="checkbox" className="mt-1 h-4 w-4" checked={accepted.has(item.key)} disabled={Boolean(result)} onChange={() => toggle(item.key)} />
      <span className="min-w-0 flex-1 text-sm"><span className="block font-black text-kharcha-navy"><span className={`mr-2 rounded px-1.5 py-0.5 text-[10px] uppercase ${item.action === 'added' ? 'bg-green-100 text-green-800' : item.action === 'deleted' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{ACTION[item.action] ? t(ACTION[item.action] as any) : item.action}</span>{SECTION[item.section] ? t(SECTION[item.section] as any) : item.section}: {item.label}</span>
        {item.action === 'edited' || item.action === 'field' ? <span className="block text-xs text-gray-700">{show(item.before)} → {show(item.theirs)}</span> : item.action === 'added' ? <span className="block text-xs text-gray-700">{show(item.theirs)}</span> : <span className="block text-xs text-gray-700">{show(item.before)}</span>}
        {item.conflict && <span className="mt-1 block text-xs font-bold text-amber-900">{t('syncConflictLabel' as any)} {item.conflictReason === 'owner-deleted' ? t('syncYouDeleted' as any) : t('syncYouChanged' as any)} ({t('syncYours' as any, { value: show(item.owner) })}). {t('syncTickedHint' as any)}</span>}
      </span></label>)}</div>
    {result ? <div className="mt-4 space-y-2"><p data-testid="sync-review-result" className="font-black text-kharcha-navy">{result === 'accepted' ? t('syncAcceptedResult' as any) : t('syncRejectedResult' as any)}</p><Button onClick={() => navigate(routeFor(share.type, share.contextId))} className="w-full">{t('syncOpenName' as any, { name: share.name })}</Button></div>
      : <div className="mt-4 grid gap-2 sm:grid-cols-2"><Button data-testid="sync-reject" variant="outline" onClick={reject}>{t('syncRejectAll' as any)}</Button><Button data-testid="sync-accept" onClick={accept} disabled={accepted.size === 0} className="bg-[#16834b] text-white hover:bg-[#11663b]">{t('syncAcceptSelected' as any, { count: Array.from(accepted).filter(k => actionable.some(i => i.key === k)).length })}</Button></div>}
  </Card></div></main>;
}
