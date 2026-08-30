import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Landing page logo loading', () => {
  it('preloads the exact existing Landing logo asset', () => {
    const html = readFileSync(resolve(process.cwd(), 'client/index.html'), 'utf8');
    expect(html).toContain('rel="preload" as="image"');
    expect(html).toContain('/manus-storage/kharcha-landing-logo-reference_aaebb992.png');
    expect(html).toContain('fetchpriority="high"');
  });

  it('prioritizes only the landing BrandLogo variant', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/components/BrandLogo.tsx'), 'utf8');
    expect(source).toContain("const isLandingLogo = variant === 'landing';");
    expect(source).toContain("loading={isLandingLogo ? 'eager' : undefined}");
    expect(source).toContain("fetchPriority={isLandingLogo ? 'high' : undefined}");
    expect(source).toContain('KHARCHA_LOGO_LOCKUP');
  });
});
