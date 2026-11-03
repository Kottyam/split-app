import { toast } from 'sonner';

/**
 * Shows a clear error popup, then highlights, scrolls to and focuses the field
 * that needs fixing. The highlight clears as soon as the user edits the field.
 */
export function showFieldError(fieldId: string, message: string): false {
  toast.error(message, { id: `field-error-${fieldId}` });
  if (typeof document === 'undefined') return false;
  const field = document.getElementById(fieldId) as HTMLElement | null;
  if (!field) return false;
  field.setAttribute('aria-invalid', 'true');
  field.setAttribute('data-field-error', 'true');
  const clear = () => {
    field.removeAttribute('aria-invalid');
    field.removeAttribute('data-field-error');
    field.removeEventListener('input', clear);
    field.removeEventListener('click', clear);
  };
  field.addEventListener('input', clear);
  field.addEventListener('click', clear);
  field.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  window.setTimeout(() => field.focus?.({ preventScroll: true }), 60);
  return false;
}
