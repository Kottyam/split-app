/**
 * Core data types for Kharcha expense splitter app
 * All data persisted in local storage
 */

export type ExpenseCategory = 'food' | 'transport' | 'hotel' | 'shopping' | 'entertainment' | 'others';

export interface Member {
  id: string;
  name: string;
  mobileNumber?: string; // optional phone number
  upiId?: string; // optional UPI ID (e.g., name@okhdfcbank)
  joinedAt: number; // timestamp
}

export interface Expense {
  id: string;
  tripId: string;
  description: string;
  amount: number; // in rupees
  category: ExpenseCategory;
  paidBy: string; // member id
  date: number; // timestamp
  splits: Record<string, number>; // memberId -> amount they owe
  createdAt: number; // timestamp
  status?: 'active' | 'cancelled';
}

export interface BudgetConfig {
  amount: number;
  warningThreshold: number;
  createdAt: number;
  updatedAt: number;
}

export interface Trip {
  id: string;
  name: string;
  description: string;
  startDate: number; // timestamp
  endDate: number; // timestamp
  members: Member[];
  expenses: Expense[];
  budget?: BudgetConfig;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

export interface Debt {
  from: string; // member id (debtor)
  to: string; // member id (creditor)
  amount: number; // amount owed
}

export interface Settlement {
  from: string; // member name
  to: string; // member name
  fromId: string; // member id
  toId: string; // member id
  amount: number; // amount to transfer
  status?: 'pending' | 'paid' | 'received'; // payment status
}

export interface PaymentRecord {
  id: string;
  tripId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  status: 'pending' | 'paid' | 'received'; // pending, paid (sender marked), received (receiver marked)
  createdAt: number;
  updatedAt: number;
}

export interface TripSummary {
  tripId: string;
  totalExpenses: number;
  categoryBreakdown: Record<ExpenseCategory, number>;
  memberSpend: Record<string, number>; // memberId -> total spent
  memberOwes: Record<string, number>; // memberId -> total owed
  debts: Debt[];
  settlements: Settlement[];
}
