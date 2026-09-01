export const SHARED_HOME_TYPE = 'shared_home' as const;

import type { BudgetConfig } from '@/types';

export type SharedHomeType = 'flat' | 'house' | 'hostel' | 'pg' | 'shared-room' | 'other';
export type StayDayBasis = 'calendar' | 'fixed30';
export type RentSplitMethod = 'equal-person' | 'equal-room' | 'room-fixed' | 'stay-days' | 'custom';
export type HouseholdExpenseKind = 'expense' | 'rent' | 'bill' | 'grocery';
export type HouseholdSplitMethod = 'equal' | 'stay-days' | 'selected' | 'room-based' | 'custom' | 'percentage';
export type HouseholdRecordStatus = 'active' | 'cancelled';
export type RecurringFrequency = 'monthly';
export type RecurringAmountMode = 'fixed' | 'variable';
export type RecurringStatus = 'active' | 'paused' | 'stopped';
export type RecurringPaymentResponsibility = 'shared_payer' | 'individual_shares';
export type PaymentMethod = 'upi' | 'cash' | 'bank-transfer' | 'other';

export interface RoomAssignment { roomId: string; startDate: number; endDate?: number; }
export interface PausePeriod { startDate: number; endDate?: number; reason?: string; }
export interface SharedHomeMember { id: string; name: string; mobileNumber: string; upiId?: string; email?: string; avatar?: string; moveInDate: number; moveOutDate?: number; pausePeriods?: PausePeriod[]; isActive: boolean; roomAssignments: RoomAssignment[]; createdAt: number; }
export interface SharedHomeRoom { id: string; name: string; defaultRent?: number; notes?: string; memberIds: string[]; createdAt: number; }
export interface RentAllocationLine { memberId: string; memberName: string; roomName?: string; applicableDays?: number; dailyRate?: number; calculatedAmount: number; adjustedAmount?: number; }
export interface RentConfig { totalRent: number; dueDate?: number; startDate: number; endDate?: number; frequency: RecurringFrequency; splitMethod: RentSplitMethod; stayDayBasis: StayDayBasis; autoGenerate: boolean; customAllocations?: Record<string, number>; roomAllocations?: Record<string, number>; roomMemberAllocations?: Record<string, Record<string, number>>; notes?: string; }
export interface RentPeriod { id: string; monthKey: string; totalRent: number; config: RentConfig; allocations: Record<string, number>; calculation: RentAllocationLine[]; adjustment?: { calculatedAmount: number; adjustedAmount: number; reason?: string; createdAt: number }; createdAt: number; updatedAt: number; }
export interface GroceryItem { id: string; name: string; amount: number; mode: 'common' | 'personal'; sharedBy: string[]; personalMemberId?: string; }
export interface HouseholdExpense { id: string; kind: HouseholdExpenseKind; name: string; category: string; amount: number; date: number; billingPeriod?: string; dueDate?: number; paidBy: string; sharedBy: string[]; splitMethod: HouseholdSplitMethod; shares: Record<string, number>; groceryItems?: GroceryItem[]; recurringRuleId?: string; notes?: string; receiptUrl?: string; status: HouseholdRecordStatus; createdAt: number; updatedAt: number; includeInBudget?: boolean; recurringPaymentResponsibility?: RecurringPaymentResponsibility; }
export interface RecurringRule { id: string; name: string; kind: Exclude<HouseholdExpenseKind, 'expense'> | 'expense'; category: string; frequency: RecurringFrequency; nextDueDate: number; startDate?: number; endDate?: number; autoAdd: boolean; amountMode: RecurringAmountMode; fixedAmount?: number; splitMethod: HouseholdSplitMethod; sharedBy: string[]; status: RecurringStatus; skipNext: boolean; includeInBudget?: boolean; createdAt: number; updatedAt: number; paymentResponsibility?: RecurringPaymentResponsibility; payerMemberId?: string; }
export interface HouseholdSettlement { id: string; fromMemberId: string; toMemberId: string; amount: number; date: number; paymentMethod: PaymentMethod; note?: string; status: 'recorded' | 'cancelled'; createdAt: number; }
export interface MonthlyBalance { memberId: string; share: number; paid: number; previousBalance?: number; balance: number; }
export interface SharedHomeMonth { monthKey: string; closedAt?: number; totalExpenses: number; totalShares: number; totalPaid: number; balances: MonthlyBalance[]; previousBalances?: Record<string, number>; }
export interface SharedHomeActivity { id: string; message: string; createdAt: number; }
export interface SharedHome { id: string; type: typeof SHARED_HOME_TYPE; name: string; homeType: SharedHomeType; startDate: number; address?: string; description?: string; managerMemberId?: string; setupStep?: 'members' | 'recurring' | 'ready'; members: SharedHomeMember[]; rooms: SharedHomeRoom[]; rentConfig?: RentConfig; rentPeriods: RentPeriod[]; expenses: HouseholdExpense[]; recurringRules: RecurringRule[]; settlements: HouseholdSettlement[]; months: Record<string, SharedHomeMonth>; monthlyBudgets?: Record<string, BudgetConfig>; budgetSettings?: { useSameBudgetEveryMonth: boolean; defaultAmount?: number; warningThreshold: number; updatedAt: number }; activity: SharedHomeActivity[]; createdAt: number; updatedAt: number; }
export interface SharedHomeSnapshot { type: typeof SHARED_HOME_TYPE; home: Pick<SharedHome, 'id' | 'name' | 'homeType' | 'startDate' | 'description' | 'members' | 'rooms' | 'rentPeriods' | 'expenses' | 'settlements' | 'months' | 'monthlyBudgets' | 'budgetSettings'>; generatedAt: number; range?: { startDate?: number; endDate?: number }; }
