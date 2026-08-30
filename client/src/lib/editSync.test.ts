import { describe, expect, it } from 'vitest';
import { cloneSnapshot, mergeSnapshots, normalizeSnapshotContextId, parseSnapshot, serializeSnapshot, summarizeChanges } from './editSync';

describe('Edit & Sync snapshots', () => {
  const base = { id: 'trip-1', name: 'Goa', members: [{ id: 'm1', name: 'A' }], expenses: [] } as any;

  it('deep clones one context without sharing mutable references', () => {
    const copy = cloneSnapshot(base);
    copy.members[0].name = 'B';
    expect(base.members[0].name).toBe('A');
  });

  it('summarizes additions and changes without mixing unrelated contexts', () => {
    const edited = { ...base, members: [...base.members, { id: 'm2', name: 'C' }], name: 'Goa 2026' };
    const summary = summarizeChanges(base, edited);
    expect(summary.added).toBe(1);
    expect(summary.changed).toBe(1);
    expect(summary.paths.some(item => item.path.includes('/members/m2'))).toBe(true);
  });

  it('normalizes an editable copy back to the original context identity', () => {
    const normalized = normalizeSnapshotContextId({ ...base, id: 'copy-trip-1' }, 'trip-1');
    expect(normalized.id).toBe('trip-1');
    expect(normalized.name).toBe(base.name);
  });

  it('does not report identical empty collections as changes', () => {
    const emptyBase = { ...base, members: [], expenses: [] };
    const edited = { ...emptyBase, id: 'edit-copy-trip-1' };
    const normalized = { ...edited, id: emptyBase.id };
    expect(summarizeChanges(emptyBase, normalized).total).toBe(0);
  });

  it('round-trips the submitted document details without changing context identity', () => {
    const edited = { ...base, name: 'Goa 2026', expenses: [{ id: 'e1', amount: 1200, description: 'Hotel' }] };
    const roundTrip = parseSnapshot(serializeSnapshot(edited));
    expect(roundTrip).toEqual(edited);
    expect(roundTrip?.id).toBe('trip-1');
    expect((roundTrip as any)?.expenses[0]).toEqual({ id: 'e1', amount: 1200, description: 'Hotel' });
  });

  it('applies recipient changes while preserving unrelated owner changes', () => {
    const owner = { ...base, description: 'Owner note' };
    const recipient = { ...base, name: 'Goa 2026' };
    const result = mergeSnapshots(base, owner, recipient);
    expect(result.conflicts).toHaveLength(0);
    expect(result.merged).toMatchObject({ id: 'trip-1', name: 'Goa 2026', description: 'Owner note' });
  });

  it('merges identical additions without a false conflict', () => {
    const member = { id: 'm2', name: 'Same Add' };
    const baseSnapshot = { ...base, members: [] } as any;
    const ownerSnapshot = { ...baseSnapshot, members: [member] } as any;
    const editedSnapshot = { ...baseSnapshot, members: [member] } as any;
    const result = mergeSnapshots(baseSnapshot, ownerSnapshot, editedSnapshot);
    expect(result.conflicts).toHaveLength(0);
    expect(result.merged.members).toEqual([member]);
  });

  it('keeps owner-only changes and reports recipient conflicts', () => {
    const owner = { ...base, name: 'Goa Owner' };
    const recipient = { ...base, name: 'Goa Recipient' };
    const result = mergeSnapshots(base, owner, recipient);
    expect(result.conflicts.some(conflict => conflict.path === '/name')).toBe(true);
    expect(result.merged.name).toBe('Goa Owner');
  });
});
