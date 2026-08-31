import { roundMoney, splitHouseholdExpense } from './calculations';
import type { RecurringPaymentResponsibility, RecurringRule, SharedHome } from './types';

export function resolveRecurringPayment(rule: RecurringRule, home: SharedHome): {
  payerMemberId?: string;
  shares: Record<string, number>;
  paymentResponsibility: RecurringPaymentResponsibility;
} {
  const activeIds = home.members.filter(member => member.isActive).map(member => member.id);
  const sharedBy = (rule.sharedBy.length ? rule.sharedBy : activeIds).filter(id => activeIds.includes(id));
  const paymentResponsibility = rule.paymentResponsibility ?? 'shared_payer';
  const payerMemberId = paymentResponsibility === 'shared_payer'
    ? (rule.payerMemberId && sharedBy.includes(rule.payerMemberId) ? rule.payerMemberId : sharedBy[0])
    : undefined;
  const amount = Number(rule.fixedAmount ?? 0);
  const shares = splitHouseholdExpense(amount, sharedBy, rule.splitMethod === 'custom' ? 'custom' : rule.splitMethod === 'percentage' ? 'percentage' : 'equal');
  return { payerMemberId, shares, paymentResponsibility };
}

export function amountPayableByMember(rule: RecurringRule, home: SharedHome, memberId: string): number {
  const resolved = resolveRecurringPayment(rule, home);
  return roundMoney(resolved.shares[memberId] ?? 0);
}
