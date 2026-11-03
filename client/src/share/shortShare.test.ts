import { describe, expect, it } from 'vitest';
import { decodeTripData, encodeTripData, encodeTripDataCompact } from '@/lib/shareLink';
import { decodeFundSnapshot, encodeFundSnapshot } from './fundShare';
import { buildShortShareUrl, buildUpiPayLink, getShortSharePayload, SHARE_ORIGIN } from './origin';

const trip: any = {
  id: 't1', name: 'Goa Weekend Trip', description: 'Friends', startDate: 1714521600000, endDate: 1714694400000,
  createdAt: 0, updatedAt: 0,
  members: [{ id: 'a', name: 'Aarav', upiId: 'aarav@upi', joinedAt: 0 }, { id: 'b', name: 'Meera', joinedAt: 0 }, { id: 'c', name: 'Ravi', joinedAt: 0 }],
  expenses: [
    { id: 'e1', tripId: 't1', description: 'Hotel', amount: 3000, category: 'hotel', paidBy: 'a', date: 1714525200000, splits: { a: 1000, b: 1000, c: 1000 }, createdAt: 0 },
    { id: 'e2', tripId: 't1', description: 'Taxi', amount: 500, category: 'transport', paidBy: 'b', date: 1714611600000, splits: { a: 300, b: 200 }, createdAt: 0 },
    { id: 'e3', tripId: 't1', description: 'Snacks', amount: 100, category: 'food', paidBy: 'c', date: 1714611600000, splits: { b: 50, c: 50 }, createdAt: 0 },
  ],
};

describe('short share links', () => {
  it('always uses the public kharchasplit.in address with a short /s/ path', () => {
    expect(SHARE_ORIGIN).toBe('https://www.kharchasplit.in');
    expect(buildShortShareUrl('t', 'abc')).toBe('https://www.kharchasplit.in/s/tabc');
    expect(getShortSharePayload('t', '/s/tabc')).toBe('abc');
    expect(getShortSharePayload('f', '/s/tabc')).toBeNull();
  });

  it('round-trips a trip through the compact v3 payload, smaller than v2', () => {
    const compact = encodeTripDataCompact(trip);
    expect(compact.length).toBeLessThan(encodeTripData(trip).length);
    const restored = decodeTripData(compact)!;
    expect(restored.name).toBe('Goa Weekend Trip');
    expect(restored.members.map(m => m.name)).toEqual(['Aarav', 'Meera', 'Ravi']);
    expect(restored.members[0].upiId).toBe('aarav@upi');
    expect(restored.expenses[0].date).toBe(1714525200000);
    expect(Object.values(restored.expenses[0].splits)).toEqual([1000, 1000, 1000]);
    expect(Object.values(restored.expenses[1].splits)).toEqual([300, 200]);
    expect(Object.values(restored.expenses[2].splits)).toEqual([50, 50]);
    expect(restored.endDate).toBe(1714694400000);
  });

  it('still opens old v2 /share/ payloads', () => {
    expect(decodeTripData(encodeTripData(trip))!.expenses).toHaveLength(3);
  });

  it('round-trips a Group Fund snapshot with UPI ID', () => {
    const fund: any = {
      id: 'f', type: 'group_fund', name: 'Office Fund', purpose: 'Office', contributionType: 'fixed', defaultContributionAmount: 100,
      startingBalance: 50, createdAt: 1714521600000, updatedAt: 0, paymentConfig: { upiId: 'fund@upi' },
      members: [{ id: 'm1', name: 'A', isActive: true, createdAt: 0 }, { id: 'm2', name: 'B', isActive: false, createdAt: 0 }],
      contributions: [{ id: 'c', fundId: 'f', memberId: 'm1', amount: 100, method: 'UPI', date: 0, status: 'Paid', createdAt: 0, updatedAt: 0 }],
      expenses: [{ id: 'x', fundId: 'f', name: 'Tea', category: 'food', amount: 30, date: 1714608000000, status: 'active', createdAt: 0, updatedAt: 0 }],
    };
    const snap = decodeFundSnapshot(encodeFundSnapshot(fund))!;
    expect(snap.upiId).toBe('fund@upi');
    expect(snap.members).toEqual([{ name: 'A', paid: 100, active: true }, { name: 'B', paid: 0, active: false }]);
    expect(snap.expenses[0]).toMatchObject({ name: 'Tea', amount: 30, date: 1714608000000 });
  });

  it('builds UPI pay links', () => {
    expect(buildUpiPayLink('a@upi', 'Office Fund', 100)).toBe('upi://pay?pa=a%40upi&pn=Office%20Fund&cu=INR&am=100.00');
  });
});

describe('fund share budget', () => {
  it('round-trips budget and stays compatible with old links', async () => {
    const { encodeFundSnapshot, decodeFundSnapshot } = await import('./fundShare');
    const { compressToEncodedURIComponent } = await import('lz-string');
    const fund: any = { id: 'f', type: 'group_fund', name: 'Tea', purpose: 'Office', contributionType: 'fixed', defaultContributionAmount: 0, members: [], contributions: [], expenses: [], createdAt: 0, budgetAmount: 5000 };
    expect(decodeFundSnapshot(encodeFundSnapshot(fund))!.budgetAmount).toBe(5000);
    const old = compressToEncodedURIComponent(JSON.stringify([1, 'Tea', '', '', '', 0, 0, 0, [], []]));
    expect(decodeFundSnapshot(old)!.budgetAmount).toBeUndefined();
  });
});
