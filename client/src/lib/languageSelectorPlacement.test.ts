import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

const readSource = (relativePath: string) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');

describe('language selector placement', () => {
  it('includes the selector in the Welcome popup and Settings dialog', () => {
    const home = readSource('../pages/Home.tsx');
    const settings = readSource('../components/AppSettingsDialog.tsx');

    expect(home).toContain('LanguageSelector');
    expect(settings).toContain('LanguageSelector');
  });

  it('keeps the selector out of inner pages', () => {
    const tripDetail = readSource('../pages/TripDetail.tsx');
    const sharedTripHeader = readSource('../components/SharedTripViewOnlyHeader.tsx');

    expect(tripDetail).not.toContain('LanguageSelector');
    expect(sharedTripHeader).not.toContain('LanguageSelector');
  });
});
