/** UPI helpers for Kharcha's offline-first payment flows. */
import { copyToClipboard, shareLink } from './shareLink';
import { buildScannedUpiPaymentLink } from './qrPayment';

export function isValidUpiId(upiId?: string): boolean {
  return Boolean(upiId && /^[a-zA-Z0-9._-]{2,}@[a-zA-Z0-9.-]{2,}$/.test(upiId.trim()));
}

export function isValidMobileNumber(phone?: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  return /^(?:91)?[6-9]\d{9}$/.test(digits);
}

export function normalizePaymentAddress(upiId?: string, mobileNumber?: string): string | undefined {
  if (isValidUpiId(upiId)) return upiId!.trim();
  if (isValidMobileNumber(mobileNumber)) {
    const digits = mobileNumber!.replace(/\D/g, '');
    return `${digits.length === 12 ? digits.slice(2) : digits}@upi`;
  }
  return undefined;
}

function createQuery(upiId: string | undefined, amount: number, payeeName: string, tripName: string, mobileNumber?: string): string {
  const params = new URLSearchParams();
  const paymentAddress = normalizePaymentAddress(upiId, mobileNumber);
  if (paymentAddress) params.set('pa', paymentAddress);
  params.set('pn', payeeName.trim());
  params.set('am', Math.max(0, amount).toFixed(2));
  params.set('tn', `Trip Settlement - ${tripName.trim()}`);
  return params.toString();
}

export function generateUpiDeepLink(upiId: string | undefined, amount: number, payeeName: string, tripName: string, mobileNumber?: string): string {
  return `upi://pay?${createQuery(upiId, amount, payeeName, tripName, mobileNumber)}`;
}

export const generateUpiPaymentLink = generateUpiDeepLink;

export function generateGenericUpiDeepLink(amount: number, tripName: string, note?: string): string {
  const params = new URLSearchParams();
  params.set('am', Math.max(0, amount).toFixed(2));
  params.set('cu', 'INR');
  params.set('tn', note?.trim() || `Trip Expense - ${tripName.trim()}`);
  return `upi://pay?${params.toString()}`;
}

export function launchGenericUpiPayment(amount: number, tripName: string, note?: string): string {
  const deepLink = generateGenericUpiDeepLink(amount, tripName, note); 
  const anchor = document.createElement('a');
  anchor.href = deepLink;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  return deepLink;
}

export function launchUpiPayment(upiId: string | undefined, amount: number, payeeName: string, tripName: string, mobileNumber?: string): string {
  const deepLink = generateUpiDeepLink(upiId, amount, payeeName, tripName, mobileNumber);
  const anchor = document.createElement('a');
  anchor.href = deepLink;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  return deepLink;
}

export const openUpiPayment = launchUpiPayment;

/** Opens the user's own UPI app so they can choose Scan/QR and enter the amount there. */
export function generateScannerUpiDeepLink(tripName: string, note?: string): string {
  const params = new URLSearchParams();
  params.set('cu', 'INR');
  params.set('tn', note?.trim() || `Trip Expense - ${tripName.trim()}`);
  return `upi://pay?${params.toString()}`;
}

export function launchScannerUpiApp(tripName: string, note?: string): string {
  const deepLink = generateScannerUpiDeepLink(tripName, note);
  const anchor = document.createElement('a');
  anchor.href = deepLink;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  return deepLink;
}

export function launchScannedUpiPayment(rawQrValue: string, amount: number, tripName: string, itemNote?: string): string | null {
  const payment = buildScannedUpiPaymentLink(rawQrValue, amount, tripName, itemNote);
  if (!payment) return null;

  const anchor = document.createElement('a');
  anchor.href = payment.deepLink;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  return payment.deepLink;
}

export function generatePaymentRequestMessage(memberName: string, amount: number, tripName: string, upiId?: string): string {
  return [
    'Trip Settlement Request',
    `Trip: ${tripName}`,
    `Who receives: ${memberName}`,
    `Amount: ₹${amount.toFixed(2)}`,
    'Please complete this payment.',
    isValidUpiId(upiId) ? `UPI ID: ${upiId!.trim()}` : '',
  ].filter(Boolean).join('\n');
}

export function generatePayerPayeePaymentMessage(payerName: string, payeeName: string, amount: number, tripName: string, upiId?: string): string {
  return [
    'Trip Settlement Request',
    `Trip: ${tripName}`,
    `Who pays: ${payerName}`,
    `Who receives: ${payeeName}`,
    `Amount: ₹${amount.toFixed(2)}`,
    'Please complete this payment.',
    isValidUpiId(upiId) ? `UPI ID: ${upiId!.trim()}` : '',
  ].filter(Boolean).join('\n');
}

export async function sharePaymentRequest(payerName: string, payeeName: string, amount: number, tripName: string, upiId?: string, mobileNumber?: string): Promise<'shared' | 'copied' | 'failed'> {
  const message = isValidUpiId(upiId)
    ? generatePayerPayeePaymentMessage(payerName, payeeName, amount, tripName, upiId)
    : [
        'Trip Settlement Request',
        `Trip: ${tripName}`,
        `Who pays: ${payerName}`,
        `Who receives: ${payeeName}`,
        `Amount: ₹${amount.toFixed(2)}`,
        mobileNumber ? `Payment contact: ${mobileNumber}` : '',
        'Please complete this payment.',
      ].filter(Boolean).join('\n');
  const paymentAddress = normalizePaymentAddress(upiId, mobileNumber);
  const link = paymentAddress ? generateUpiPaymentLink(paymentAddress, amount, payeeName, tripName) : '';
  const text = link ? `${message}\n\n${link}` : message;

  const didShare = await shareLink(
    `Payment Request - ${tripName}`,
    text,
    link || undefined,
  );
  if (didShare) return 'shared';

  return (await copyToClipboard(text)) ? 'copied' : 'failed';
}

export async function copyPaymentLink(upiId: string | undefined, amount: number, payeeName: string, tripName: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(generateUpiPaymentLink(upiId, amount, payeeName, tripName));
    return true;
  } catch {
    return false;
  }
}

export function getPaymentMethod(upiId?: string, mobileNumber?: string): 'upi' | 'mobile' | 'none' {
  if (isValidUpiId(upiId)) return 'upi';
  if (isValidMobileNumber(mobileNumber)) return 'mobile';
  return 'none';
}

export const validateUpiId = isValidUpiId;
export const validateMobileNumber = isValidMobileNumber;
export const generatePaymentLink = generateUpiPaymentLink;
export const generateShareMessage = generatePaymentRequestMessage;
export const getUpiUrl = generateUpiDeepLink;
export const openUpiApp = launchUpiPayment;

export function createPaymentShareText(payerName: string, payeeName: string, amount: number, tripName: string, upiId?: string, mobileNumber?: string): string {
  const message = isValidUpiId(upiId)
    ? generatePayerPayeePaymentMessage(payerName, payeeName, amount, tripName, upiId)
    : [
        'Trip Settlement Request',
        `Trip: ${tripName}`,
        `Who pays: ${payerName}`,
        `Who receives: ${payeeName}`,
        `Amount: ₹${amount.toFixed(2)}`,
        mobileNumber ? `Payment contact: ${mobileNumber}` : '',
        'Please complete this payment.',
      ].filter(Boolean).join('\n');
  const paymentAddress = normalizePaymentAddress(upiId, mobileNumber);
  const link = paymentAddress ? generateUpiPaymentLink(paymentAddress, amount, payeeName, tripName) : '';
  return link ? `${message}\n\n${link}` : message;
}

export function getPaymentCompletionNotice(): string {
  return 'UPI apps do not provide a reliable browser callback. Confirm payment manually after returning to Kharcha.';
}

export function supportsNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export function supportsClipboard(): boolean {
  return typeof navigator !== 'undefined' && Boolean(navigator.clipboard);
}

export function createScanPayLink(amount: number, payeeName: string, tripName: string, upiId?: string, mobileNumber?: string): string {
  return generateUpiDeepLink(upiId, amount, payeeName, tripName, mobileNumber);
}

export function createMobilePaymentMessage(payerName: string, payeeName: string, amount: number, tripName: string, mobileNumber?: string): string {
  return [
    'Trip Settlement Request',
    `Trip: ${tripName}`,
    `Who pays: ${payerName}`,
    `Who receives: ${payeeName}`,
    `Amount: ₹${amount.toFixed(2)}`,
    mobileNumber ? `Payment contact: ${mobileNumber}` : '',
    'Please complete this payment.',
  ].filter(Boolean).join('\n');
}

export function getPaymentDirection(payerName: string, payeeName: string): string {
  return `${payerName} pays ${payeeName}`;
}

export function createPaymentNote(tripName: string): string {
  return `Trip Settlement - ${tripName}`;
}

export function createTripShareLabel(tripName: string): string {
  return tripName.trim();
}

export function createQuickSplitHelperText(): string {
  return 'Choose equal split or enter custom amounts, then save the expense.';
}

export function createPaymentConfirmationText(): string {
  return 'Did you complete the payment?';
}

export function createScanPayHelperText(): string {
  return 'Use a supported QR scanner or open your default UPI app.';
}

export function createTripShareHelperText(): string {
  return 'Recipients see read-only trip details. The technical URL stays hidden.';
}
