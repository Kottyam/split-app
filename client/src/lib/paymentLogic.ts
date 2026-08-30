/**
 * Smart Payment Logic
 * Determines payment method based on available member details
 */

import { isValidUpiId } from './upi';
import { isValidPhoneNumber } from './contacts';

export type PaymentMethod = 'upi' | 'mobile' | 'none';

export interface PaymentDetails {
  method: PaymentMethod;
  upiId?: string;
  mobileNumber?: string;
  canPay: boolean;
  canShare: boolean;
}

/**
 * Determine payment method based on member details
 * Priority: UPI > Mobile > None
 */
export function getPaymentMethod(
  upiId?: string,
  mobileNumber?: string
): PaymentDetails {
  const hasValidUpi = upiId && isValidUpiId(upiId);
  const hasValidMobile = mobileNumber && isValidPhoneNumber(mobileNumber);

  if (hasValidUpi) {
    return {
      method: 'upi',
      upiId,
      mobileNumber,
      canPay: true,
      canShare: true,
    };
  }

  if (hasValidMobile) {
    return {
      method: 'mobile',
      mobileNumber,
      canPay: false,
      canShare: true,
    };
  }

  return {
    method: 'none',
    canPay: false,
    canShare: false,
  };
}

/**
 * Generate payment request message for sharing
 */
export function generatePaymentMessage(
  memberName: string,
  amount: number,
  tripName: string
): string {
  return `Trip Settlement Request\nTrip: ${tripName}\nMember: ${memberName}\nAmount: ₹${amount.toFixed(2)}\nPlease complete your payment.`;
}

/**
 * Generate WhatsApp share link
 */
export function generateWhatsAppLink(
  phoneNumber: string,
  message: string
): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
}

/**
 * Generate SMS share link
 */
export function generateSmsLink(
  phoneNumber: string,
  message: string
): string {
  const encodedMessage = encodeURIComponent(message);
  return `sms:${phoneNumber}?body=${encodedMessage}`;
}

/**
 * Generate email share link
 */
export function generateEmailLink(
  email: string,
  subject: string,
  message: string
): string {
  const encodedSubject = encodeURIComponent(subject);
  const encodedMessage = encodeURIComponent(message);
  return `mailto:${email}?subject=${encodedSubject}&body=${encodedMessage}`;
}

/**
 * Generate Telegram share link
 */
export function generateTelegramLink(
  phoneNumber: string,
  message: string
): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://t.me/share/url?url=&text=${encodedMessage}`;
}
