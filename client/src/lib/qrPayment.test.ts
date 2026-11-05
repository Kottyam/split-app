import { describe, expect, it } from 'vitest';
import { buildScannedUpiPaymentLink, getQrFallbackMessage, isQrScannerSupported, parseUpiQrPayload } from './qrPayment';

describe('QR merchant payment helpers', () => {
  it('parses a UPI QR payload and preserves the merchant address', () => {
    const parsed = parseUpiQrPayload('upi://pay?pa=shop%40upi&pn=Goa%20Cafe&am=20');
    expect(parsed?.paymentAddress).toBe('shop@upi');
    expect(parsed?.payeeName).toBe('Goa Cafe');
    expect(parsed?.amountFromQr).toBe(20);
  });

  it('overrides the QR amount with the amount entered in Kharcha', () => {
    const payment = buildScannedUpiPaymentLink(
      'upi://pay?pa=shop%40upi&pn=Goa%20Cafe&am=20',
      125.5,
      'Goa Trip',
      'Snacks',
    );
    expect(payment?.deepLink).toContain('pa=shop%40upi');
    expect(payment?.deepLink).toContain('am=125.50');
    expect(payment?.deepLink).toContain('pn=Goa+Cafe');
    expect(payment?.deepLink).toContain('tn=Snacks');
  });

  it('rejects non-UPI or incomplete QR payloads', () => {
    expect(parseUpiQrPayload('https://example.com/pay')).toBeNull();
    expect(buildScannedUpiPaymentLink('upi://pay?pn=NoAddress', 50, 'Trip')).toBeNull();
    expect(buildScannedUpiPaymentLink('upi://pay?pa=shop%40upi', 0, 'Trip')).toBeNull();
  });

  it('exposes a clear scanner fallback message', () => {
    expect(getQrFallbackMessage()).toContain('Paste a UPI QR payment link');
    expect(typeof isQrScannerSupported()).toBe('boolean');
  });
});

import { toBulkScanItem } from './qrPayment';
describe('bulk QR scan items', () => {
  it('extracts pa/pn/am and ignores non-UPI codes', () => {
    const item = toBulkScanItem('upi://pay?pa=cafe%40okaxis&pn=Beach%20Cafe&am=240.5', [], 1);
    expect(item).toMatchObject({ upiId: 'cafe@okaxis', payee: 'Beach Cafe', description: 'Beach Cafe', amount: '240.5' });
    expect(toBulkScanItem('https://example.com')).toBeNull();
    expect(toBulkScanItem('upi://pay?pn=NoAddress')).toBeNull();
  });
  it('falls back to the UPI id when there is no name or amount', () => {
    expect(toBulkScanItem('upi://pay?pa=x%40ybl')).toMatchObject({ payee: 'x@ybl', amount: '' });
  });
  it('skips the same code scanned twice in a row but allows it again later', () => {
    const a = toBulkScanItem('upi://pay?pa=a%40ybl', [], 1)!;
    expect(toBulkScanItem('upi://pay?pa=a%40ybl', [a], 2)).toBeNull();
    const b = toBulkScanItem('upi://pay?pa=b%40ybl', [a], 3)!;
    expect(toBulkScanItem('upi://pay?pa=a%40ybl', [a, b], 4)).not.toBeNull();
  });
});
