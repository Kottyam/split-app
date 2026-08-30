import { describe, expect, it, vi } from 'vitest';
import {
  generateUpiDeepLink,
  generatePayerPayeePaymentMessage,
  getPaymentMethod,
  isValidUpiId,
  isValidMobileNumber,
  createPaymentShareText,
  normalizePaymentAddress,
  generateScannerUpiDeepLink,
  launchScannedUpiPayment,
  sharePaymentRequest,
} from './upi';

describe('UPI helpers', () => {
  it('generates a standard UPI deep-link with recipient and amount', () => {
    const link = generateUpiDeepLink('riya@okhdfcbank', 1250, 'Riya', 'Goa Trip');
    expect(link).toContain('upi://pay?');
    expect(link).toContain('pa=riya%40okhdfcbank');
    expect(link).toContain('pn=Riya');
    expect(link).toContain('am=1250.00');
    expect(link).toContain('Trip+Settlement');
  });

  it('includes who pays whom in the share message', () => {
    const message = generatePayerPayeePaymentMessage('Aarav', 'Riya', 400, 'Goa Trip', 'riya@okhdfcbank');
    expect(message).toContain('Who pays: Aarav');
    expect(message).toContain('Who receives: Riya');
    expect(message).toContain('Amount: ₹400.00');
  });

  it('prioritizes UPI, then mobile, then no payment details', () => {
    expect(getPaymentMethod('riya@okhdfcbank', '9876543210')).toBe('upi');
    expect(getPaymentMethod('', '9876543210')).toBe('mobile');
    expect(getPaymentMethod('', '')).toBe('none');
  });

  it('validates Indian UPI IDs and mobile numbers', () => {
    expect(isValidUpiId('name@okhdfcbank')).toBe(true);
    expect(isValidUpiId('not-a-upi')).toBe(false);
    expect(isValidMobileNumber('9876543210')).toBe(true);
    expect(isValidMobileNumber('12345')).toBe(false);
  });

  it('falls back to a UPI-linked mobile payment address', () => {
    expect(normalizePaymentAddress(undefined, '9876543210')).toBe('9876543210@upi');
    const link = generateUpiDeepLink(undefined, 99, 'Riya', 'Goa Trip', '9876543210');
    expect(link).toContain('pa=9876543210%40upi');
  });

  it('creates a share payload with payer, payee, and UPI link context', () => {
    const text = createPaymentShareText('Aarav', 'Riya', 400, 'Goa Trip', 'riya@okhdfcbank', '9876543210');
    expect(text).toContain('Who pays: Aarav');
    expect(text).toContain('Who receives: Riya');
    expect(text).toContain('upi://pay?');
    expect(text).toContain('pa=riya%40okhdfcbank');
  });

  it('creates a readable mobile-only payment request when no UPI ID exists', () => {
    const text = createPaymentShareText('Aarav', 'Riya', 250, 'Goa Trip', undefined, '9876543210');
    expect(text).toContain('Who pays: Aarav');
    expect(text).toContain('Who receives: Riya');
    expect(text).toContain('Payment contact: 9876543210');
    expect(text).toContain('pa=9876543210%40upi');
  });

  it('creates a scanner-first UPI link without recipient or amount', () => {
    const link = generateScannerUpiDeepLink('Goa Trip', 'Scan snacks purchase');
    expect(link).toContain('upi://pay?');
    expect(link).toContain('cu=INR');
    expect(link).toContain('tn=Scan+snacks+purchase');
    expect(link).not.toContain('pa=');
    expect(link).not.toContain('am=');
  });

  it('launches the scanned merchant QR with the amount entered in Kharcha', () => {
    const click = vi.fn();
    const remove = vi.fn();
    const anchor = { href: '', style: { display: '' }, click, remove };
    vi.stubGlobal('document', {
      createElement: vi.fn(() => anchor),
      body: { appendChild: vi.fn() },
    });

    const link = launchScannedUpiPayment(
      'upi://pay?pa=shop%40upi&pn=Goa%20Cafe&am=20',
      125.5,
      'Goa Trip',
      'Snacks',
    );

    expect(link).toContain('pa=shop%40upi');
    expect(link).toContain('am=125.50');
    expect(link).toContain('tn=Snacks');
    expect(anchor.href).toBe(link);
    expect(click).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();

    vi.unstubAllGlobals();
  });

  it('returns no launcher link for an invalid scanned payload', () => {
    expect(launchScannedUpiPayment('not-a-upi-qr', 125, 'Goa Trip')).toBeNull();
  });

  it('opens the native app chooser for Share Payment', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share });

    await expect(sharePaymentRequest('Aarav', 'Riya', 400, 'Goa Trip', 'riya@okhdfcbank')).resolves.toBe('shared');
    expect(share).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Payment Request - Goa Trip',
      text: expect.stringContaining('Who pays: Aarav'),
      url: expect.stringContaining('upi://pay?'),
    }));

    vi.unstubAllGlobals();
  });

  it('copies the payment request when the native chooser is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await expect(sharePaymentRequest('Aarav', 'Riya', 400, 'Goa Trip', undefined, '9876543210')).resolves.toBe('copied');
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Who receives: Riya'));

    vi.unstubAllGlobals();
  });
});
