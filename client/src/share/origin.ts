import { buildUpiUri } from '@/lib/upiLink';
/** Public web address used for every shared link, so links made inside the Android app open in any browser. */
export const SHARE_ORIGIN = 'https://www.kharchasplit.in';

export function buildShortShareUrl(kind: 't' | 'f', payload: string): string {
  return `${SHARE_ORIGIN}/s/${kind}${payload}`;
}

/** Read the payload after /s/<kind> for the current location. */
export function getShortSharePayload(kind: 't' | 'f', pathname: string = typeof window === 'undefined' ? '' : window.location.pathname): string | null {
  const match = pathname.match(/\/s\/([tf])(.+)$/);
  if (!match || match[1] !== kind) return null;
  try { return decodeURIComponent(match[2]); } catch { return match[2]; }
}

export function buildUpiPayLink(upiId: string, payeeName: string, amount?: number, note?: string): string {
  return buildUpiUri({ upiId, payeeName, amount, note });
}

export function buildUpiQrUrl(upiLink: string, size = 180): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(upiLink)}`;
}
