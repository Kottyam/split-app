import { describe, expect, it } from 'vitest';
import { buildUpiUri, checkUpiId, looksLikePhoneNumber, sanitizeUpiText, formatUpiAmount } from './upiLink';

describe('buildUpiUri', () => {
  it('builds the minimal ordered format with raw VPA', () => {
    expect(buildUpiUri({ upiId: ' Amal@OKAxis ', payeeName: 'Goa Trip', amount: 150, note: 'Trip Goa' }))
      .toBe('upi://pay?pa=amal@okaxis&pn=Goa%20Trip&am=150.00&cu=INR&tn=Trip%20Goa');
  });
  it('rounds amount to 2 decimals and omits non-positive amounts', () => {
    expect(buildUpiUri({ upiId: 'a1@ybl', payeeName: 'X', amount: 99.999 })).toBe('upi://pay?pa=a1@ybl&pn=X&am=100.00&cu=INR');
    expect(buildUpiUri({ upiId: 'a1@ybl', payeeName: 'X', amount: 0 })).toBe('upi://pay?pa=a1@ybl&pn=X&cu=INR');
    expect(formatUpiAmount(NaN)).toBeUndefined();
  });
  it('never uses + or %40 and never adds merchant params', () => {
    const uri = buildUpiUri({ upiId: 'a.b@ybl', payeeName: 'Ram & Co #1', amount: 10, note: 'Fund: Onam/2026 ₹' });
    expect(uri).not.toMatch(/\+|%40/);
    expect(uri).not.toMatch(/[?&](mc|tr|tid|url|mode|orgid|sign)=/);
    expect(uri).toContain('pn=Ram%20Co%201');
    expect(uri).toContain('tn=Fund%20Onam%202026');
  });
  it('limits note length', () => {
    expect(sanitizeUpiText('x'.repeat(100), 40)).toHaveLength(40);
  });
  it('rejects phone numbers and invalid ids', () => {
    expect(buildUpiUri({ upiId: '9876543210' })).toBe('');
    expect(buildUpiUri({ upiId: 'not an id' })).toBe('');
    expect(checkUpiId('+91 98765 43210')).toEqual({ ok: false, reason: 'phone' });
    expect(checkUpiId('9876543210@ybl')).toEqual({ ok: true, upiId: '9876543210@ybl' });
    expect(looksLikePhoneNumber('9876543210@ybl')).toBe(false);
  });
});
