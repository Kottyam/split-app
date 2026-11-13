import { buildUpiUri } from '@/lib/upiLink';
/** Public web address used for every shared link, so links made inside the Android app open in any browser. */
export const SHARE_ORIGIN = 'https://www.kharchasplit.in';

export type ShareKind = 't' | 'f' | 'e' | 'u';

/**
 * Public share link. The payload goes after `#` so it never reaches the web
 * server: GitHub Pages rejects request paths over ~8 KB with "414 URI Too Long",
 * which made big Group Fund / trip links open to an error page. Fragments are
 * kept by browsers, chat apps and Custom Tabs, and still work with no backend.
 */
export function buildShortShareUrl(kind: ShareKind, payload: string): string {
  return `${SHARE_ORIGIN}/s/${kind}#${payload}`;
}

function safeDecode(value: string): string {
  try { return decodeURIComponent(value); } catch { return value; }
}

/**
 * Read a share payload for /s/<kind>. Supports the current `/s/<kind>#<payload>`
 * links, older `/s/<kind><payload>` links, and in-app paths.
 */
export function readSharePayload(kind: ShareKind, pathname: string, hash = ''): string | null {
  const match = pathname.match(/\/s\/([tfeu])([^/]*)\/?$/);
  if (!match || match[1] !== kind) return null;
  const raw = match[2] || hash.replace(/^#/, '');
  const payload = safeDecode(raw).trim();
  return payload ? payload : null;
}

/** Read the payload after /s/<kind> for the current location. */
export function getShortSharePayload(kind: 't' | 'f', pathname: string = typeof window === 'undefined' ? '' : window.location.pathname, hash: string = typeof window === 'undefined' ? '' : window.location.hash): string | null {
  return readSharePayload(kind, pathname, hash);
}

export function buildUpiPayLink(upiId: string, payeeName: string, amount?: number, note?: string): string {
  return buildUpiUri({ upiId, payeeName, amount, note });
}

export function buildUpiQrUrl(upiLink: string, size = 180): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(upiLink)}`;
}
