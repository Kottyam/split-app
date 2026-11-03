import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('GitHub Pages deep links', () => {
  it('pins <base href="/"> first in <head> on kharchasplit.in so /s/ links load assets', () => {
    const html = readFileSync(resolve(process.cwd(), 'client/index.html'), 'utf8');
    const head = html.slice(html.indexOf('<head>'));
    expect(head).toContain(`document.write('<base href="/">')`);
    expect(head.indexOf('<base href')).toBeLessThan(head.indexOf('<meta charset'));
  });
});
