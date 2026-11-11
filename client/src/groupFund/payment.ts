import { buildUpiUri, checkUpiId } from '@/lib/upiLink';
import { copyToClipboard, shareLink } from '@/lib/shareLink';

/** Optional translator so outgoing messages follow the selected app language (English when omitted). */
export type MessageTranslator = (key: any, vars?: Record<string, string | number>) => string;

const EN: Record<string, string> = {
  payMsgDate: 'Date: {{date}}', payMsgFundRequestTitle: 'Group Fund Contribution Request', payMsgFund: 'Fund: {{name}}', payMsgMember: 'Member: {{name}}', payMsgAmount: 'Amount: ₹{{amount}}', payMsgPayViaUpi: 'Pay via UPI: {{link}}', payMsgContributionRequestTitle: 'Contribution Request - {{name}}',
  payMsgConfirmDefault: 'Once payment is done, please give a confirmation.', payMsgPleasePay: 'Hello {{name}}, please pay ₹{{amount}} for {{fund}} ({{period}}).', payMsgUpiId: 'UPI ID: {{upiId}}', payMsgQr: 'Payment QR Code: {{url}}', payMsgUpiLink: 'UPI payment link: {{link}}',
  payMsgScreenshot: 'After completing the payment, please share the payment screenshot and confirm the payment.', payMsgThankYouDefault: 'Hello {{name}}, thank you for your ₹{{amount}} contribution to "{{fund}}" for {{period}}. Your collection has been recorded.', payMsgThankYouTitle: 'Thank you - {{name}}',
};
const tr = (t: MessageTranslator | undefined, key: string, vars: Record<string, string | number> = {}) => t ? t(key, vars) : Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{{${k}}}`, String(v)), EN[key] ?? key);

export interface GroupFundPaymentRequest {
  t?: MessageTranslator;
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
  t?: MessageTranslator;
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
  t?: MessageTranslator;
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
  return checkUpiId(upiId).ok;
}

export function generateWhatsAppMessageUrl(mobileNumber: string | undefined, message: string): string | undefined {
  const recipient = normalizeWhatsAppNumber(mobileNumber);
  if (!recipient) return undefined;
  return `https://wa.me/${recipient}?text=${encodeURIComponent(message)}`;
}

export function generateGroupFundUpiDeepLink(req: GroupFundPaymentRequest): string {
  if (!isValidGroupFundUpiId(req.upiId) || !Number.isFinite(req.amount) || req.amount <= 0) return '';
  return buildUpiUri({ upiId: req.upiId!, payeeName: req.fundName, amount: req.amount, note: req.note || `${req.fundName} ${req.memberName}` });
}

export async function shareGroupFundPaymentRequest(req: GroupFundPaymentRequest): Promise<'shared' | 'copied' | 'failed'> {
  const link = generateGroupFundUpiDeepLink(req);
  if (!link) return 'failed';
  const text = [tr(req.t, 'payMsgFundRequestTitle'), tr(req.t, 'payMsgFund', { name: req.fundName }), tr(req.t, 'payMsgMember', { name: req.memberName }), tr(req.t, 'payMsgAmount', { amount: req.amount.toFixed(2) }), tr(req.t, 'payMsgPayViaUpi', { link })].join('\n');
  if (await shareLink(tr(req.t, 'payMsgContributionRequestTitle', { name: req.fundName }), text, link)) return 'shared';
  return (await copyToClipboard(text)) ? 'copied' : 'failed';
}

export function generateGroupFundWhatsAppPaymentMessage(req: GroupFundWhatsAppPaymentRequest): string {
  const link = generateGroupFundUpiDeepLink(req);
  if (!link) return '';
  const confirmation = req.confirmationMessage || tr(req.t, 'payMsgConfirmDefault');
  const sentDate = new Date().toLocaleDateString('en-IN');
  const upiId = req.upiId!.trim();
  const qrCodeUrl = req.qrCodeUrl?.trim() || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}`;
  return `${tr(req.t, 'payMsgPleasePay', { name: req.memberName, amount: req.amount.toFixed(2), fund: req.fundName, period: req.period })}\n${tr(req.t, 'payMsgDate', { date: sentDate })}\n\n${tr(req.t, 'payMsgUpiId', { upiId })}\n${tr(req.t, 'payMsgQr', { url: qrCodeUrl })}\n${tr(req.t, 'payMsgUpiLink', { link })}\n\n${tr(req.t, 'payMsgScreenshot')}\n\n${confirmation}`;
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
  const datedMessage = `${req.message}\n${tr(req.t, 'payMsgDate', { date: sentDate })}`;
  return `https://wa.me/${recipient}?text=${encodeURIComponent(datedMessage)}`;
}

export function generateGroupFundThankYouMessage(req: GroupFundThankYouRequest): string {
  const sentDate = new Date().toLocaleDateString('en-IN');
  const dated = tr(req.t, 'payMsgDate', { date: sentDate });
  return req.message ? `${req.message}\n${dated}` : `${tr(req.t, 'payMsgThankYouDefault', { name: req.memberName, amount: req.amount.toFixed(2), fund: req.fundName, period: req.period })}\n${dated}`;
}

export async function shareGroupFundThankYou(req: GroupFundThankYouRequest): Promise<'shared' | 'copied' | 'failed'> {
  const text = generateGroupFundThankYouMessage(req);
  if (await shareLink(req.title || tr(req.t, 'payMsgThankYouTitle', { name: req.fundName }), text)) return 'shared';
  return (await copyToClipboard(text)) ? 'copied' : 'failed';
}

export function generateGroupFundWhatsAppThankYouUrl(req: GroupFundThankYouRequest & { mobileNumber?: string }): string {
  const recipient = normalizeWhatsAppNumber(req.mobileNumber);
  if (!recipient) return '';
  const text = encodeURIComponent(generateGroupFundThankYouMessage(req));
  return `https://wa.me/${recipient}?text=${text}`;
}
