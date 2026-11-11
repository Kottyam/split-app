import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { SyncContextType, SyncSnapshot } from '@/lib/editSync';
import { buildKharchaFile, editLink, normalizeSnapshot, type EditPackage, type Snapshot } from '@/sync/serverlessSync';
import { getCopy, recordSharedBase } from '@/sync/syncStore';
import { storeSnapshot } from '@/sync/contextData';
import LinkOrFileActions from '@/sync/LinkOrFileActions';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contextType: SyncContextType;
  contextId: string;
  contextName: string;
  snapshot: SyncSnapshot;
}

/** "Share for editing": a link (or .kharcha file) carrying an editable copy. No server involved. */
export default function EditSyncShareDialog(props: Props) {
  if (!props.open) return null;
  return <ShareForEditing {...props} />;
}

function ShareForEditing({ open, onOpenChange, contextType, contextId, contextName, snapshot }: Props) {
  const { t } = useLanguage();
  const [from, setFrom] = useState('');
  const pkg = useMemo<EditPackage>(() => {
    const original = snapshot as unknown as Snapshot;
    const normalized = normalizeSnapshot(original);
    // Keep the ids we hand out: if normalisation had to add ids, save them locally too.
    if (JSON.stringify(normalized) !== JSON.stringify(original)) storeSnapshot(contextType, normalized);
    const { sid, ver } = recordSharedBase(contextType, contextId, contextName, normalized);
    // Re-sharing an editable copy: remember which owner share it came from, so the original
    // owner can merge it into their existing item instead of saving another copy.
    const copy = getCopy(contextId);
    return { v: 1, t: contextType, s: sid, n: ver, m: contextName, ...(copy ? { o: { s: copy.sid, n: copy.ver } } : {}), d: normalized };
  }, [contextType, contextId, contextName, snapshot]);
  const full = { ...pkg, ...(from.trim() ? { f: from.trim().slice(0, 40) } : {}) };
  const url = editLink(full);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent data-testid="share-for-editing-dialog"><DialogHeader><DialogTitle>{t('shareForEditing' as any)}</DialogTitle><DialogDescription>{t('syncShareEditDescription' as any, { name: contextName })}</DialogDescription></DialogHeader>
    <label className="text-xs font-bold text-gray-600">{t('syncYourNameShown' as any)}<Input data-testid="share-for-editing-name" value={from} onChange={e => setFrom(e.target.value)} placeholder={t('syncNamePlaceholder' as any)} className="mt-1" /></label>
    <LinkOrFileActions url={url} fileContents={buildKharchaFile('edit', full)} fileName={`${contextName}-edit`} title={t('syncEditTitle' as any, { name: contextName })} message={t('syncEditMessage' as any, { name: contextName })} testIdPrefix="edit-link" />
  </DialogContent></Dialog>;
}
