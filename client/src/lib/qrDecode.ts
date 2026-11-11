import jsQR from 'jsqr';

type BarcodeDetectorLike = new (options?: { formats?: string[] }) => {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
};

function getNativeDetector() {
  const Ctor = typeof window !== 'undefined' ? (window as Window & { BarcodeDetector?: BarcodeDetectorLike }).BarcodeDetector : undefined;
  if (!Ctor) return null;
  try { return new Ctor({ formats: ['qr_code'] }); } catch { return null; }
}

let canvas: HTMLCanvasElement | null = null;
function decodeWithJsQr(source: CanvasImageSource, width: number, height: number): string | null {
  if (!width || !height) return null;
  // Downscale large frames/photos for speed; QR codes stay readable at ~1000px.
  const scale = Math.min(1, 1000 / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  canvas = canvas || document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true } as CanvasRenderingContext2DSettings);
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, w, h);
  const img = ctx.getImageData(0, 0, w, h);
  return jsQR(img.data, w, h, { inversionAttempts: 'attemptBoth' })?.data || null;
}

/**
 * Decode a QR code from the current video frame. Uses the browser's native
 * BarcodeDetector when available, otherwise falls back to jsQR so scanning
 * also works in Android WebView, iOS Safari and Firefox.
 */
export async function decodeQrFromVideo(video: HTMLVideoElement): Promise<string | null> {
  if (video.readyState < 2) return null;
  const native = getNativeDetector();
  if (native) {
    try {
      const codes = await native.detect(video);
      const raw = codes.find(c => c.rawValue)?.rawValue;
      if (raw) return raw;
      return null;
    } catch { /* fall through to jsQR */ }
  }
  return decodeWithJsQr(video, video.videoWidth, video.videoHeight);
}

/** Decode a QR code from a picked/screenshot image (camera-denied fallback). */
export async function decodeQrFromImageFile(file: File): Promise<string | null> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const native = getNativeDetector();
    if (native) {
      try {
        const raw = (await native.detect(img)).find(c => c.rawValue)?.rawValue;
        if (raw) return raw;
      } catch { /* ignore */ }
    }
    return decodeWithJsQr(img, img.naturalWidth, img.naturalHeight);
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** i18n key for a camera start failure; render with t(). */
export function cameraErrorKey(error: unknown): 'camErrDenied' | 'camErrNotFound' | 'camErrBusy' | 'camErrGeneric' {
  const name = (error as { name?: string })?.name || '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'camErrDenied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'camErrNotFound';
  if (name === 'NotReadableError') return 'camErrBusy';
  return 'camErrGeneric';
}

export function describeCameraError(error: unknown): string {
  const name = (error as { name?: string })?.name || '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Camera permission was denied. Allow camera access in your browser/app settings, or pick a QR image / paste the UPI link below.';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No camera was found on this device. Pick a QR image or paste the UPI link below.';
  if (name === 'NotReadableError') return 'The camera is being used by another app. Close it and try again.';
  return 'Could not start the camera. Pick a QR image or paste the UPI link below.';
}
