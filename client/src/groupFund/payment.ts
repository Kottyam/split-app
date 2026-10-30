import { copyToClipboard, shareLink } from '@/lib/shareLink';

export interface GroupFundPaymentRequest {
  fundName: string;
  memberName: string;
  amount: number;
  upiId?: string;
  note?: string;
}

export interface GroupFundThankYouRequest {
  fundName: string;
  memberName: string;
  amount: number;
  period: string;
  message?: string;
  title?: string;
}

export interface GroupFundWhatsAppPaymentRequest extends GroupFundPaymentRequest {
  period: string;
  mobileNumber?: string;
  confirmationMessage?: string;
  qrCodeUrl?: string;
}

export interface GroupFundWhatsAppReminderRequest {
  fundName: string;
  memberName: string;
  period: string;
  mobileNumber?: string;
  message: string;
}

/** Normalize a stored member number for the official wa.me deep-link format. */
export function normalizeWhatsAppNumber(input?: string): string | undefined {
  const raw = (input ?? '').trim();
  if (!raw) return undefined;
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits.length >= 11 && digits.length <= 15 ? digits : undefined;
}

/** Basic UPI VPA validation; never silently substitute a dummy payee address. */
export function isValidGroupFundUpiId(value?: string): boolean {
  const upiId = (value ?? '').trim();
  return /^[A-Za-z0-9._-]{2,256}@[A-Za-z0-9.-]{2,64}$/.test(upiId);
}

export function generateWhatsAppMessageUrl(mobileNumber: string | undefined, message: string): string | undefined {
  const recipient = normalizeWhatsAppNumber(mobileNumber);
  if (!recipient) return undefined;
  return `https://wa.me/${recipient}?text=${encodeURIComponent(message)}`;
}

export function generateGroupFundUpiDeepLink(req: GroupFundPaymentRequest): string {
  if (!isValidGroupFundUpiId(req.upiId) || !Number.isFinite(req.amount) || req.amount <= 0) return '';
  const params = new URLSearchParams({
    pa: req.upiId!.trim(),
    pn: req.fundName.trim().slice(0, 50),
    am: req.amount.toFixed(2),
    cu: 'INR',
    tn: (req.note || `Contribution to ${req.fundName} - ${req.memberName}`).slice(0, 80),
  });
  return `upi://pay?${params.toString()}`;
}

export async function shareGroupFundPaymentRequest(req: GroupFundPaymentRequest): Promise<'shared' | 'copied' | 'failed'> {
  const link = generateGroupFundUpiDeepLink(req);
  if (!link) return 'failed';
  const text = `Group Fund Contribution Request\nFund: ${req.fundName}\nMember: ${req.memberName}\nAmount: ₹${req.amount.toFixed(2)}\nPay via UPI: ${link}`;
  if (await shareLink(`Contribution Request - ${req.fundName}`, text, link)) return 'shared';
  return (await copyToClipboard(text)) ? 'copied' : 'failed';
}

export function generateGroupFundWhatsAppPaymentMessage(req: GroupFundWhatsAppPaymentRequest): string {
  const link = generateGroupFundUpiDeepLink(req);
  if (!link) return '';
  const confirmation = req.confirmationMessage || 'Once payment is done, please give a confirmation.';
  const sentDate = new Date().toLocaleDateString('en-IN');
  const upiId = req.upiId!.trim();
  const qrCodeUrl = req.qrCodeUrl?.trim() || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}`;
  return `Hello ${req.memberName}, please pay ₹${req.amount.toFixed(2)} for ${req.fundName} (${req.period}).\nDate: ${sentDate}\n\nUPI ID: ${upiId}\nPayment QR Code: ${qrCodeUrl}\nUPI payment link: ${link}\n\nAfter completing the payment, please share the payment screenshot and confirm the payment.\n\n${confirmation}`;
}

export function generateGroupFundWhatsAppPaymentUrl(req: GroupFundWhatsAppPaymentRequest): string {
  const recipient = normalizeWhatsAppNumber(req.mobileNumber);
  const message = generateGroupFundWhatsAppPaymentMessage(req);
  if (!recipient || !message) return '';
  return `https://wa.me/${recipient}?text=${encodeURIComponent(message)}`;
}

export function generateGroupFundWhatsAppReminderUrl(req: GroupFundWhatsAppReminderRequest): string {
  const recipient = normalizeWhatsAppNumber(req.mobileNumber);
  if (!recipient) return '';
  const sentDate = new Date().toLocaleDateString('en-IN');
  const datedMessage = `${req.message}\nDate: ${sentDate}`;
  return `https://wa.me/${recipient}?text=${encodeURIComponent(datedMessage)}`;
}

export function generateGroupFundThankYouMessage(req: GroupFundThankYouRequest): string {
  const sentDate = new Date().toLocaleDateString('en-IN');
  return req.message ? `${req.message}\nDate: ${sentDate}` : `Hello ${req.memberName}, thank you for your ₹${req.amount.toFixed(2)} contribution to "${req.fundName}" for ${req.period}. Your collection has been recorded.\nDate: ${sentDate}`;
}

export async function shareGroupFundThankYou(req: GroupFundThankYouRequest): Promise<'shared' | 'copied' | 'failed'> {
  const text = generateGroupFundThankYouMessage(req);
  if (await shareLink(req.title || `Thank you - ${req.fundName}`, text)) return 'shared';
  return (await copyToClipboard(text)) ? 'copied' : 'failed';
}

export function generateGroupFundWhatsAppThankYouUrl(req: GroupFundThankYouRequest & { mobileNumber?: string }): string {
  const recipient = normalizeWhatsAppNumber(req.mobileNumber);
  if (!recipient) return '';
  const text = encodeURIComponent(generateGroupFundThankYouMessage(req));
  return `https://wa.me/${recipient}?text=${text}`;
}
