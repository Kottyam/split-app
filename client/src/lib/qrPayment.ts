export interface ScannedUpiPayment {
  paymentAddress: string;
  payeeName?: string;
  amountFromQr?: number;
  deepLink: string;
}

function isUpiPayUri(value: string): boolean {
  return /^upi:\/\/pay(?:\?|$)/i.test(value.trim());
}

export function parseUpiQrPayload(rawValue: string): { paymentAddress?: string; payeeName?: string; amountFromQr?: number; params: URLSearchParams } | null {
  const value = rawValue.trim();
  if (!isUpiPayUri(value)) return null;

  const query = value.slice(value.indexOf('?') + 1);
  const params = new URLSearchParams(query);
  const paymentAddress = params.get('pa')?.trim();
  if (!paymentAddress) return null;

  const amountText = params.get('am');
  const amountFromQr = amountText && Number.isFinite(Number(amountText)) ? Number(amountText) : undefined;
  return {
    paymentAddress,
    payeeName: params.get('pn')?.trim() || undefined,
    amountFromQr,
    params,
  };
}

export function buildScannedUpiPaymentLink(rawValue: string, amount: number, tripName: string, itemNote?: string): ScannedUpiPayment | null {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const parsed = parseUpiQrPayload(rawValue);
  if (!parsed) return null;

  const params = new URLSearchParams(parsed.params);
  params.set('am', amount.toFixed(2));
  params.set('cu', 'INR');
  if (!params.get('tn')) {
    params.set('tn', itemNote?.trim() || `Trip Expense - ${tripName.trim()}`);
  }

  return {
    paymentAddress: parsed.paymentAddress!,
    payeeName: parsed.payeeName,
    amountFromQr: parsed.amountFromQr,
    deepLink: `upi://pay?${params.toString()}`,
  };
}

export function isQrScannerSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  // Android WebView can expose getUserMedia without BarcodeDetector. Let the
  // native permission bridge open the camera in that case and keep the paste
  // fallback available when QR decoding is not provided by the WebView.
  return typeof navigator.mediaDevices?.getUserMedia === 'function';
}

export function getQrFallbackMessage(): string {
  return 'Camera QR scanning is not available in this browser. Paste a UPI QR payment link below instead.';
}
