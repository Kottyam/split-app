import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; } };

describe('install prompt', () => {
  beforeEach(() => { for (const k of Object.keys(store)) delete store[k]; });
  it('snoozes for 7 days after Not now', async () => {
    const { isInstallPromptSnoozed, INSTALL_DISMISS_KEY } = await import('./InstallPromptDialog');
    const now = Date.now();
    expect(isInstallPromptSnoozed(now)).toBe(false);
    store[INSTALL_DISMISS_KEY] = String(now - 3 * 864e5);
    expect(isInstallPromptSnoozed(now)).toBe(true);
    store[INSTALL_DISMISS_KEY] = String(now - 8 * 864e5);
    expect(isInstallPromptSnoozed(now)).toBe(false);
  });
  it('is mounted app-wide and hidden when installed', () => {
    const app = readFileSync(resolve(process.cwd(), 'client/src/App.tsx'), 'utf8');
    const src = readFileSync(resolve(process.cwd(), 'client/src/components/InstallPromptDialog.tsx'), 'utf8');
    expect(app).toContain('<InstallPromptDialog />');
    expect(src).toContain('isInstalled()');
    expect(src).toContain('beforeinstallprompt');
  });
});
