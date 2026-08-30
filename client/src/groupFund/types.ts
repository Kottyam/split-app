export type GroupFundPurpose =
  | 'Office'
  | 'Club'
  | 'Outing'
  | 'Celebration'
  | 'Welfare'
  | 'Birthday'
  | 'Sports'
  | 'Common Collection'
  | 'Other';

export type ContributionType =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'one_time'
  | 'custom';

export type ContributionMethod = 'Cash' | 'UPI' | 'Bank' | 'Other';
export type RecurringFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'Fortnightly' | 'Yearly' | 'Custom';
export type AmountType = 'Default Amount' | 'Variable Amount';
export type WeeklyStartDay = 'Monday' | 'Sunday';
export type FortnightlyCycleBoundary = 'Monday-based 14-day cycle' | 'Sunday-based 14-day cycle' | 'Start-Date Based — Every 14 Days';
export type CustomIntervalUnit = 'days' | 'weeks' | 'months' | 'years';
export type MonthlyCycleType = 'Calendar Month (1st to End)' | 'Join-Date Cycle (e.g. 15th to 14th)';
export type ProrationRule = 'Full Amount' | 'Proportionate (Remaining Days)';
export type CollectionPeriodMode = 'past' | 'future';
export type MissedCollectionRule = 'carry_forward' | 'overdue' | 'skip_cycle';

export type ContributionStatus =
  | 'Pending'
  | 'Initiated'
  | 'Paid'
  | 'User Confirmed'
  | 'Failed'
  | 'Cancelled'
  | 'Partial'
  | 'Exempt';

export interface GroupFundMember {
  id: string;
  name: string;
  mobileNumber?: string;
  email?: string;
  employeeId?: string;
  dateJoined?: number;
  /** Date from which this member becomes applicable to recurring fund rules. */
  startDate?: string;
  contributionRule?: string;
  expectedAmount?: number;
  /** Optional amount to prefill for the next collection; this is not a contribution record. */
  savedCollectionAmount?: number;
  /** Excess paid amount carried forward for this member. */
  creditBalance?: number;
  /** Optional temporary stop window; historical contributions remain intact. */
  stopFrom?: string;
  stopUntil?: string;
  isActive: boolean;
  recurringActive?: boolean; // For Stop/Resume individual recurring collections
  createdAt: number;
}

export interface Contribution {
  id: string;
  fundId: string;
  memberId: string;
  amount: number;
  expectedAmount?: number;
  method: ContributionMethod;
  date: number;
  source?: string;
  status: ContributionStatus;
  note?: string;
  referenceNumber?: string;
  verifiedBy?: 'user_confirmed' | 'auto_verified' | 'payment_initiated';
  createdAt: number;
  updatedAt: number;
}

export interface GroupFundExpense {
  id: string;
  fundId: string;
  name: string;
  category: string;
  amount: number;
  date: number;
  note?: string;
  status: 'active' | 'cancelled';
  createdAt: number;
  updatedAt: number;
}

export interface GroupFund {
  id: string;
  type: 'group_fund';
  name: string;
  purpose: GroupFundPurpose;
  customPurpose?: string;
  description?: string;
  targetAmount?: number;
  startingBalance?: number;
  contributionType: ContributionType;
  defaultContributionAmount: number;
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  amountType?: AmountType;
  weeklyStartDay?: WeeklyStartDay;
  fortnightlyCycleBoundary?: FortnightlyCycleBoundary;
  customInterval?: number;
  customIntervalUnit?: CustomIntervalUnit;
  monthlyCycleType?: MonthlyCycleType;
  prorationRule?: ProrationRule;
  /** Official start date for recurring collection; ignored when isRecurring is false. */
  collectionStartDate?: string;
  collectionPeriodMode?: CollectionPeriodMode;
  /** Explicit timing for generated recurring collections; previous = completed prior period, advance = current period. */
  collectionTiming?: 'previous' | 'advance';
  /** Optional recurrence duration controls. */
  recurrenceEndDate?: string;
  recurrenceNumberOfCycles?: number;
  gracePeriodDays?: 0 | 1 | 2 | 3 | 7;
  missedCollectionRule?: MissedCollectionRule;
  members: GroupFundMember[];
  contributions: Contribution[];
  expenses?: GroupFundExpense[];
  activity?: {
    id: string;
    message: string;
    createdAt: number;
  }[];
  /** Period labels closed by the manager; absent means all legacy periods remain open. */
  closedPeriods?: string[];
  paymentConfig?: {
    upiId?: string;
    qrCodeUrl?: string;
  };
  createdAt: number;
  updatedAt: number;
}
