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
    expect(markup).toContain('/icons/kharcha-logo-mobile.webp');
    expect(markup).not.toContain('bg-white');
    expect(markup).not.toContain('shadow-md');
    expect(markup).toContain('Kharcha — Split Smart Live Smart');
  });

  it('renders the compact uploaded mark for detail headers', () => {
    const markup = renderLogo({ variant: 'mark' });
    expect(markup).toContain('/icons/kharcha-logo-mark.png');
  });

  it('renders the exact attached logo only for the Landing Page variant', () => {
    const markup = renderLogo({ variant: 'landing', imageClassName: 'mix-blend-multiply' });
    expect(markup).toContain('/icons/kharcha-logo-landing.png');
    expect(markup).toContain('mix-blend-multiply');
  });
});
