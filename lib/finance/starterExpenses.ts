import type { RecurringExpenseInput } from '@/lib/services/finance';

/** Household starter bills — seeded once when Finance has no matching entries. */
export const STARTER_EXPENSES: RecurringExpenseInput[] = [
  {
    name: 'Maroondah City Council Rates',
    amount: 203,
    frequency: 'yearly',
    anchor_date: '2026-06-29',
    category: 'Housing',
  },
  {
    name: 'Credit Corp',
    amount: 50,
    frequency: 'weekly',
    due_weekday: 2, // Tuesday (June 30 & July 7, 2026)
    category: 'Debt',
  },
  {
    name: 'NYT Games',
    amount: 2.99,
    frequency: 'monthly',
    due_day: 2,
    category: 'Subscriptions',
  },
  {
    name: 'Spotify',
    amount: 15.99,
    frequency: 'monthly',
    due_day: 7,
    category: 'Subscriptions',
  },
  {
    name: 'Fuel',
    amount: 100,
    frequency: 'monthly',
    due_day: 1,
    category: 'Variable',
  },
];

export const STARTER_EXPENSE_NAMES = new Set(STARTER_EXPENSES.map((expense) => expense.name));
