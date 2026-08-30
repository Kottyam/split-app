import { nanoid } from 'nanoid';
import type { RentAllocationLine, RentConfig, RentPeriod } from './types';

export interface RentAdjustmentAudit {
  calculatedAmount: number;
  adjustedAmount: number;
  reason?: string;
  createdAt: number;
}

export interface BuildRentPeriodInput {
  previous?: RentPeriod;
  monthKey: string;
  config: RentConfig;
  allocations: Record<string, number>;
  calculation: RentAllocationLine[];
  adjustment?: RentAdjustmentAudit;
  now?: number;
}

export function buildRentPeriod({ previous, monthKey, config, allocations, calculation, adjustment, now = Date.now() }: BuildRentPeriodInput): RentPeriod {
  return {
    id: previous?.id ?? nanoid(),
    monthKey,
    totalRent: adjustment?.adjustedAmount ?? config.totalRent,
    config,
    allocations,
    calculation,
    createdAt: previous?.createdAt ?? now,
    adjustment,
    updatedAt: now,
  };
}

export function upsertRentPeriod(periods: RentPeriod[], period: RentPeriod): RentPeriod[] {
  const index = periods.findIndex(item => item.id === period.id);
  if (index < 0) return [...periods, period];
  return periods.map(item => item.id === period.id ? period : item);
}
