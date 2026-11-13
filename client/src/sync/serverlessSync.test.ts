import { describe, expect, it } from 'vitest';
import { applyOps, buildKharchaFile, buildReview, decodeEditPackage, decodeUpdatePackage, diffSnapshots, editLink, encodeEditPackage, encodeUpdatePackage, fitsInLink, mergeAccepted, normalizeSnapshot, pathFromImport, payloadFromPath, updateLink, type EditPackage, type UpdatePackage } from './serverlessSync';

const base = {
  id: 't1', name: 'Munnar Trip', createdAt: 1, updatedAt: 1,
  members: [{ id: 'm1', name: 'Amal' }, { id: 'm2', name: 'Rahul' }, { id: 'm3', name: 'Anu' }],
  expenses: [
    { id: 'e1', description: 'Hotel', amount: 4500, paidBy: 'm1', splitBetween: ['m1', 'm2', 'm3'], createdAt: 1 },
    { id: 'e2', description: 'Taxi', amount: 900, paidBy: 'm2', splitBetween: ['m1', 'm2'], createdAt: 2 },
  ],
};
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const accAll = (r: ReturnType<typeof buildReview>) => new Set(r.map(i => i.key));

describe('serverless sync encode/decode', () => {
  it('round-trips edit and update packages through links', () => {
    const e: EditPackage = { v: 1, t: 'trip', s: 'sid1', n: 2, m: 'Munnar Trip', f: 'Amal', d: base };
    const url = editLink(e);
    expect(url).toMatch(/^https:\/\/www\.kharchasplit\.in\/s\/e#/);
    const parsed = new URL(url);
    expect(decodeEditPackage(payloadFromPath('e', parsed.pathname, parsed.hash)!)).toEqual(e);
    const u: UpdatePackage = { v: 1, t: 'trip', s: 'sid1', n: 2, u: 'u1', m: 'Munnar Trip', c: [{ k: 'expenses', o: 'd', id: 'e2' }] };
    const updateUrl = new URL(updateLink(u));
    expect(decodeUpdatePackage(payloadFromPath('u', updateUrl.pathname, updateUrl.hash)!)).toEqual(u);
    // Older links kept the payload in the path; they must still open.
    expect(decodeEditPackage(payloadFromPath('e', `/s/e${encodeEditPackage(e)}`)!)).toEqual(e);
  });
  it('rejects garbage and wrong kinds', () => {
    expect(decodeEditPackage('nonsense')).toBeNull();
    expect(decodeUpdatePackage(encodeEditPackage({ v: 1, t: 'trip', s: 's', n: 1, m: 'x', d: base }))).toBeNull();
    expect(decodeEditPackage(encodeUpdatePackage({ v: 1, t: 'trip', s: 's', n: 1, u: 'u', m: 'x', c: [] }))).toBeNull();
    expect(payloadFromPath('e', '/s/tabc')).toBeNull();
  });
  it('opens .kharcha files and pasted links', () => {
    const e: EditPackage = { v: 1, t: 'group_fund', s: 's', n: 1, m: 'Fund', d: { id: 'f1', members: [] } };
    expect(pathFromImport(buildKharchaFile('edit', e))).toBe(`/s/e${encodeEditPackage(e)}`);
    expect(pathFromImport(`see ${editLink(e)}`)).toBe(`/s/e${encodeEditPackage(e)}`);
    expect(pathFromImport(`https://www.kharchasplit.in/s/e${encodeEditPackage(e)}`)).toBe(`/s/e${encodeEditPackage(e)}`);
    expect(pathFromImport('{"hello":1}')).toBeNull();
  });
  it('keeps big Group Fund edit links openable: the payload never goes into the server request path', () => {
    const members = Array.from({ length: 60 }, (_, i) => ({ id: `m${i}`, name: `Member ${i}`, isActive: true, createdAt: 1700000000000 + i }));
    const contributions = members.flatMap((m, i) => Array.from({ length: 12 }, (_, k) => ({ id: `c${i}-${k}`, fundId: 'f1', memberId: m.id, amount: 500, method: 'UPI', date: 1700000000000 + k * 2592000000, status: 'Paid', createdAt: 1700000000000 })));
    const fund = { id: 'f1', name: 'Office Onam Fund', members, contributions, expenses: [] };
    const e: EditPackage = { v: 1, t: 'group_fund', s: 's', n: 1, m: fund.name, d: fund };
    const url = new URL(editLink(e));
    // GitHub Pages answers "414 URI Too Long" above ~8 KB of request path; the fragment is not sent.
    expect(url.href.length).toBeGreaterThan(8192);
    expect((url.pathname + url.search).length).toBeLessThan(16);
    expect(decodeEditPackage(payloadFromPath('e', url.pathname, url.hash)!)?.d.id).toBe('f1');
    expect(pathFromImport(url.href)).toBe(`/s/e${encodeEditPackage(e)}`);
  });
  it('flags long links so the file fallback is used', () => {
    const big = { ...base, expenses: Array.from({ length: 300 }, (_, i) => ({ id: `x${i}`, description: `Expense number ${i} ${Math.random()}`, amount: i })) };
    expect(fitsInLink(editLink({ v: 1, t: 'trip', s: 's', n: 1, m: 'big', d: big }))).toBe(false);
    expect(fitsInLink(updateLink({ v: 1, t: 'trip', s: 's', n: 1, u: 'u', m: 'x', c: [{ k: 'expenses', o: 'd', id: 'e1' }] }))).toBe(true);
  });
});

describe('normalisation', () => {
  it('adds missing ids and updatedAt without changing existing ids', () => {
    const n = normalizeSnapshot({ id: 't', members: [{ id: 'm1' }, { name: 'X' }], expenses: [{ id: 'e1', createdAt: 5 }] } as any);
    expect(n.members[0].id).toBe('m1');
    expect(typeof n.members[1].id).toBe('string');
    expect(n.expenses[0].updatedAt).toBe(5);
  });
});

describe('diff', () => {
  it('lists added, edited, deleted items and field changes only', () => {
    const edited = clone(base);
    edited.name = 'Munnar 2026';
    edited.expenses[0].amount = 4800;
    edited.expenses.splice(1, 1);
    edited.expenses.push({ id: 'e3', description: 'Food', amount: 600, paidBy: 'm3', splitBetween: ['m3'], createdAt: 3 });
    edited.members.push({ id: 'm4', name: 'Jo' });
    const ops = diffSnapshots(base, edited);
    expect(ops).toEqual(expect.arrayContaining([
      { k: 'name', o: 'f', v: 'Munnar 2026' },
      expect.objectContaining({ k: 'expenses', o: 'e', id: 'e1' }),
      { k: 'expenses', o: 'd', id: 'e2' },
      expect.objectContaining({ k: 'expenses', o: 'a', id: 'e3' }),
      expect.objectContaining({ k: 'members', o: 'a', id: 'm4' }),
    ]));
    expect(ops).toHaveLength(5);
    expect(applyOps(base, ops)).toEqual(edited);
    expect(diffSnapshots(base, clone(base))).toEqual([]);
  });
});

describe('merge and conflicts', () => {
  it('keeps owner-only changes and applies accepted recipient changes', () => {
    const owner = clone(base); owner.expenses[1].amount = 1000; // owner edits taxi
    const edited = clone(base); edited.expenses[0].amount = 4800; // recipient edits hotel
    const review = buildReview(base, owner, diffSnapshots(base, edited));
    expect(review.every(i => !i.conflict)).toBe(true);
    const { merged } = mergeAccepted(owner, review, accAll(review));
    expect(merged.expenses.find(e => e.id === 'e1')!.amount).toBe(4800);
    expect(merged.expenses.find(e => e.id === 'e2')!.amount).toBe(1000);
  });
  it('rejected items leave owner data unchanged', () => {
    const edited = clone(base); edited.expenses[0].amount = 1;
    const review = buildReview(base, base, diffSnapshots(base, edited));
    expect(mergeAccepted(base, review, new Set()).merged).toEqual(base);
  });
  it('detects both-edited and edit-vs-delete conflicts; accept = theirs', () => {
    const owner = clone(base); owner.expenses[0].amount = 5000; owner.expenses.splice(1, 1);
    const edited = clone(base); edited.expenses[0].amount = 4800; edited.expenses[1].amount = 950;
    const review = buildReview(base, owner, diffSnapshots(base, edited));
    expect(review.map(i => [i.op.o, i.conflict, i.conflictReason])).toEqual([['e', true, 'owner-edited'], ['e', true, 'owner-deleted']]);
    const keepMine = mergeAccepted(owner, review, new Set()).merged;
    expect(keepMine).toEqual(owner);
    const theirs = mergeAccepted(owner, review, accAll(review)).merged;
    expect(theirs.expenses.map(e => [e.id, e.amount])).toEqual([['e1', 4800], ['e2', 950]]);
  });
  it('flags deleting something the owner edited', () => {
    const owner = clone(base); owner.expenses[1].amount = 1;
    const edited = clone(base); edited.expenses.splice(1, 1);
    const [item] = buildReview(base, owner, diffSnapshots(base, edited));
    expect(item.conflict).toBe(true);
  });
  it('blocks deleting a member still used in expenses', () => {
    const edited = clone(base); edited.members = edited.members.filter(m => m.id !== 'm3');
    const review = buildReview(base, base, diffSnapshots(base, edited));
    const { merged, blocked } = mergeAccepted(base, review, accAll(review));
    expect(blocked).toHaveLength(1);
    expect(merged.members).toHaveLength(3);
  });
  it('treats duplicate or already-applied changes as no-ops', () => {
    const edited = clone(base); edited.expenses.push({ id: 'e3', description: 'Food', amount: 600, paidBy: 'm3', splitBetween: ['m3'], createdAt: 3 });
    const ops = diffSnapshots(base, edited);
    const once = mergeAccepted(base, buildReview(base, base, ops), accAll(buildReview(base, base, ops))).merged;
    const again = buildReview(base, once, ops);
    expect(again.every(i => i.noop)).toBe(true);
    expect(mergeAccepted(once, again, accAll(again)).merged).toEqual(once);
    expect(once.expenses.filter(e => e.id === 'e3')).toHaveLength(1);
  });
});
