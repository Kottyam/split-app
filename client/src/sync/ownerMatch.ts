/**
 * When an edit link (/s/e…) or .kharcha edit file is opened on the device that owns the original
 * trip/fund, it must update that original in place instead of being saved as a separate copy.
 * Pure helper: storage lookups are injected so it can be unit tested.
 */
import { diffSnapshots, encodeUpdatePackage, type EditPackage, type Snapshot, type SyncKind, type UpdatePackage } from './serverlessSync';

export interface OwnerLookups {
  getShare: (sid: string) => { type: SyncKind; contextId: string; name: string } | undefined;
  getBase: (sid: string, ver: number) => Snapshot | null;
  exists: (type: SyncKind, id: string) => boolean;
}

export type OwnerMatch =
  | { kind: 'none' }
  | { kind: 'unchanged'; type: SyncKind; contextId: string; name: string }
  | { kind: 'update'; type: SyncKind; contextId: string; name: string; path: string; changes: number };

function stableId(text: string): string {
  let h1 = 0x811c9dc5; let h2 = 0x01000193;
  for (let i = 0; i < text.length; i++) { const c = text.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619); h2 = Math.imul(h2 ^ c, 2246822519); }
  return `e${(h1 >>> 0).toString(36)}${(h2 >>> 0).toString(36)}`;
}

export function matchOwnerForEdit(pkg: EditPackage, lookups: OwnerLookups): OwnerMatch {
  const refs = [pkg.o, { s: pkg.s, n: pkg.n }].filter((r): r is { s: string; n: number } => Boolean(r && typeof r.s === 'string' && typeof r.n === 'number'));
  for (const ref of refs) {
    const share = lookups.getShare(ref.s);
    if (!share || share.type !== pkg.t || !lookups.exists(share.type, share.contextId)) continue;
    const base = lookups.getBase(ref.s, ref.n);
    if (!base) continue;
    const edited: Snapshot = { ...(JSON.parse(JSON.stringify(pkg.d)) as Snapshot), id: base.id };
    const ops = diffSnapshots(base, edited);
    if (ops.length === 0) return { kind: 'unchanged', type: share.type, contextId: share.contextId, name: share.name };
    const update: UpdatePackage = { v: 1, t: share.type, s: ref.s, n: ref.n, u: stableId(JSON.stringify([ref, ops])), m: share.name, ...(pkg.f ? { f: pkg.f } : {}), c: ops };
    return { kind: 'update', type: share.type, contextId: share.contextId, name: share.name, path: `/s/u${encodeUpdatePackage(update)}`, changes: ops.length };
  }
  return { kind: 'none' };
}
