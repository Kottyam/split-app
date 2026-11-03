import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppSectionHeader from '@/components/AppSectionHeader';
import { pathFromImport } from '@/sync/serverlessSync';

type LaunchParams = { files?: Array<{ getFile: () => Promise<File> }> };

/** Import a .kharcha file: from the picker, the PWA file handler (launchQueue) or the Android app. */
export default function ImportKharcha() {
  const [, navigate] = useLocation();
  const input = useRef<HTMLInputElement>(null);
  const [pasted, setPasted] = useState('');
  const open = (text: string) => { const path = pathFromImport(text); if (path) navigate(path); else toast.error('This is not a Kharcha sync file or link'); };
  useEffect(() => {
    const queue = (window as unknown as { launchQueue?: { setConsumer: (cb: (p: LaunchParams) => void) => void } }).launchQueue;
    queue?.setConsumer(async params => { const file = params.files?.[0]; if (file) open(await (await file.getFile()).text()); });
  }, []);
  return <main className="min-h-screen bg-kharcha-cream p-4"><div className="mx-auto max-w-xl space-y-4"><AppSectionHeader title="Import .kharcha file" /><Card className="p-5"><p className="text-sm text-gray-700">Open a .kharcha file or link someone sent you: an editable copy from an owner, or changes sent back to you. In the Android app, use this so the changes land in the app’s own data.</p>
    <input ref={input} data-testid="import-file-input" type="file" accept=".kharcha,application/octet-stream,application/json" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) open(await f.text()); e.target.value = ''; }} />
    <Button data-testid="import-file-button" onClick={() => input.current?.click()} className="mt-4 w-full bg-[#16834b] text-white hover:bg-[#11663b]"><Upload className="mr-2" size={16} />Choose .kharcha file</Button>
    <p className="mt-5 text-sm font-bold text-kharcha-navy">Or paste a Kharcha edit/update link</p>
    <textarea data-testid="import-link-input" value={pasted} onChange={e => setPasted(e.target.value)} rows={3} placeholder="https://www.kharchasplit.in/s/u…" className="mt-2 w-full rounded-lg border p-2 text-xs" />
    <Button data-testid="import-link-button" variant="outline" disabled={!pasted.trim()} onClick={() => open(pasted)} className="mt-2 w-full">Open link here</Button>
  </Card></div></main>;
}
