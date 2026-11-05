import { describe, expect, it } from 'vitest';
import { matchOwnerForEdit, type OwnerLookups } from './ownerMatch';
import { decodeUpdatePackage, payloadFromPath, type EditPackage, type Snapshot } from './serverlessSync';

const base: Snapshot = { id: 'trip-1', name: 'Munnar', members: [{ id: 'm1', name: 'Amal' }], expenses: [{ id: 'e1', description: 'Hotel', amount: 4500 }] };
const lookups = (has = true): OwnerLookups => ({
  getShare: sid => (sid === 'sid1' ? { type: 'trip', contextId: 'trip-1', name: 'Munnar' } : undefined),
  getBase: (sid, ver) => (sid === 'sid1' && ver === 2 ? base : null),
  exists: (type, id) => has && type === 'trip' && id === 'trip-1',
});

describe('edit link opened on the owner device updates the existing item', () => {
  it('owner opening their own edit link opens the original, no new copy', () => {
    const pkg: EditPackage = { v: 1, t: 'trip', s: 'sid1', n: 2, m: 'Munnar', d: base };
    expect(matchOwnerForEdit(pkg, lookups())).toMatchObject({ kind: 'unchanged', contextId: 'trip-1' });
  });
  it('a recipient re-sharing their edited copy becomes an update to the same trip', () => {
    const edited = { ...base, id: 'copy-xyz', expenses: [{ id: 'e1', description: 'Hotel', amount: 5100 }, { id: 'e2', description: 'Boat', amount: 750 }] };
    const pkg: EditPackage = { v: 1, t: 'trip', s: 'recipient-sid', n: 1, m: 'Munnar', o: { s: 'sid1', n: 2 }, d: edited };
    const match = matchOwnerForEdit(pkg, lookups());
    expect(match.kind).toBe('update');
    if (match.kind !== 'update') return;
    expect(match.contextId).toBe('trip-1');
    const update = decodeUpdatePackage(payloadFromPath('u', match.path)!)!;
    expect(update).toMatchObject({ s: 'sid1', n: 2 });
    expect(update.c).toHaveLength(2);
    // Same edits give the same update id, so accepting twice is detected.
    expect(matchOwnerForEdit(pkg, lookups())).toEqual(match);
  });
  it('creates a copy only when there is no matching local item', () => {
    const pkg: EditPackage = { v: 1, t: 'trip', s: 'sid1', n: 2, m: 'Munnar', d: base };
    expect(matchOwnerForEdit(pkg, lookups(false)).kind).toBe('none');
    expect(matchOwnerForEdit({ ...pkg, s: 'other' }, lookups()).kind).toBe('none');
  });
});
