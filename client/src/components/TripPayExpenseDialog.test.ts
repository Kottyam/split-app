import { describe, expect, it } from 'vitest';
import { resolveQrPaymentTransition } from './TripPayExpenseDialog';

describe('TripPayExpenseDialog QR flow', () => {
  it('transitions from scanned merchant QR to confirm with the typed amount', () => {
    const transition = resolveQrPaymentTransition(
      'upi://pay?pa=merchant%40upi&pn=Beach%20Shop&am=20',
      '125.50',
      'Goa Trip',
      'Snacks',
    );

    expect(transition).toEqual({
      step: 'confirm',
      amount: 125.5,
      deepLink: expect.stringContaining('am=125.50'),
    });
    expect(transition?.deepLink).toContain('pa=merchant%40upi');
    expect(transition?.deepLink).toContain('tn=Snacks');
  });

  it('does not enter confirmation for an invalid QR or amount', () => {
    expect(resolveQrPaymentTransition('https://example.com', '125', 'Goa Trip', 'Snacks')).toBeNull();
    expect(resolveQrPaymentTransition('upi://pay?pa=merchant%40upi', '', 'Goa Trip', 'Snacks')).toBeNull();
  });
});
