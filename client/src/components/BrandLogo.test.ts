import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import BrandLogo from './BrandLogo';
import { LanguageProvider } from '@/contexts/LanguageContext';

const renderLogo = (props?: React.ComponentProps<typeof BrandLogo>) => renderToStaticMarkup(
  React.createElement(LanguageProvider, { initialLanguage: 'en' }, React.createElement(BrandLogo, props)),
);

describe('BrandLogo', () => {
  it('renders the uploaded landing lockup with accessible alt text', () => {
    const markup = renderLogo();
    expect(markup).toContain('/manus-storage/kharcha-logo-mobile_25195552.png');
    expect(markup).not.toContain('bg-white');
    expect(markup).not.toContain('shadow-md');
    expect(markup).toContain('Kharcha — Split Smart Live Smart');
  });

  it('renders the compact uploaded mark for detail headers', () => {
    const markup = renderLogo({ variant: 'mark' });
    expect(markup).toContain('/manus-storage/kharcha-logo-transparent_b8cc8f74.png');
  });

  it('renders the exact attached logo only for the Landing Page variant', () => {
    const markup = renderLogo({ variant: 'landing', imageClassName: 'mix-blend-multiply' });
    expect(markup).toContain('/manus-storage/kharcha-landing-logo-reference_aaebb992.png');
    expect(markup).toContain('mix-blend-multiply');
  });
});
