import { ExpenseCategory } from '@/types';
import { UtensilsCrossed, Car, Hotel, ShoppingBag, Zap, MoreHorizontal } from 'lucide-react';

export interface CategoryInfo {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string; // Tailwind color class
  bgColor: string; // Tailwind bg color class
}

export const CATEGORIES: Record<ExpenseCategory, CategoryInfo> = {
  food: {
    label: 'Food',
    icon: UtensilsCrossed,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  transport: {
    label: 'Transport',
    icon: Car,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  hotel: {
    label: 'Hotel',
    icon: Hotel,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  shopping: {
    label: 'Shopping',
    icon: ShoppingBag,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
  },
  entertainment: {
    label: 'Entertainment',
    icon: Zap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  others: {
    label: 'Others',
    icon: MoreHorizontal,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
};

export function getCategoryInfo(category: ExpenseCategory): CategoryInfo {
  return CATEGORIES[category];
}

export function getAllCategories(): ExpenseCategory[] {
  return Object.keys(CATEGORIES) as ExpenseCategory[];
}
