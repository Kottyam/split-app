import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { generateUpiDeepLink } from '@/lib/upi';
import { SharedHomePaymentRequestPanel } from '@/components/SharedHomePaymentRequestDialog';
import {
  decodeSharedHomePaymentRequest,
  encodeSharedHomePaymentRequest,
  generateSharedHomePaymentRequestLink,
  generateSharedHomeUpiDeepLink,
  normalizeSharedHomePaymentRequest,
} from './paymentRequest';

const request = {
  homeName: 'August Shared Home',
  payerName: 'Rahul',
  payeeName: 'Amal',
  amount: 2500,
  reason: 'August Shared Home expenses',
  upiId: 'amal@upi',
};

describe('Shared Home payment requests', () => {
  it('uses only the stored UPI ID and exact two-decimal amount for Shared Home deep links', () => {
    const link = generateSharedHomeUpiDeepLink(request);
    expect(link).toContain('pa=amal%40upi');
    expect(link).toContain('pn=Amal');
    expect(link).toContain('am=2500.00');
    expect(link).toContain('cu=INR');
    expect(link).toContain('tn=Shared+Home+Settlement');
    expect(link).not.toContain('@upi%40upi');
  });

  it('does not treat a mobile number as a payment destination', () => {
    expect(generateSharedHomeUpiDeepLink({ ...request, upiId: undefined })).toBeNull();
    expect(normalizeSharedHomePaymentRequest({ ...request, upiId: '9876543210' }).upiId).toBeUndefined();
  });

  it('round-trips only payment-request details and keeps the payload compact', () => {
    const encoded = encodeSharedHomePaymentRequest(request);
    const decoded = decodeSharedHomePaymentRequest(encoded);
    expect(decoded).toEqual(request);
    expect(generateSharedHomePaymentRequestLink(request)).toContain('/shared-home-payment/');
    expect(encoded).not.toContain('mobileNumber');
    expect(encoded).not.toContain('expense history');
  });

  it('renders payer, payee, amount, reason, and fallback controls without exposing the raw URL', () => {
    const markup = renderToStaticMarkup(<LanguageProvider><SharedHomePaymentRequestPanel request={request} onPayViaUpi={() => undefined} onSharePaymentRequest={async () => undefined} /></LanguageProvider>);
    expect(markup).toContain('Pay Amal');
    expect(markup).toContain('₹2500.00');
    expect(markup).toContain('Rahul');
    expect(markup).toContain('August Shared Home expenses');
    expect(markup).toContain('Pay via UPI');
    expect(markup).toContain('Share Payment Request');
    expect(markup).not.toContain('shared-home-payment/');
  });

  it('keeps Trip UPI wording and Shared Home UPI wording on separate helpers', () => {
    expect(generateUpiDeepLink('amal@upi', 2500, 'Amal', 'Goa Trip')).toContain('Trip+Settlement');
    expect(generateSharedHomeUpiDeepLink(request)).toContain('Shared+Home+Settlement');
  });
});
