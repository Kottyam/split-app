import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Home More menu', () => {
  const source = readFileSync(resolve(process.cwd(), 'client/src/pages/More.tsx'), 'utf8');

  it('opens at the top and does not render the Edit and Synchronize entry', () => {
    expect(source).toContain("window.scrollTo({ top: 0, left: 0, behavior: 'auto' });");
    expect(source).not.toContain("path: '/sync-updates'");
    expect(source).not.toContain("t('editAndSyncTitle'");
  });

  it('preserves the existing More destinations and Settings action', () => {
    expect(source).toContain("path: '/group-funds'");
    expect(source).toContain("path: '/trips'");
    expect(source).toContain("path: '/shared-homes'");
    expect(source).toContain("path: '/personal-budget'");
    expect(source).toContain("t('settings'");
  });
});
