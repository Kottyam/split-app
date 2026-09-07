import type { GroupFund, GroupFundMember, Contribution } from './types';

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

  // Common Indian local formats: 9876543210 / 09876543210 / +91 9876543210.
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;

  // Keep already-valid international numbers intact.
  return digits.length >= 11 && digits.length <= 15 ? digits : undefined;
}

export function generateWhatsAppMessageUrl(mobileNumber: string | undefined, message: string): string | undefined {
  const recipient = normalizeWhatsAppNumber(mobileNumber);
  if (!recipient) return undefined;
  return `https://wa.me/${recipient}?text=${encodeURIComponent(message)}`;
}

export function generateGroupFundUpiDeepLink(req: GroupFundPaymentRequest): string {
  const upiId = req.upiId?.trim() || 'merchant@upi';
  const name = encodeURIComponent(req.fundName);
  const amt = req.amount.toFixed(2);
  const note = encodeURIComponent(req.note || `Contribution to ${req.fundName} - ${req.memberName}`);
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${name}&am=${amt}&tn=${note}`;
}

export async function shareGroupFundPaymentRequest(req: GroupFundPaymentRequest): Promise<'shared' | 'copied' | 'failed'> {
  const link = generateGroupFundUpiDeepLink(req);
  const text = `Group Fund Contribution Request\nFund: ${req.fundName}\nMember: ${req.memberName}\nAmount: ₹${req.amount.toFixed(2)}\nPay via UPI: ${link}`;
  
  if (await shareLink(`Contribution Request - ${req.fundName}`, text, link)) return 'shared';
  return (await copyToClipboard(text)) ? 'copied' : 'failed';
}

export function generateGroupFundWhatsAppPaymentMessage(req: GroupFundWhatsAppPaymentRequest): string {
  const link = generateGroupFundUpiDeepLink(req);
  const confirmation = req.confirmationMessage || 'Once payment is done, please give a confirmation.';
  return `Hello ${req.memberName}, please pay ₹${req.amount.toFixed(2)} for ${req.fundName} (${req.period}). Pay here: ${link}\n\n${confirmation}`;
}

export function generateGroupFundWhatsAppPaymentUrl(req: GroupFundWhatsAppPaymentRequest): string {
  const recipient = normalizeWhatsAppNumber(req.mobileNumber) ?? '';
  const text = encodeURIComponent(generateGroupFundWhatsAppPaymentMessage(req));
  return `https://wa.me/${recipient}?text=${text}`;
}

export function generateGroupFundWhatsAppReminderUrl(req: GroupFundWhatsAppReminderRequest): string {
  const recipient = normalizeWhatsAppNumber(req.mobileNumber) ?? '';
  return `https://wa.me/${recipient}?text=${encodeURIComponent(req.message)}`;
}

export function generateGroupFundThankYouMessage(req: GroupFundThankYouRequest): string {
  return req.message || `Hello ${req.memberName}, thank you for your ₹${req.amount.toFixed(2)} contribution to "${req.fundName}" for ${req.period}. Your collection has been recorded.`;
}

export async function shareGroupFundThankYou(req: GroupFundThankYouRequest): Promise<'shared' | 'copied' | 'failed'> {
  const text = generateGroupFundThankYouMessage(req);
  if (await shareLink(req.title || `Thank you - ${req.fundName}`, text)) return 'shared';
  return (await copyToClipboard(text)) ? 'copied' : 'failed';
}

export function generateGroupFundWhatsAppThankYouUrl(req: GroupFundThankYouRequest & { mobileNumber?: string }): string {
  const recipient = normalizeWhatsAppNumber(req.mobileNumber) ?? '';
  const text = encodeURIComponent(generateGroupFundThankYouMessage(req));
  return `https://wa.me/${recipient}?text=${text}`;
}
