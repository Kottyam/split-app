/**
 * Serverless edit & sync: everything travels inside links or .kharcha files.
 * Owner shares an edit link (/s/e…) holding a full snapshot. The recipient edits a local copy
 * and sends back an update link (/s/u…) holding only the changes. The owner reviews and merges
 * against the exact base snapshot it shared, which it kept locally.
 */
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { SHARE_ORIGIN } from '@/share/origin';

export type SyncKind = 'trip' | 'shared_home' | 'group_fund';
type Rec = Record<string, unknown>;
export type Snapshot = Rec & { id: string; name?: string };

export const MAX_LINK_LENGTH = 1800;
const FORMAT = 1;

export interface EditPackage { v: number; t: SyncKind; s: string; n: number; m: string; f?: string; d: Snapshot }
export type ChangeOp =
  | { k: string; o: 'a' | 'e'; id: string; v: Rec }
  | { k: string; o: 'd'; id: string }
  | { k: string; o: 'f'; v: unknown }
  | { k: string; o: 'x' };
export interface UpdatePackage { v: number; t: SyncKind; s: string; n: number; u: string; m: string; f?: string; c: ChangeOp[] }

const KINDS: SyncKind[] = ['trip', 'shared_home', 'group_fund'];
const isRec = (x: unknown): x is Rec => Boolean(x) && typeof x === 'object' && !Array.isArray(x);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
export function randomId(): string {
  try { return crypto.randomUUID().replace(/-/g, '').slice(0, 16); } catch { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
}
/** An array is "keyed" when every element is an object with an id; those are diffed item by item. */
export function isKeyedArray(x: unknown): x is Rec[] {
  return Array.isArray(x) && x.length > 0 && x.every(i => isRec(i) && typeof i.id === 'string' && i.id !== '');
}
const KEYED_DEFAULTS = ['members', 'expenses', 'contributions', 'payments', 'rooms', 'recurringRules', 'rentPayments', 'settlements'];
function keyedKeys(...snaps: Rec[]): Set<string> {
  const keys = new Set<string>();
  for (const s of snaps) for (const [k, v] of Object.entries(s)) if (isKeyedArray(v) || (Array.isArray(v) && v.length === 0 && KEYED_DEFAULTS.includes(k))) keys.add(k);
  // An empty array only counts as keyed if some snapshot has items there or it is a known list.
  return keys;
}

/** Give every list item a stable id and trip expenses an updatedAt, without touching anything else. */
export function normalizeSnapshot<T extends Rec>(snap: T): T {
  const out = clone(snap) as Rec;
  for (const [k, v] of Object.entries(out)) {
    if (!Array.isArray(v) || v.length === 0 || !v.every(isRec)) continue;
    if (!KEYED_DEFAULTS.includes(k) && !v.some(i => typeof (i as Rec).id === 'string')) continue;
    out[k] = v.map((item, index) => {
      const rec = item as Rec;
      const id = typeof rec.id === 'string' && rec.id ? rec.id : `${k}-${index}-${randomId().slice(0, 6)}`;
      const next: Rec = { ...rec, id };
      if (next.updatedAt === undefined && typeof next.createdAt === 'number') next.updatedAt = next.createdAt;
      return next;
    });
  }
  return out as T;
}

export function diffSnapshots(base: Rec, edited: Rec): ChangeOp[] {
  const ops: ChangeOp[] = [];
  const keyed = keyedKeys(base, edited);
  const keys = Array.from(new Set([...Object.keys(base), ...Object.keys(edited)])).filter(k => k !== 'id');
  for (const k of keys) {
    if (keyed.has(k)) {
      const b = new Map(((base[k] as Rec[]) ?? []).map(i => [String(i.id), i]));
      const e = new Map(((edited[k] as Rec[]) ?? []).map(i => [String(i.id), i]));
      for (const [id, item] of Array.from(e)) {
        if (!b.has(id)) ops.push({ k, o: 'a', id, v: item });
        else if (!same(b.get(id), item)) ops.push({ k, o: 'e', id, v: item });
      }
      for (const id of Array.from(b.keys())) if (!e.has(id)) ops.push({ k, o: 'd', id });
    } else if (!same(base[k], edited[k])) {
      ops.push(edited[k] === undefined ? { k, o: 'x' } : { k, o: 'f', v: edited[k] });
    }
  }
  return ops;
}

export function applyOps<T extends Rec>(base: T, ops: ChangeOp[]): T {
  const out = clone(base) as Rec;
  for (const op of ops) {
    if (op.o === 'f') out[op.k] = clone(op.v);
    else if (op.o === 'x') delete out[op.k];
    else {
      const list = Array.isArray(out[op.k]) ? [...(out[op.k] as Rec[])] : [];
      const at = list.findIndex(i => String(i.id) === op.id);
      if (op.o === 'd') { if (at >= 0) list.splice(at, 1); }
      else if (at >= 0) list[at] = clone(op.v);
      else list.push(clone(op.v));
      out[op.k] = list;
    }
  }
  return out as T;
}

export type ReviewAction = 'added' | 'edited' | 'deleted' | 'field';
export interface ReviewItem {
  key: string; // stable review key
  op: ChangeOp;
  action: ReviewAction;
  section: string;
  label: string;
  before?: unknown; // base value
  owner?: unknown; // owner's current value
  theirs?: unknown;
  conflict: boolean;
  conflictReason?: 'owner-edited' | 'owner-deleted' | 'owner-added-different';
  noop: boolean; // already the same on the owner side
}

function findItem(snap: Rec, k: string, id: string): Rec | undefined {
  const list = snap[k];
  return Array.isArray(list) ? (list as Rec[]).find(i => isRec(i) && String(i.id) === id) : undefined;
}
export function itemLabel(item: unknown, fallback: string): string {
  if (!isRec(item)) return fallback;
  for (const f of ['name', 'description', 'title', 'note', 'category']) if (typeof item[f] === 'string' && item[f]) return item[f] as string;
  return fallback;
}

export function buildReview(base: Rec, owner: Rec, ops: ChangeOp[]): ReviewItem[] {
  return ops.map((op, index) => {
    if (op.o === 'f' || op.o === 'x') {
      const theirs = op.o === 'f' ? op.v : undefined;
      const ownerChanged = !same(owner[op.k], base[op.k]);
      const noop = same(owner[op.k], theirs);
      return { key: `${index}:${op.k}`, op, action: 'field', section: op.k, label: op.k, before: base[op.k], owner: owner[op.k], theirs, conflict: ownerChanged && !noop, conflictReason: ownerChanged && !noop ? 'owner-edited' : undefined, noop };
    }
    const b = findItem(base, op.k, op.id);
    const o = findItem(owner, op.k, op.id);
    const theirs = op.o === 'd' ? undefined : op.v;
    const action: ReviewAction = op.o === 'a' ? 'added' : op.o === 'e' ? 'edited' : 'deleted';
    let conflict = false; let conflictReason: ReviewItem['conflictReason'];
    let noop = false;
    if (op.o === 'a') {
      if (o && !same(o, op.v)) { conflict = true; conflictReason = 'owner-added-different'; }
      noop = Boolean(o) && same(o, op.v);
    } else if (op.o === 'e') {
      if (!o) { conflict = true; conflictReason = 'owner-deleted'; }
      else if (same(o, op.v)) noop = true;
      else if (!same(o, b)) { conflict = true; conflictReason = 'owner-edited'; }
    } else {
      if (!o) noop = true;
      else if (!same(o, b)) { conflict = true; conflictReason = 'owner-edited'; }
    }
    return { key: `${index}:${op.k}:${op.id}`, op, action, section: op.k, label: itemLabel(theirs ?? o ?? b, op.id), before: b, owner: o, theirs, conflict, conflictReason, noop };
  });
}

/**
 * Merge accepted review items into the owner's current data. Owner-only changes always stay.
 * Accepting a conflict means "use their version". Rejected items leave the owner's data as it is.
 * Deleting a member that is still used elsewhere is blocked and reported.
 */
export function mergeAccepted<T extends Rec>(owner: T, review: ReviewItem[], accepted: Set<string>): { merged: T; applied: number; blocked: ReviewItem[] } {
  const chosen = review.filter(item => accepted.has(item.key) && !item.noop);
  const deletes = chosen.filter(i => i.op.o === 'd');
  const rest = chosen.filter(i => i.op.o !== 'd');
  let merged = applyOps(owner, rest.map(i => i.op));
  const blocked: ReviewItem[] = [];
  let applied = rest.length;
  for (const item of deletes) {
    const op = item.op as { k: string; id: string };
    if (/member/i.test(op.k)) {
      const others = { ...(merged as Rec) }; delete others[op.k];
      if (JSON.stringify(others).includes(`"${op.id}"`)) { blocked.push(item); continue; }
    }
    merged = applyOps(merged, [item.op]); applied++;
  }
  return { merged, applied, blocked };
}

// ---------- encoding ----------
const enc = (x: unknown) => compressToEncodedURIComponent(JSON.stringify(x));
function dec(s: string): unknown { try { return JSON.parse(decompressFromEncodedURIComponent(s) || 'null'); } catch { return null; } }

export function encodeEditPackage(p: EditPackage): string { return enc(p); }
export function encodeUpdatePackage(p: UpdatePackage): string { return enc(p); }
export function decodeEditPackage(s: string): EditPackage | null {
  const p = dec(s) as EditPackage | null;
  return p && p.v === FORMAT && KINDS.includes(p.t) && typeof p.s === 'string' && typeof p.n === 'number' && isRec(p.d) && typeof p.d.id === 'string' ? p : null;
}
export function decodeUpdatePackage(s: string): UpdatePackage | null {
  const p = dec(s) as UpdatePackage | null;
  return p && p.v === FORMAT && KINDS.includes(p.t) && typeof p.s === 'string' && typeof p.u === 'string' && Array.isArray(p.c) ? p : null;
}
export const editLink = (p: EditPackage) => `${SHARE_ORIGIN}/s/e${encodeEditPackage(p)}`;
export const updateLink = (p: UpdatePackage) => `${SHARE_ORIGIN}/s/u${encodeUpdatePackage(p)}`;
export const fitsInLink = (url: string) => url.length <= MAX_LINK_LENGTH;

export interface KharchaFile { kharcha: 1; kind: 'edit' | 'update'; data: string }
export function buildKharchaFile(kind: 'edit' | 'update', p: EditPackage | UpdatePackage): string {
  return JSON.stringify({ kharcha: 1, kind, data: enc(p) } satisfies KharchaFile);
}
/** Turns a .kharcha file (or a pasted link) into the in-app path that opens it. */
export function pathFromImport(text: string): string | null {
  const trimmed = text.trim();
  const link = trimmed.match(/\/s\/([eu])([A-Za-z0-9+\-$_%]+)/);
  if (link) return `/s/${link[1]}${link[2]}`;
  try {
    const f = JSON.parse(trimmed) as KharchaFile;
    if (f?.kharcha === 1 && typeof f.data === 'string') {
      if (f.kind === 'edit' && decodeEditPackage(f.data)) return `/s/e${f.data}`;
      if (f.kind === 'update' && decodeUpdatePackage(f.data)) return `/s/u${f.data}`;
    }
  } catch { /* not a file */ }
  return null;
}
export function payloadFromPath(kind: 'e' | 'u', pathname: string): string | null {
  const m = pathname.match(/\/s\/([eu])(.+)$/);
  if (!m || m[1] !== kind) return null;
  try { return decodeURIComponent(m[2]); } catch { return m[2]; }
}
