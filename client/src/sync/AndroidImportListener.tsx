import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { pathFromImport } from './serverlessSync';

declare global { interface Window { __kharchaPendingImport?: string } }

/** The Android app hands an opened .kharcha file to the page via a 'kharcha-import' event. */
export default function AndroidImportListener() {
  const [, navigate] = useLocation();
  useEffect(() => {
    const handle = (text: string | undefined) => {
      if (!text) return;
      window.__kharchaPendingImport = undefined;
      const path = pathFromImport(text);
      if (path) navigate(path); else toast.error('This is not a Kharcha sync file');
    };
    handle(window.__kharchaPendingImport);
    const listener = (event: Event) => handle((event as CustomEvent<string>).detail);
    window.addEventListener('kharcha-import', listener);
    return () => window.removeEventListener('kharcha-import', listener);
  }, [navigate]);
  return null;
}
