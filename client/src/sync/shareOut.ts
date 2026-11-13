import { copyToClipboard, shareLink } from '@/lib/shareLink';
import { downloadBlobFile, shareBlobFile } from '@/lib/fileDownload';

export function kharchaFileName(fileName: string): string {
  const safe = fileName.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'kharcha';
  return `${safe}.kharcha`;
}

/**
 * Share a .kharcha file through the phone's share sheet (WhatsApp, any app).
 * When sharing files is not possible, save it to Downloads instead.
 * 'saved-native' means the Android app saved it and already told the user.
 */
export async function shareKharchaFile(fileName: string, contents: string, title: string): Promise<'shared' | 'cancelled' | 'downloaded' | 'saved-native' | 'failed'> {
  const name = kharchaFileName(fileName);
  const blob = new Blob([contents], { type: 'application/octet-stream' });
  const shared = await shareBlobFile(blob, name, title);
  if (shared === 'shared') return 'shared';
  if (shared === 'cancelled') return 'cancelled';
  try {
    return (await downloadBlobFile(blob, name)) ? 'saved-native' : 'downloaded';
  } catch { return 'failed'; }
}
export { copyToClipboard, shareLink };
