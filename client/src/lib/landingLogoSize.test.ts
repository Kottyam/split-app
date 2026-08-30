import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) => fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('Landing logo size', () => {
  it('uses the larger Landing header lockup without changing the logo asset or actions', () => {
    const home = read('client/src/pages/Home.tsx');
    expect(home).toContain('variant="landing" imageClassName="mix-blend-multiply" className="w-40 sm:w-52"');
    expect(home).toContain("navigate('/search')");
    expect(home).toContain("navigate('/notifications')");
    expect(home).toContain('setShowSettings(true)');
  });

  it('keeps the one-time Help & Guide entry separate from the Landing header adjustment', () => {
    const home = read('client/src/pages/Home.tsx');
    expect(home).toContain("localStorage.getItem('hasSeenHelpGuide')");
    expect(home).toContain('<HelpGuideModal');
  });
});
