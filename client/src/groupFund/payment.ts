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
  const digits = (req.mobileNumber || '').replace(/\D/g, '');
  const recipient = digits.length === 10 ? `91${digits}` : digits;
  const text = encodeURIComponent(generateGroupFundWhatsAppPaymentMessage(req));
  return `https://wa.me/${recipient}?text=${text}`;
}

export function generateGroupFundWhatsAppReminderUrl(req: GroupFundWhatsAppReminderRequest): string {
  const digits = (req.mobileNumber || '').replace(/\D/g, '');
  const recipient = digits.length === 10 ? `91${digits}` : digits;
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
  const digits = (req.mobileNumber || '').replace(/\D/g, '');
  const recipient = digits.length === 10 ? `91${digits}` : digits;
  const text = encodeURIComponent(generateGroupFundThankYouMessage(req));
  return `https://wa.me/${recipient}?text=${text}`;
}
