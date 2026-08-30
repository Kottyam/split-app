import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import SharedTripViewOnlyHeader from './SharedTripViewOnlyHeader';
import { LanguageProvider } from '@/contexts/LanguageContext';

describe('SharedTripViewOnlyHeader', () => {
  it('renders only view-only copy actions and no edit controls', () => {
    const markup = renderToStaticMarkup(
      createElement(
        LanguageProvider,
        null,
        createElement(SharedTripViewOnlyHeader, {
          tripName: 'Goa Weekend Trip',
          onBack: () => undefined,
          onCopy: () => undefined,
        }),
      ),
    );

    expect(markup).toContain('Goa Weekend Trip');
    expect(markup).toContain('Kharcha');
    expect(markup).toContain('Copy Link');
    expect(markup).not.toContain('Edit');
    expect(markup).not.toContain('Pencil');
  });
});
