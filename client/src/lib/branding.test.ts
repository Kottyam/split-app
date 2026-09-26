import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = resolve(process.cwd());
const indexHtml = readFileSync(resolve(projectRoot, 'client/index.html'), 'utf8');
const manifest = readFileSync(resolve(projectRoot, 'client/public/manifest.json'), 'utf8');

describe('Kharcha app branding', () => {
  it('uses Kharcha-owned browser metadata and the supplied logo asset', () => {
    expect(indexHtml).toContain('<title>Kharcha - Expense Splitter</title>');
    expect(indexHtml).toContain('name="application-name" content="Kharcha"');
    expect(indexHtml).toContain('./icons/kharcha-logo-mark.png');
    expect(indexHtml.replace(/\/manus-storage\/[^\s"']+/g, '').toLowerCase()).not.toContain('manus');
  });

  it('uses Kharcha-owned installed-app metadata and logo icon', () => {
    expect(manifest).toContain('"short_name": "Kharcha"');
    expect(manifest).toContain('"name": "Kharcha - Expense Splitter"');
    expect(manifest).toContain('./icons/kharcha-logo-mark.png');
    expect(manifest.replace(/\/manus-storage\/[^\s"']+/g, '').toLowerCase()).not.toContain('manus');
    expect(manifest).not.toContain('manus.space');
    expect(manifest).not.toContain('manus-storage');
  });
});
