/** Device-local bookkeeping for serverless sync (owner shares, recipient copies, applied updates). */
import type { Snapshot, SyncKind } from './serverlessSync';
import { randomId } from './serverlessSync';

const SHARES = 'kharcha_sync_shares';
const COPIES = 'kharcha_sync_copies';
const APPLIED = 'kharcha_sync_applied_updates';
const MAX_VERSIONS = 8;

export interface OwnerShare { sid: string; type: SyncKind; contextId: string; name: string; latest: number; versions: Record<string, string> }
export interface RecipientCopy { copyId: string; sid: string; type: SyncKind; ver: number; name: string; from?: string; baseJson: string; savedAt: number }
export interface AppliedUpdate { uid: string; sid: string; status: 'accepted' | 'rejected'; at: number }

function read<T>(key: string, fallback: T): T { try { const v = JSON.parse(localStorage.getItem(key) ?? 'null'); return v ?? fallback; } catch { return fallback; } }
function write(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full: best effort */ } }

export function getShares(): Record<string, OwnerShare> { return read(SHARES, {}); }
export function getShare(sid: string): OwnerShare | undefined { return getShares()[sid]; }
export function findShareForContext(type: SyncKind, contextId: string): OwnerShare | undefined {
  return Object.values(getShares()).find(s => s.type === type && s.contextId === contextId);
}
/** Record the snapshot the owner is about to share. Re-uses the version when nothing changed. */
export function recordSharedBase(type: SyncKind, contextId: string, name: string, snapshot: Snapshot): { sid: string; ver: number } {
  const shares = getShares();
  const json = JSON.stringify(snapshot);
  let share = Object.values(shares).find(s => s.type === type && s.contextId === contextId);
  if (!share) share = { sid: randomId(), type, contextId, name, latest: 0, versions: {} };
  if (share.versions[String(share.latest)] !== json) {
    share.latest += 1;
    share.versions[String(share.latest)] = json;
    const keep = Object.keys(share.versions).map(Number).sort((a, b) => b - a).slice(0, MAX_VERSIONS);
    share.versions = Object.fromEntries(keep.map(v => [String(v), share!.versions[String(v)]]));
  }
  share.name = name;
  shares[share.sid] = share;
  write(SHARES, shares);
  return { sid: share.sid, ver: share.latest };
}
export function getBaseSnapshot(sid: string, ver: number): Snapshot | null {
  const json = getShare(sid)?.versions[String(ver)];
  try { return json ? JSON.parse(json) as Snapshot : null; } catch { return null; }
}

export function getCopies(): Record<string, RecipientCopy> { return read(COPIES, {}); }
export function getCopy(copyId: string): RecipientCopy | undefined { return getCopies()[copyId]; }
export function findCopyForShare(sid: string): RecipientCopy | undefined { return Object.values(getCopies()).find(c => c.sid === sid); }
export function saveCopy(copy: RecipientCopy) { const all = getCopies(); all[copy.copyId] = copy; write(COPIES, all); }

export function getApplied(uid: string): AppliedUpdate | undefined { return read<AppliedUpdate[]>(APPLIED, []).find(a => a.uid === uid); }
export function markApplied(entry: AppliedUpdate) {
  const list = read<AppliedUpdate[]>(APPLIED, []).filter(a => a.uid !== entry.uid);
  write(APPLIED, [entry, ...list].slice(0, 300));
}
