import { copyToClipboard, shareLink } from '@/lib/shareLink';

/** Share a .kharcha file through the share sheet, or download it when sharing files is not possible. */
export async function shareKharchaFile(fileName: string, contents: string, title: string): Promise<'shared' | 'downloaded' | 'failed'> {
  const safe = fileName.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'kharcha';
  const name = `${safe}.kharcha`;
  try {
    const file = new File([contents], name, { type: 'application/octet-stream' });
    if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title });
      return 'shared';
    }
  } catch (error) { if ((error as Error)?.name === 'AbortError') return 'failed'; }
  try {
    const url = URL.createObjectURL(new Blob([contents], { type: 'application/octet-stream' }));
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);
    return 'downloaded';
  } catch { return 'failed'; }
}
export { copyToClipboard, shareLink };
