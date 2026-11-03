/**
 * Single, minimal UPI URI builder used by every payment link and QR in Kharcha.
 *
 * Format (NPCI "UPI Linking Specs" order): upi://pay?pa=<vpa>&pn=<name>&am=<0.00>&cu=INR&tn=<note>
 * - pa is the raw VPA (lowercase, no spaces, "@" NOT percent-encoded – several apps fail on %40)
 * - pn/tn are reduced to safe characters and encoded with %20 (never "+", which apps show literally)
 * - no merchant-only params (mc, tr, tid, url, mode, orgid, sign, mid, msid, mtid) – for a personal
 *   VPA these make apps treat the request as an unverified merchant and decline it.
 */
export interface UpiLinkInput {
  upiId: string;
  payeeName?: string;
  amount?: number;
  note?: string;
}

const VPA_RE = /^[a-z0-9][a-z0-9._-]{0,255}@[a-z][a-z0-9.-]{1,63}$/;

export function cleanUpiId(value?: string): string {
  return (value ?? '').replace(/\s+/g, '').toLowerCase();
}

export function isValidVpa(value?: string): boolean {
  return VPA_RE.test(cleanUpiId(value));
}

/** True when the user typed only a phone number instead of a UPI ID (e.g. 9876543210). */
export function looksLikePhoneNumber(value?: string): boolean {
  const digits = (value ?? '').replace(/[\s()+-]/g, '');
  return /^(?:91|0)?[6-9]\d{9}$/.test(digits) && !(value ?? '').includes('@');
}

export type UpiIdCheck = { ok: true; upiId: string } | { ok: false; reason: 'empty' | 'phone' | 'invalid' };

export function checkUpiId(value?: string): UpiIdCheck {
  const upiId = cleanUpiId(value);
  if (!upiId) return { ok: false, reason: 'empty' };
  if (looksLikePhoneNumber(value)) return { ok: false, reason: 'phone' };
  return isValidVpa(upiId) ? { ok: true, upiId } : { ok: false, reason: 'invalid' };
}

export const UPI_ID_HELP = 'Enter a UPI ID like 9876543210@ybl or name@okaxis, not just a phone number.';

/** Keep letters, digits and spaces only; collapse whitespace; trim to max length. */
export function sanitizeUpiText(value: string | undefined, max: number): string {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
    .trim();
}

export function formatUpiAmount(amount?: number): string | undefined {
  if (amount === undefined || amount === null || !Number.isFinite(amount) || amount <= 0) return undefined;
  return (Math.round(amount * 100) / 100).toFixed(2);
}

const enc = (s: string) => encodeURIComponent(s);

/** Returns '' when the UPI ID is not a valid VPA, so callers never open a broken link. */
export function buildUpiUri({ upiId, payeeName, amount, note }: UpiLinkInput): string {
  const check = checkUpiId(upiId);
  if (!check.ok) return '';
  const parts = [`pa=${check.upiId}`];
  const pn = sanitizeUpiText(payeeName, 40);
  if (pn) parts.push(`pn=${enc(pn)}`);
  const am = formatUpiAmount(amount);
  if (am) parts.push(`am=${am}`);
  parts.push('cu=INR');
  const tn = sanitizeUpiText(note, 40);
  if (tn) parts.push(`tn=${enc(tn)}`);
  return `upi://pay?${parts.join('&')}`;
}

export function buildUpiQrImageUrl(upiUri: string, size = 180): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(upiUri)}`;
}
