import { useState, useEffect, useCallback } from 'react';
import { Trip, Member, Expense, ExpenseCategory } from '@/types';
import { getAllTrips, saveTrip, deleteTrip, getTripById, initializeStorage } from '@/lib/storage';
import { nanoid } from 'nanoid';

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Kharcha is offline-first and now opens directly without authentication.
  useEffect(() => {
    initializeStorage();
    const allTrips = getAllTrips();
    setTrips(allTrips);
    setIsLoading(false);
  }, []);

  const createTrip = useCallback((name: string, description: string, startDate: number, endDate: number) => {
    const newTrip: Trip = {
      id: nanoid(),
      name,
      description,
      startDate,
      endDate,
      members: [],
      expenses: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveTrip(newTrip);
    setTrips(prev => [...prev, newTrip]);
    return newTrip;
  }, []);

  const updateTrip = useCallback((trip: Trip) => {
    trip.updatedAt = Date.now();
    saveTrip(trip);
    setTrips(prev => prev.map(t => t.id === trip.id ? trip : t));
  }, []);

  const removeTrip = useCallback((tripId: string) => {
    deleteTrip(tripId);
    setTrips(prev => prev.filter(t => t.id !== tripId));
  }, []);

  const addMember = useCallback((tripId: string, name: string, mobileNumber?: string, upiId?: string) => {
    const trip = getTripById(tripId);
    if (!trip) return;

    const newMember: Member = {
      id: nanoid(),
      name,
      mobileNumber,
      upiId,
      joinedAt: Date.now(),
    };

    trip.members.push(newMember);
    updateTrip(trip);
  }, [updateTrip]);

  const updateMember = useCallback((tripId: string, memberId: string, updates: Partial<Member>) => {
    const trip = getTripById(tripId);
    if (!trip) return;

    const memberIndex = trip.members.findIndex(m => m.id === memberId);
    if (memberIndex >= 0) {
      trip.members[memberIndex] = { ...trip.members[memberIndex], ...updates };
      updateTrip(trip);
    }
  }, [updateTrip]);

  const removeMember = useCallback((tripId: string, memberId: string) => {
    const trip = getTripById(tripId);
    if (!trip) return;

    trip.members = trip.members.filter(m => m.id !== memberId);
    // Remove all expenses paid by this member and remove member from all splits
    trip.expenses = trip.expenses
      .filter(e => e.paidBy !== memberId)
      .map(e => {
        const { [memberId]: _, ...rest } = e.splits;
        return { ...e, splits: rest };
      });
    // Clean up expenses with no splits
    trip.expenses = trip.expenses.filter(e => Object.keys(e.splits).length > 0);
    updateTrip(trip);
  }, [updateTrip]);

  const addExpense = useCallback((
    tripId: string,
    description: string,
    amount: number,
    category: ExpenseCategory,
    paidBy: string,
    date: number,
    splits: Record<string, number>
  ) => {
    const trip = getTripById(tripId);
    if (!trip) return;

    const newExpense: Expense = {
      id: nanoid(),
      tripId,
      description,
      amount,
      category,
      paidBy,
      date,
      splits,
      createdAt: Date.now(),
    };

    trip.expenses.push(newExpense);
    updateTrip(trip);
    return newExpense;
  }, [updateTrip]);

  const updateExpense = useCallback((tripId: string, expenseId: string, updates: Partial<Expense>) => {
    const trip = getTripById(tripId);
    if (!trip) return;

    const expenseIndex = trip.expenses.findIndex(e => e.id === expenseId);
    if (expenseIndex >= 0) {
      trip.expenses[expenseIndex] = { ...trip.expenses[expenseIndex], ...updates };
      updateTrip(trip);
    }
  }, [updateTrip]);

  const removeExpense = useCallback((tripId: string, expenseId: string) => {
    const trip = getTripById(tripId);
    if (!trip) return;

    trip.expenses = trip.expenses.filter(e => e.id !== expenseId);
    updateTrip(trip);
  }, [updateTrip]);

  return {
    trips,
    isLoading,
    createTrip,
    updateTrip,
    removeTrip,
    addMember,
    updateMember,
    removeMember,
    addExpense,
    updateExpense,
    removeExpense,
  };
}
