import { describe, expect, it, vi } from 'vitest';
import { createEditableTripCopy, decodeTripData, encodeTripData, shareLink } from './shareLink';
import type { Trip } from '@/types';

const trip: Trip = {
  id: 'trip-original',
  name: 'Goa Weekend Trip',
  description: 'Friends travel and shared expenses',
  startDate: 1714521600000,
  endDate: 1714694400000,
  createdAt: 1714521600000,
  updatedAt: 1714521600000,
  budget: { amount: 20000, warningThreshold: 0.8, createdAt: 1714521600000, updatedAt: 1714521600000 },
  members: [
    { id: 'm1', name: 'Aarav Sharma', mobileNumber: '9876543210', upiId: 'aarav@upi', joinedAt: 1714521600000 },
    { id: 'm2', name: 'Meera Nair', mobileNumber: '9123456780', upiId: 'meera@upi', joinedAt: 1714521600000 },
  ],
  expenses: [
    {
      id: 'e1',
      tripId: 'trip-original',
      description: 'Hotel booking for the whole group',
      amount: 4800,
      category: 'hotel',
      paidBy: 'm1',
      date: 1714521600000,
      splits: { m1: 2400, m2: 2400 },
      createdAt: 1714521600000,
    },
  ],
};

describe('shared trip links', () => {
  it('round-trips a trip through the compact compressed payload', () => {
    const encoded = encodeTripData(trip);
    const decoded = decodeTripData(encoded);

    expect(encoded.length).toBeGreaterThan(0);
    expect(decoded).not.toBeNull();
    expect(decoded?.name).toBe(trip.name);
    expect(decoded?.members.map(member => member.name)).toEqual(['Aarav Sharma', 'Meera Nair']);
    expect(decoded?.expenses[0]?.amount).toBe(4800);
    expect(decoded?.budget?.amount).toBe(20000);
    expect(decoded?.budget?.warningThreshold).toBe(0.8);
    expect(decoded?.expenses[0]?.paidBy).toBe(decoded?.members[0]?.id);
    expect(decoded?.expenses[0]?.splits[decoded?.members[1]?.id || '']).toBe(2400);
  });

  it('produces a shorter payload than the previous plain base64 approach', () => {
    const legacyPayload = {
      n: trip.name,
      d: trip.description,
      b: trip.budget,
      m: trip.members.map(member => ({ i: member.id, n: member.name })),
      e: trip.expenses.map(expense => ({
        i: expense.id,
        d: expense.description,
        a: expense.amount,
        c: expense.category,
        p: expense.paidBy,
        dt: expense.date,
        s: expense.splits,
      })),
    };
    const legacyBase64Length = Buffer.from(JSON.stringify(legacyPayload), 'utf8').toString('base64').length;

    expect(encodeTripData(trip).length).toBeLessThan(legacyBase64Length);
  });

  it('creates an isolated editable copy with remapped local ids', () => {
    const decoded = decodeTripData(encodeTripData(trip));
    if (!decoded) throw new Error('Trip failed to decode');

    const copy = createEditableTripCopy(decoded);
    copy.members[0]!.name = 'Edited Name';

    expect(copy.id).not.toBe(decoded.id);
    expect(copy.name).toBe(decoded.name);
    expect(copy.members[0]?.id).not.toBe(decoded.members[0]?.id);
    expect(copy.expenses[0]?.tripId).toBe(copy.id);
    expect(copy.expenses[0]?.paidBy).toBe(copy.members[0]?.id);
    expect(copy.expenses[0]?.splits[copy.members[1]?.id || '']).toBe(2400);
    expect(decoded.members[0]?.name).toBe('Aarav Sharma');
  });

  it('invokes the native share sheet with a URL and returns success', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share });

    await expect(shareLink('Goa Weekend Trip', 'View trip details', 'https://example.com/share/abc')).resolves.toBe(true);
    expect(share).toHaveBeenCalledWith({
      title: 'Goa Weekend Trip',
      text: 'View trip details',
      url: 'https://example.com/share/abc',
    });

    vi.unstubAllGlobals();
  });

  it('uses the Android native share bridge before the browser share API', async () => {
    const shareText = vi.fn().mockReturnValue(true);
    vi.stubGlobal('window', { KharchaShare: { shareText } });
    vi.stubGlobal('navigator', {});

    await expect(shareLink('Payment Request', 'Please pay ₹250', 'upi://pay?pa=person@upi')).resolves.toBe(true);
    expect(shareText).toHaveBeenCalledWith('Payment Request', 'Please pay ₹250', 'upi://pay?pa=person@upi');

    vi.unstubAllGlobals();
  });

  it('returns false when the native share sheet is unavailable for clipboard fallback', async () => {
    vi.stubGlobal('navigator', {});

    await expect(shareLink('Goa Weekend Trip', 'View trip details', 'https://example.com/share/abc')).resolves.toBe(false);

    vi.unstubAllGlobals();
  });
});
