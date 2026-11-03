import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

describe('form validation shows the reason and points at the field', () => {
  it('toasts the message and does not throw when the field is missing', async () => {
    const { showFieldError } = await import('./formValidation');
    const { toast } = await import('sonner');
    expect(showFieldError('nope', 'Please enter the member name.')).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Please enter the member name.', { id: 'field-error-nope' });
  });

  it.each([
    ['components/CreateTripDialog.tsx', ["showFieldError('trip-name'", "showFieldError('start-date'", "showFieldError('end-date'"]],
    ['components/AddMemberDialog.tsx', ["showFieldError('member-name'"]],
    ['components/AddExpenseDialog.tsx', ["showFieldError('description'", "showFieldError('amount'", "showFieldError('expense-paid-by'", "showFieldError('expense-split-members'"]],
    ['pages/CreateGroupFund.tsx', ["showFieldError('fund-name'"]],
    ['pages/GroupFundDetail.tsx', ["showFieldError('fund-expense-title'", "showFieldError('fund-expense-amount'", "showFieldError('fund-member-name'", 'id="fund-member-name"']],
  ])('%s highlights the specific field', (file, needles) => {
    const source = readFileSync(resolve(process.cwd(), 'client/src', file), 'utf8');
    for (const n of needles) expect(source).toContain(n);
    expect(source).toContain('noValidate');
  });
});

describe('toasts are visible', () => {
  it('mounts the Toaster app-wide so error popups actually render', () => {
    const app = readFileSync(resolve(process.cwd(), 'client/src/App.tsx'), 'utf8');
    expect(app).toContain('<Toaster');
  });
});
