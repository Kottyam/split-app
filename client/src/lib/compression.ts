import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';

/**
 * Compact URL-safe compression for self-contained trip links.
 * LZ-string is substantially smaller than plain base64 for repeated trip data.
 */
export function compressData(data: string): string {
  try {
    return compressToEncodedURIComponent(data);
  } catch (error) {
    console.error('Compression failed:', error);
    return '';
  }
}

/**
 * Decompress a current LZ-string payload, with a legacy base64 fallback so
 * links created before this update continue to open.
 */
export function decompressData(compressed: string): string {
  try {
    const decoded = decompressFromEncodedURIComponent(compressed);
    if (decoded) return decoded;
  } catch (error) {
    console.warn('LZ-string decompression failed; trying legacy decoder', error);
  }

  try {
    let encoded = compressed.replace(/-/g, '+').replace(/_/g, '/');
    const padding = 4 - (encoded.length % 4);
    if (padding !== 4) encoded += '='.repeat(padding);
    return decodeURIComponent(escape(atob(encoded)));
  } catch (error) {
    console.error('Legacy decompression failed:', error);
    return '';
  }
}

/**
 * Version 2 compact payload. Member ids are replaced by array indexes and
 * expense ids are regenerated while restoring, because shared snapshots do
 * not need to preserve local ids. Optional contact/payment fields are kept
 * only when they exist so normal trips remain as short as possible.
 */
export function createMinimalTripData(trip: any) {
  const members = Array.isArray(trip.members) ? trip.members : [];
  const memberIndex = new Map<string, number>(members.map((member: any, index: number) => [member.id, index]));

  return {
    v: 2,
    n: trip.name || '',
    d: trip.description || '',
    sd: trip.startDate || 0,
    ed: trip.endDate || 0,
    m: members.map((member: any) => [
      member.name || '',
      member.mobileNumber || '',
      member.upiId || '',
    ]),
    b: trip.budget || undefined,
    e: (Array.isArray(trip.expenses) ? trip.expenses : []).map((expense: any) => {
      const payerIndex = memberIndex.get(expense.paidBy);
      const splitEntries = Object.entries(expense.splits || [])
        .map(([memberId, amount]) => {
          const index = memberIndex.get(memberId);
          return index === undefined ? null : [index, amount];
        })
        .filter(Boolean);

      return [
        expense.description || '',
        expense.amount || 0,
        expense.category || 'other',
        payerIndex === undefined ? -1 : payerIndex,
        expense.date || 0,
        splitEntries,
      ];
    }),
  };
}

/**
 * Restore a compact payload into the Trip shape used by the app.
 * The legacy object-shaped payload remains supported for old shared links.
 */
export function restoreMinimalTripData(minimal: any, trip: any) {
  const sharedTripId = trip.id;

  if (minimal?.v === 2 && Array.isArray(minimal.m) && Array.isArray(minimal.e)) {
    const members = minimal.m.map((member: any[], index: number) => ({
      id: `shared-member-${index}`,
      name: member[0] || '',
      mobileNumber: member[1] || undefined,
      upiId: member[2] || undefined,
      joinedAt: Date.now(),
    }));

    const expenses = minimal.e.map((expense: any[], index: number) => {
      const splits: Record<string, number> = {};
      for (const entry of Array.isArray(expense[5]) ? expense[5] : []) {
        const [memberIndex, amount] = entry;
        if (members[memberIndex]) splits[members[memberIndex].id] = Number(amount) || 0;
      }

      return {
        id: `shared-expense-${index}`,
        tripId: sharedTripId,
        description: expense[0] || '',
        amount: Number(expense[1]) || 0,
        category: expense[2] || 'other',
        paidBy: members[expense[3]]?.id || '',
        date: Number(expense[4]) || 0,
        splits,
        createdAt: Date.now(),
      };
    });

    return {
      id: sharedTripId,
      name: minimal.n || 'Shared Trip',
      description: minimal.d || '',
      members,
      expenses,
      startDate: Number(minimal.sd) || 0,
      endDate: Number(minimal.ed) || 0,
      budget: minimal.b,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  return {
    id: sharedTripId,
    name: minimal.n || 'Shared Trip',
    description: minimal.d || '',
    members: (minimal.m || []).map((member: any) => ({
      id: member.i,
      name: member.n,
      mobileNumber: member.mb || undefined,
      upiId: member.u || undefined,
      joinedAt: Date.now(),
    })),
    expenses: (minimal.e || []).map((expense: any) => ({
      id: expense.i,
      tripId: sharedTripId,
      description: expense.d,
      amount: expense.a,
      category: expense.c,
      paidBy: expense.p,
      date: expense.dt,
      splits: expense.s,
      createdAt: Date.now(),
    })),
    startDate: minimal.sd || 0,
    endDate: minimal.ed || 0,
    budget: minimal.b,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
