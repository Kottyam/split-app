import { Card } from '@/components/ui/card';
import { Link } from 'wouter';

/** Old server-based /edit-sync and /sync-review links no longer work. */
export default function OldSyncLink() {
  return <main className="mx-auto max-w-xl p-4"><Card data-testid="old-sync-link" className="p-5"><h1 className="text-xl font-black text-kharcha-navy">This link type is no longer supported</h1><p className="mt-2 text-sm text-gray-700">Kharcha no longer uses a server for Edit &amp; Sync. Ask the owner for a new “Share for editing” link.</p><Link href="/" className="mt-4 inline-block font-bold text-[#16834b]">Go to Kharcha home</Link></Card></main>;
}
