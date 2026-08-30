import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PaymentOptionsDialogView } from './PaymentOptionsDialog';
import { Dialog } from '@/components/ui/dialog';
import { LanguageProvider, translate } from '@/contexts/LanguageContext';

describe('PaymentOptionsDialog localization', () => {
  it('renders localized payment actions', () => {
    const markup = renderToStaticMarkup(
      createElement(
        LanguageProvider,
        { initialLanguage: 'hi' },
        createElement(
          Dialog,
          { open: true },
          createElement(PaymentOptionsDialogView, {
            onOpenChange: () => undefined,
            onOpenUpiApp: () => undefined,
            onSharePaymentLink: () => undefined,
            memberName: 'Anu',
            amount: '250.00',
          }),
        ),
      ),
    );

    expect(markup).toContain('₹250.00');
    expect(markup).toContain(translate('hi', 'openUpiApp'));
    expect(markup).toContain(translate('hi', 'sharePaymentLink'));
  });
});
