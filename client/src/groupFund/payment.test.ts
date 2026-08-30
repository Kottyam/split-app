import { describe, expect, it } from 'vitest';
import {
  generateGroupFundWhatsAppPaymentMessage,
  generateGroupFundWhatsAppPaymentUrl,
  generateGroupFundWhatsAppThankYouUrl,
  generateGroupFundWhatsAppReminderUrl,
} from './payment';

describe('Group Fund personalized payment requests', () => {
  it('includes the saved member amount, UPI link, and confirmation instruction', () => {
    const request = {
      fundName: 'House Fund',
      memberName: 'Asha',
      amount: 275,
      upiId: 'house@upi',
      period: 'August 2026',
      mobileNumber: '9876543210',
      confirmationMessage: 'Once payment is done, please give a confirmation.',
    };
    const message = generateGroupFundWhatsAppPaymentMessage(request);
    expect(message).toContain('₹275.00');
    expect(message).toContain('upi://pay?');
    expect(message).toContain('Once payment is done, please give a confirmation.');
  });

  it('builds an unsaved-member reminder without a zero amount or payment link', () => {
    const message = 'Hello Binu, please inform the organizer of your contribution amount.';
    const url = generateGroupFundWhatsAppReminderUrl({
      fundName: 'House Fund', memberName: 'Binu', period: 'August 2026',
      mobileNumber: '9876543210', message,
    });
    expect(decodeURIComponent(url)).toContain(message);
    expect(decodeURIComponent(url)).not.toContain('₹0');
    expect(decodeURIComponent(url)).not.toContain('upi://pay');
  });

  it('builds a WhatsApp thank-you URL for a recorded collection, including ₹0', () => {
    const url = generateGroupFundWhatsAppThankYouUrl({
      fundName: 'House Fund',
      memberName: 'Asha',
      amount: 0,
      period: 'August 2026',
      mobileNumber: '9876543210',
    });
    expect(url).toMatch(/^https:\/\/wa\.me\/919876543210\?text=/);
    expect(decodeURIComponent(url)).toContain('Hello Asha');
    expect(decodeURIComponent(url)).toContain('₹0.00');
  });

  it('targets the member’s WhatsApp number and encodes the message', () => {
    const url = generateGroupFundWhatsAppPaymentUrl({
      fundName: 'House Fund',
      memberName: 'Binu',
      amount: 500,
      upiId: 'house@upi',
      period: 'August 2026',
      mobileNumber: '+91 98765 43210',
    });
    expect(url).toMatch(/^https:\/\/wa\.me\/919876543210\?text=/);
    expect(url).toContain(encodeURIComponent('₹500.00'));
  });
});
