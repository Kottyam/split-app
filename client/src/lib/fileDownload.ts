type NativeFileBridge = { saveBase64File: (fileName: string, mimeType: string, base64: string) => boolean };

function getNativeFileBridge(): NativeFileBridge | null {
  if (typeof window === 'undefined') return null;
  const bridge = (window as Window & { KharchaFiles?: NativeFileBridge }).KharchaFiles;
  return bridge && typeof bridge.saveBase64File === 'function' ? bridge : null;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  return btoa(binary);
}

/**
 * Save a generated file. Android WebView cannot follow blob: download links,
 * so the Android shell exposes KharchaFiles to write into Downloads.
 * Returns true when the native bridge saved the file.
 */
export async function downloadBlobFile(blob: Blob, fileName: string): Promise<boolean> {
  const bridge = getNativeFileBridge();
  if (bridge) {
    const base64 = toBase64(new Uint8Array(await blob.arrayBuffer()));
    if (!bridge.saveBase64File(fileName, blob.type || 'application/octet-stream', base64)) throw new Error('Native save failed');
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
