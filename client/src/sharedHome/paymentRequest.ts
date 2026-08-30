import { compressData, decompressData } from '@/lib/compression';
import { copyToClipboard, shareLink } from '@/lib/shareLink';
import { isValidUpiId } from '@/lib/upi';
import { roundMoney } from './calculations';

export interface SharedHomePaymentRequest {
  homeName: string;
  payerName: string;
  payeeName: string;
  amount: number;
  reason: string;
  upiId?: string;
}

export interface SharedHomePaymentRequestLabels {
  heading: string;
  pay: string;
  amount: string;
  forLabel: string;
  whoPays: string;
  whoReceives: string;
  upiId: string;
  unavailable: string;
  footer: string;
}

interface CompactPaymentRequest {
  v: 1;
  h: string;
  f: string;
  t: string;
  a: number;
  r: string;
  u?: string;
}

export function normalizeSharedHomePaymentRequest(request: SharedHomePaymentRequest): SharedHomePaymentRequest {
  return {
    homeName: request.homeName.trim(),
    payerName: request.payerName.trim(),
    payeeName: request.payeeName.trim(),
    amount: roundMoney(Math.max(0, Number(request.amount) || 0)),
    reason: request.reason.trim() || 'Shared Home expenses',
    upiId: isValidUpiId(request.upiId) ? request.upiId!.trim() : undefined,
  };
}

export function generateSharedHomeUpiDeepLink(request: SharedHomePaymentRequest): string | null {
  const normalized = normalizeSharedHomePaymentRequest(request);
  if (!isValidUpiId(normalized.upiId) || normalized.amount <= 0) return null;
  const params = new URLSearchParams();
  params.set('pa', normalized.upiId!);
  params.set('pn', normalized.payeeName);
  params.set('am', normalized.amount.toFixed(2));
  params.set('cu', 'INR');
  params.set('tn', `Shared Home Settlement - ${normalized.reason}`);
  return `upi://pay?${params.toString()}`;
}

const defaultPaymentRequestLabels: SharedHomePaymentRequestLabels = {
  heading: 'KHARCHA PAYMENT REQUEST',
  pay: 'Pay',
  amount: 'Amount',
  forLabel: 'For',
  whoPays: 'Who pays',
  whoReceives: 'Who receives',
  upiId: 'UPI ID',
  unavailable: 'Not available',
  footer: 'Open the payment request in Kharcha to pay via UPI where supported.',
};

export function createSharedHomePaymentRequestMessage(request: SharedHomePaymentRequest, labels: Partial<SharedHomePaymentRequestLabels> = {}): string {
  const normalized = normalizeSharedHomePaymentRequest(request);
  const copy = { ...defaultPaymentRequestLabels, ...labels };
  return [
    copy.heading,
    '',
    `${copy.pay}: ${normalized.payeeName}`,
    `${copy.amount}: ₹${normalized.amount.toFixed(2)}`,
    `${copy.forLabel}: ${normalized.reason}`,
    `${copy.whoPays}: ${normalized.payerName}`,
    `${copy.whoReceives}: ${normalized.payeeName}`,
    normalized.upiId ? `${copy.upiId}: ${normalized.upiId}` : `${copy.upiId}: ${copy.unavailable}`,
    '',
    copy.footer,
  ].join('\n');
}

export function encodeSharedHomePaymentRequest(request: SharedHomePaymentRequest): string {
  const normalized = normalizeSharedHomePaymentRequest(request);
  const payload: CompactPaymentRequest = {
    v: 1,
    h: normalized.homeName,
    f: normalized.payerName,
    t: normalized.payeeName,
    a: normalized.amount,
    r: normalized.reason,
    u: normalized.upiId,
  };
  return compressData(JSON.stringify(payload));
}

export function decodeSharedHomePaymentRequest(encoded: string): SharedHomePaymentRequest | null {
  try {
    const json = decompressData(decodeURIComponent(encoded));
    const payload = JSON.parse(json) as CompactPaymentRequest;
    if (payload?.v !== 1 || typeof payload.h !== 'string' || typeof payload.f !== 'string' || typeof payload.t !== 'string' || typeof payload.r !== 'string') return null;
    const request = normalizeSharedHomePaymentRequest({ homeName: payload.h, payerName: payload.f, payeeName: payload.t, amount: payload.a, reason: payload.r, upiId: payload.u });
    return request.amount > 0 && request.payeeName.length > 0 ? request : null;
  } catch {
    return null;
  }
}

export function generateSharedHomePaymentRequestLink(request: SharedHomePaymentRequest): string {
  return `${window.location.origin}/shared-home-payment/${encodeSharedHomePaymentRequest(request)}`;
}

export function launchSharedHomeUpiPayment(request: SharedHomePaymentRequest): string | null {
  const deepLink = generateSharedHomeUpiDeepLink(request);
  if (!deepLink) return null;
  const anchor = document.createElement('a');
  anchor.href = deepLink;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  return deepLink;
}

export async function shareSharedHomePaymentRequest(request: SharedHomePaymentRequest, labels: Partial<SharedHomePaymentRequestLabels> = {}): Promise<'shared' | 'copied' | 'failed'> {
  const normalized = normalizeSharedHomePaymentRequest(request);
  const link = generateSharedHomePaymentRequestLink(normalized);
  const message = createSharedHomePaymentRequestMessage(normalized, labels);
  if (await shareLink(`Payment Request - ${normalized.payeeName}`, message, link)) return 'shared';
  return (await copyToClipboard(link)) ? 'copied' : 'failed';
}

export async function copySharedHomePaymentRequestLink(request: SharedHomePaymentRequest): Promise<boolean> {
  return copyToClipboard(generateSharedHomePaymentRequestLink(request));
}

export async function copySharedHomePaymentAmount(request: SharedHomePaymentRequest): Promise<boolean> {
  return copyToClipboard(normalizeSharedHomePaymentRequest(request).amount.toFixed(2));
}
