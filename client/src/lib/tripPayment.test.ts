import { describe, expect, it } from 'vitest';
import { buildExpenseSplits, validateTripPaymentDetails } from './tripPayment';

describe('trip self-payment flow helpers', () => {
  it('validates prepared expense details before opening UPI', () => {
    expect(validateTripPaymentDetails('Kurkure', 20, 'member-1')).toBe(true);
    expect(validateTripPaymentDetails('', 20, 'member-1')).toBe(false);
    expect(validateTripPaymentDetails('Kurkure', 0, 'member-1')).toBe(false);
  });

  it('creates equal splits for the prepared trip expense', () => {
    expect(buildExpenseSplits(20, ['a', 'b'], 'equal')).toEqual({ a: 10, b: 10 });
  });

  it('creates and validates custom splits after payment confirmation', () => {
    expect(buildExpenseSplits(20, ['a', 'b'], 'custom', { a: 5, b: 15 })).toEqual({ a: 5, b: 15 });
    expect(() => buildExpenseSplits(20, ['a', 'b'], 'custom', { a: 5, b: 10 })).toThrow('Custom split');
  });
});


  it('supports explicit equal-all, equal-selected, and custom split modes', () => {
    expect(buildExpenseSplits(30, ['a', 'b', 'c'], 'equal-all')).toEqual({ a: 10, b: 10, c: 10 });
    expect(buildExpenseSplits(30, ['a', 'b'], 'equal-selected')).toEqual({ a: 15, b: 15 });
    expect(buildExpenseSplits(30, ['a', 'b'], 'custom', { a: 10, b: 20 })).toEqual({ a: 10, b: 20 });
    expect(() => buildExpenseSplits(30, ['a', 'b'], 'custom', { a: 10, b: 15 })).toThrow();
  });
