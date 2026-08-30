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
