import type { Trip } from '@/types';
import type { SharedHome } from '@/sharedHome/types';
import type { GroupFund } from '@/groupFund/types';

export type SyncContextType = 'trip' | 'shared_home' | 'group_fund';
export type SyncSnapshot = Trip | SharedHome | GroupFund;

const OWNER_KEYS_STORAGE = 'kharcha_edit_sync_owner_keys';
const SYNC_HISTORY_STORAGE = 'kharcha_edit_sync_history';

export type SyncHistoryRecord = {
  id: string;
  contextType: SyncContextType;
  contextId: string;
  contextName: string;
  version: number;
  syncedAt: number;
  summary: ReturnType<typeof summarizeChanges>;
  beforeSnapshotJson: string;
  afterSnapshotJson: string;
  status: 'synced' | 'undone';
};

function readHistory(): SyncHistoryRecord[] {
  try {
    const value = JSON.parse(localStorage.getItem(SYNC_HISTORY_STORAGE) ?? '[]');
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

export function getSyncHistory(contextType?: SyncContextType, contextId?: string): SyncHistoryRecord[] {
  const records = readHistory().sort((a, b) => b.syncedAt - a.syncedAt);
  return contextType && contextId ? records.filter(item => item.contextType === contextType && item.contextId === contextId) : records;
}

export function addSyncHistory(input: Omit<SyncHistoryRecord, 'id' | 'status'>): SyncHistoryRecord {
  const record: SyncHistoryRecord = { ...input, id: `${input.contextType}-${input.contextId}-${input.version}-${input.syncedAt}`, status: 'synced' };
  const existing = readHistory().filter(item => item.id !== record.id);
  try { localStorage.setItem(SYNC_HISTORY_STORAGE, JSON.stringify([record, ...existing].slice(0, 100))); } catch { /* local history is best effort */ }
  return record;
}

export function markSyncHistoryUndone(id: string): void {
  const records = readHistory().map(item => item.id === id ? { ...item, status: 'undone' as const } : item);
  try { localStorage.setItem(SYNC_HISTORY_STORAGE, JSON.stringify(records)); } catch { /* local history is best effort */ }
}

export function nextSyncVersion(contextType: SyncContextType, contextId: string): number {
  return Math.max(0, ...getSyncHistory(contextType, contextId).map(item => item.version)) + 1;
}

export function getOrCreateOwnerKey(contextType: SyncContextType, contextId: string): string {
  const key = `${contextType}:${contextId}`;
  try {
    const parsed = JSON.parse(localStorage.getItem(OWNER_KEYS_STORAGE) ?? '{}') as Record<string, string>;
    if (parsed[key]) return parsed[key];
    const next = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
    localStorage.setItem(OWNER_KEYS_STORAGE, JSON.stringify({ ...parsed, [key]: next }));
    return next;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }
}

export function serializeSnapshot(snapshot: SyncSnapshot): string {
  return JSON.stringify(snapshot);
}

export function parseSnapshot<T extends SyncSnapshot>(json: string): T | null {
  try {
    const value = JSON.parse(json) as T;
    return value && typeof value === 'object' ? value : null;
  } catch {
    return null;
  }
}

export function cloneSnapshot<T extends SyncSnapshot>(snapshot: T): T {
  return JSON.parse(JSON.stringify(snapshot)) as T;
}

export function normalizeSnapshotContextId<T extends SyncSnapshot>(snapshot: T, contextId: string): T {
  const normalized = cloneSnapshot(snapshot) as T & { id: string };
  normalized.id = contextId;
  return normalized;
}

type ChangeEntry = { kind: 'added' | 'removed' | 'changed'; path: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function diffValues(base: unknown, next: unknown, path: string, changes: ChangeEntry[]) {
  if (Object.is(base, next)) return;
  if (Array.isArray(base) && Array.isArray(next)) {
    if (base.length === 0 && next.length === 0) return;
    const baseById = new Map(base.filter(isRecord).map(item => [String(item.id), item]));
    const nextById = new Map(next.filter(isRecord).map(item => [String(item.id), item]));
    if (baseById.size === base.length && nextById.size === next.length && Array.from(baseById.keys()).some(id => id !== 'undefined')) {
      for (const [id, item] of Array.from(nextById.entries())) {
        if (!baseById.has(id)) changes.push({ kind: 'added', path: `${path}/${id}` });
        else diffValues(baseById.get(id), item, `${path}/${id}`, changes);
      }
      for (const id of Array.from(baseById.keys())) if (!nextById.has(id)) changes.push({ kind: 'removed', path: `${path}/${id}` });
      return;
    }
    if (JSON.stringify(base) === JSON.stringify(next)) return;
    changes.push({ kind: 'changed', path });
    return;
  }
  if (isRecord(base) && isRecord(next)) {
    const keys = new Set([...Object.keys(base), ...Object.keys(next)]);
    for (const key of Array.from(keys)) diffValues(base[key], next[key], `${path}/${key}`, changes);
    return;
  }
  changes.push({ kind: 'changed', path });
}

export function summarizeChanges(base: SyncSnapshot, edited: SyncSnapshot) {
  const changes: ChangeEntry[] = [];
  diffValues(base, edited, '', changes);
  return {
    total: changes.length,
    added: changes.filter(change => change.kind === 'added').length,
    removed: changes.filter(change => change.kind === 'removed').length,
    changed: changes.filter(change => change.kind === 'changed').length,
    paths: changes.slice(0, 100),
  };
}

export type MergeConflict = { path: string; ownerValue: unknown; editedValue: unknown };

function mergeThreeWay(base: unknown, owner: unknown, edited: unknown, path: string, conflicts: MergeConflict[]): unknown {
  if (Object.is(owner, base)) return edited;
  if (Object.is(edited, base) || Object.is(owner, edited)) return owner;
  if (Array.isArray(base) && Array.isArray(owner) && Array.isArray(edited)) {
    const keyed = [...base, ...owner, ...edited].every(item => isRecord(item) && 'id' in item);
    if (keyed) {
      const ids = Array.from(new Set([...base, ...owner, ...edited].map(item => String((item as Record<string, unknown>).id))));
      const baseMap = new Map(base.map(item => [String((item as Record<string, unknown>).id), item]));
      const ownerMap = new Map(owner.map(item => [String((item as Record<string, unknown>).id), item]));
      const editedMap = new Map(edited.map(item => [String((item as Record<string, unknown>).id), item]));
      return ids.flatMap(id => {
        const merged = mergeThreeWay(baseMap.get(id), ownerMap.get(id), editedMap.get(id), `${path}/${id}`, conflicts);
        return merged === undefined ? [] : [merged];
      });
    }
  }
  if (isRecord(base) && isRecord(owner) && isRecord(edited)) {
    const keys = new Set([...Object.keys(base), ...Object.keys(owner), ...Object.keys(edited)]);
    const result: Record<string, unknown> = {};
    for (const key of Array.from(keys)) {
      const merged = mergeThreeWay(base[key], owner[key], edited[key], `${path}/${key}`, conflicts);
      if (merged !== undefined) result[key] = merged;
    }
    return result;
  }
  conflicts.push({ path, ownerValue: owner, editedValue: edited });
  return owner;
}

export function mergeSnapshots<T extends SyncSnapshot>(base: T, owner: T, edited: T) {
  const conflicts: MergeConflict[] = [];
  const merged = mergeThreeWay(base, owner, edited, '', conflicts) as T;
  return { merged, conflicts };
}
