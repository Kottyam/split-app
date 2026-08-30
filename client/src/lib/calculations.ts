import { Trip, Debt, Settlement, TripSummary, ExpenseCategory } from '@/types';

/**
 * Calculate total amount each member spent and owes
 */
export function calculateMemberBalances(trip: Trip): {
  spent: Record<string, number>;
  owed: Record<string, number>;
} {
  const spent: Record<string, number> = {};
  const owed: Record<string, number> = {};

  // Initialize all members
  trip.members.forEach(member => {
    spent[member.id] = 0;
    owed[member.id] = 0;
  });

  // Calculate from expenses
  trip.expenses.forEach(expense => {
    spent[expense.paidBy] = (spent[expense.paidBy] || 0) + expense.amount;
    
    Object.entries(expense.splits).forEach(([memberId, amount]) => {
      owed[memberId] = (owed[memberId] || 0) + amount;
    });
  });

  return { spent, owed };
}

/**
 * Calculate net balance for each member (positive = owed money, negative = owes money)
 */
export function calculateNetBalances(trip: Trip): Record<string, number> {
  const { spent, owed } = calculateMemberBalances(trip);
  const balances: Record<string, number> = {};

  trip.members.forEach(member => {
    balances[member.id] = (spent[member.id] || 0) - (owed[member.id] || 0);
  });

  return balances;
}

/**
 * Calculate all debts between members
 */
export function calculateDebts(trip: Trip): Debt[] {
  const debts: Debt[] = [];
  const balances = calculateNetBalances(trip);

  trip.members.forEach(member => {
    const balance = balances[member.id] || 0;
    if (balance < 0) {
      // This member owes money
      trip.members.forEach(creditor => {
        const creditorBalance = balances[creditor.id] || 0;
        if (creditorBalance > 0) {
          debts.push({
            from: member.id,
            to: creditor.id,
            amount: Math.abs(balance), // placeholder, will be simplified
          });
        }
      });
    }
  });

  return debts;
}

/**
 * Simplify debts to minimal transactions needed to settle all debts
 * Uses greedy algorithm to match debtors with creditors
 */
export function simplifySettlements(trip: Trip): Settlement[] {
  const balances = calculateNetBalances(trip);
  const memberMap = new Map(trip.members.map(m => [m.id, m.name]));

  const debtors: Array<{ id: string; amount: number }> = [];
  const creditors: Array<{ id: string; amount: number }> = [];

  Object.entries(balances).forEach(([memberId, balance]) => {
    if (balance < 0) {
      debtors.push({ id: memberId, amount: Math.abs(balance) });
    } else if (balance > 0) {
      creditors.push({ id: memberId, amount: balance });
    }
  });

  const settlements: Settlement[] = [];

  while (debtors.length > 0 && creditors.length > 0) {
    const debtor = debtors[0];
    const creditor = creditors[0];

    const amount = Math.min(debtor.amount, creditor.amount);

    settlements.push({
      from: memberMap.get(debtor.id) || debtor.id,
      to: memberMap.get(creditor.id) || creditor.id,
      fromId: debtor.id,
      toId: creditor.id,
      amount: Math.round(amount * 100) / 100, // Round to 2 decimals
      status: 'pending',
    });

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount === 0) debtors.shift();
    if (creditor.amount === 0) creditors.shift();
  }

  return settlements;
}

/**
 * Calculate category breakdown for a trip
 */
export function calculateCategoryBreakdown(trip: Trip): Record<ExpenseCategory, number> {
  const breakdown: Record<ExpenseCategory, number> = {
    food: 0,
    transport: 0,
    hotel: 0,
    shopping: 0,
    entertainment: 0,
    others: 0,
  };

  trip.expenses.forEach(expense => {
    breakdown[expense.category] += expense.amount;
  });

  return breakdown;
}

/**
 * Generate complete trip summary
 */
export function generateTripSummary(trip: Trip): TripSummary {
  const { spent } = calculateMemberBalances(trip);
  const totalExpenses = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
  const categoryBreakdown = calculateCategoryBreakdown(trip);
  const { owed } = calculateMemberBalances(trip);
  const settlements = simplifySettlements(trip);

  return {
    tripId: trip.id,
    totalExpenses,
    categoryBreakdown,
    memberSpend: spent,
    memberOwes: owed,
    debts: calculateDebts(trip),
    settlements,
  };
}
