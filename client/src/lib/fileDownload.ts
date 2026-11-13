type NativeFileBridge = {
  saveBase64File?: (fileName: string, mimeType: string, base64: string) => boolean;
  shareBase64File?: (fileName: string, mimeType: string, base64: string, title: string) => boolean;
};

function getNativeFileBridge(): NativeFileBridge | null {
  if (typeof window === 'undefined') return null;
  const bridge = (window as Window & { KharchaFiles?: NativeFileBridge }).KharchaFiles;
  return bridge && (typeof bridge === 'object' || typeof bridge === 'function') ? bridge : null;
}

export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  return btoa(binary);
}

async function blobToBase64(blob: Blob): Promise<string> {
  return toBase64(new Uint8Array(await blob.arrayBuffer()));
}

/** Android's share sheet and Downloads need a plain MIME type without parameters. */
function plainMime(blob: Blob): string {
  return (blob.type || 'application/octet-stream').split(';')[0].trim() || 'application/octet-stream';
}

/**
 * Save a generated file. Android WebView cannot follow blob: download links,
 * so the Android shell exposes KharchaFiles to write into the phone's public
 * Downloads folder (and show a "Downloaded" notification).
 * Returns true when the native bridge saved the file.
 */
export async function downloadBlobFile(blob: Blob, fileName: string): Promise<boolean> {
  const bridge = getNativeFileBridge();
  if (bridge && typeof bridge.saveBase64File === 'function') {
    if (!bridge.saveBase64File(fileName, plainMime(blob), await blobToBase64(blob))) throw new Error('Native save failed');
    return true;
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return false;
}

export type FileShareResult = 'shared' | 'cancelled' | 'unsupported';

/**
 * Send a file through the phone's share sheet (WhatsApp, Gmail, Drive, ...).
 * Uses the Android app's native bridge first, because WebView has no Web Share
 * API for files, then the browser's Web Share API. 'unsupported' lets the
 * caller fall back to downloading the file.
 */
export async function shareBlobFile(blob: Blob, fileName: string, title: string, text?: string): Promise<FileShareResult> {
  const bridge = getNativeFileBridge();
  if (bridge && typeof bridge.shareBase64File === 'function') {
    try {
      if (bridge.shareBase64File(fileName, plainMime(blob), await blobToBase64(blob), title)) return 'shared';
    } catch (error) {
      console.error('Native file share failed:', error);
    }
    return 'unsupported';
  }
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function' || typeof File === 'undefined') return 'unsupported';
  try {
    const file = new File([blob], fileName, { type: plainMime(blob) });
    if (typeof navigator.canShare !== 'function' || !navigator.canShare({ files: [file] })) return 'unsupported';
    await navigator.share({ files: [file], title, ...(text ? { text } : {}) });
    return 'shared';
  } catch (error) {
    if ((error as DOMException)?.name === 'AbortError') return 'cancelled';
    console.error('File share failed:', error);
    return 'unsupported';
  }
}
