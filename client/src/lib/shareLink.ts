import { Trip } from '@/types';
import { compressData, decompressData, createMinimalTripData, restoreMinimalTripData } from './compression';

/** Encode trip data into a compact URL-safe payload. */
export function encodeTripData(trip: Trip): string {
  return compressData(JSON.stringify(createMinimalTripData(trip)));
}

/** Decode both current compact links and older Kharcha share links. */
export function decodeTripData(encoded: string): Trip | null {
  try {
    const jsonString = decompressData(decodeURIComponent(encoded));
    if (!jsonString) return null;
    const minimal = JSON.parse(jsonString);
    return restoreMinimalTripData(minimal, {
      id: `shared-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    });
  } catch (error) {
    console.error('Failed to decode trip data:', error);
    return null;
  }
}

/** Generate a shareable link. The raw URL is used internally only. */
export function generateShareLink(trip: Trip): string {
  const encoded = encodeTripData(trip);
  return `${window.location.origin}/share/${encoded}`;
}

/** Extract encoded data from the current /share/:payload route. */
export function getEncodedDataFromUrl(): string | null {
  const path = window.location.pathname;
  const match = path.match(/\/share\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Copy text to clipboard. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

type NativeShareBridge = {
  shareText?: (title: string, text: string, url?: string) => boolean;
};

function getNativeShareBridge(): NativeShareBridge | null {
  if (typeof window === 'undefined') return null;
  const bridge = (window as Window & { KharchaShare?: NativeShareBridge }).KharchaShare;
  return bridge && typeof bridge === 'object' ? bridge : null;
}

/** Share through the Android chooser first, then the browser Web Share API. */
export async function shareLink(title: string, text: string, url?: string): Promise<boolean> {
  const nativeBridge = getNativeShareBridge();
  if (nativeBridge && typeof nativeBridge.shareText === 'function') {
    try {
      if (nativeBridge.shareText(title, text, url)) return true;
    } catch (error) {
      console.error('Native share bridge failed:', error);
    }
  }

  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;

  const shareData: ShareData = {
    title,
    text,
    ...(url ? { url } : {}),
  };
  try {
    if (typeof navigator.canShare === 'function' && !navigator.canShare(shareData)) {
      return false;
    }
    await navigator.share(shareData);
    return true;
  } catch (error) {
    // AbortError means the user closed the chooser; the caller can keep the
    // URL hidden and offer copy fallback without showing a technical error.
    if ((error as DOMException)?.name !== 'AbortError') {
      console.error('Failed to share:', error);
    }
    return false;
  }
}

/**
 * Make an editable local copy of a shared snapshot. Editing the copy never
 * mutates the original shared URL or another person's local trip.
 */
export function createEditableTripCopy(trip: Trip): Trip {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const tripId = `copy-${suffix}`;
  const memberIdMap = new Map<string, string>();
  const members = trip.members.map((member, index) => {
    const nextId = `copy-member-${suffix}-${index}`;
    memberIdMap.set(member.id, nextId);
    return {
      ...member,
      id: nextId,
      joinedAt: Date.now(),
    };
  });

  const expenses = trip.expenses.map((expense, index) => {
    const splits: Record<string, number> = {};
    for (const [memberId, amount] of Object.entries(expense.splits || {})) {
      const nextMemberId = memberIdMap.get(memberId);
      if (nextMemberId) splits[nextMemberId] = amount;
    }

    return {
      ...expense,
      id: `copy-expense-${suffix}-${index}`,
      tripId,
      paidBy: memberIdMap.get(expense.paidBy) || '',
      splits,
      createdAt: Date.now(),
    };
  });

  return {
    ...trip,
    id: tripId,
    name: trip.name,
    members,
    expenses,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
