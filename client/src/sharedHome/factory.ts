import { nanoid } from 'nanoid';
import { SHARED_HOME_TYPE, type SharedHome, type SharedHomeType } from './types';

export function createSharedHome(input: {
  name: string;
  homeType: SharedHomeType;
  startDate: number;
  address?: string;
  description?: string;
  createdMessage?: string;
}): SharedHome {
  const now = Date.now();
  return {
    id: nanoid(),
    type: SHARED_HOME_TYPE,
    name: input.name.trim(),
    homeType: input.homeType,
    startDate: input.startDate,
    address: input.address?.trim() || undefined,
    description: input.description?.trim() || undefined,
    setupStep: 'members',
    members: [],
    rooms: [],
    rentPeriods: [],
    expenses: [],
    recurringRules: [],
    settlements: [],
    months: {},
    activity: [{
      id: nanoid(),
      message: input.createdMessage ?? `Shared Home “${input.name.trim()}” was created.`,
      createdAt: now,
    }],
    createdAt: now,
    updatedAt: now,
  };
}
