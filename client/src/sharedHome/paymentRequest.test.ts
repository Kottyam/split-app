import { describe, expect, it } from 'vitest';
import { createSharedHomePaymentRequestMessage } from './paymentRequest';

describe('Shared Home payment-request messages', () => {
  it('accepts localized labels without changing the payment values', () => {
    const message = createSharedHomePaymentRequestMessage(
      {
        homeName: 'Green View',
        payerName: 'Anu',
        payeeName: 'Manu',
        amount: 250,
        reason: 'Electricity',
        upiId: 'manu@upi',
      },
      {
        heading: 'PAYMENT REQUEST',
        pay: 'Pay to',
        amount: 'Amount',
        forLabel: 'For',
        whoPays: 'Payer',
        whoReceives: 'Receiver',
        upiId: 'UPI address',
        unavailable: 'Unavailable',
        footer: 'Please confirm after payment.',
      },
    );

    expect(message).toContain('PAYMENT REQUEST');
    expect(message).toContain('Pay to: Manu');
    expect(message).toContain('₹250.00');
    expect(message).toContain('Electricity');
    expect(message).toContain('Payer: Anu');
    expect(message).toContain('UPI address: manu@upi');
    expect(message).toContain('Please confirm after payment.');
  });
});
