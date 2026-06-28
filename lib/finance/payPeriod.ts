import type { ExpenseFrequency, RecurringExpense } from '@/types/database';

export type DueExpense = {
  expense: RecurringExpense;
  dueDate: Date;
};

export type PayPeriodSummary = {
  dueBeforePay: DueExpense[];
  committedTotal: number;
  remainingTotal: number;
  daysUntilPay: number | null;
};

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return startOfDay(new Date(year, month - 1, day));
}

export function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return startOfDay(next);
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function clampDueDay(year: number, monthIndex: number, dueDay: number): number {
  return Math.min(dueDay, daysInMonth(year, monthIndex));
}

function getWeeklyOccurrences(
  expense: RecurringExpense,
  windowStart: Date,
  windowEndExclusive: Date,
): Date[] {
  if (expense.due_weekday == null) {
    return [];
  }

  const dates: Date[] = [];
  let cursor = new Date(windowStart);

  while (cursor.getDay() !== expense.due_weekday) {
    cursor = addDays(cursor, 1);
    if (cursor >= windowEndExclusive) {
      return dates;
    }
  }

  while (cursor < windowEndExclusive) {
    dates.push(new Date(cursor));
    cursor = addDays(cursor, 7);
  }

  return dates;
}

function getFortnightlyOccurrences(
  expense: RecurringExpense,
  windowStart: Date,
  windowEndExclusive: Date,
): Date[] {
  if (!expense.anchor_date) {
    return [];
  }

  const anchor = parseISODate(expense.anchor_date);
  const dates: Date[] = [];
  let cursor = new Date(anchor);

  if (cursor < windowStart) {
    const daysSinceAnchor = Math.floor(
      (windowStart.getTime() - anchor.getTime()) / 86_400_000,
    );
    const periodsElapsed = Math.floor(daysSinceAnchor / 14);
    cursor = addDays(anchor, periodsElapsed * 14);
    if (cursor < windowStart) {
      cursor = addDays(cursor, 14);
    }
  }

  while (cursor < windowEndExclusive) {
    if (cursor >= windowStart) {
      dates.push(new Date(cursor));
    }
    cursor = addDays(cursor, 14);
  }

  return dates;
}

function getMonthlyOccurrences(
  expense: RecurringExpense,
  windowStart: Date,
  windowEndExclusive: Date,
): Date[] {
  if (expense.due_day == null) {
    return [];
  }

  const dates: Date[] = [];
  let year = windowStart.getFullYear();
  let month = windowStart.getMonth();

  while (true) {
    const day = clampDueDay(year, month, expense.due_day);
    const candidate = startOfDay(new Date(year, month, day));

    if (candidate >= windowEndExclusive) {
      break;
    }

    if (candidate >= windowStart) {
      dates.push(candidate);
    }

    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }

    const nextCandidateDay = clampDueDay(year, month, expense.due_day);
    const nextCandidate = startOfDay(new Date(year, month, nextCandidateDay));
    if (nextCandidate >= windowEndExclusive && dates.length > 0) {
      break;
    }

    if (year > windowEndExclusive.getFullYear() + 1) {
      break;
    }
  }

  return dates;
}

function getYearlyOccurrences(
  expense: RecurringExpense,
  windowStart: Date,
  windowEndExclusive: Date,
): Date[] {
  if (!expense.anchor_date) {
    return [];
  }

  const anchor = parseISODate(expense.anchor_date);
  const dates: Date[] = [];
  let year = windowStart.getFullYear();

  while (year <= windowEndExclusive.getFullYear() + 1) {
    const day = clampDueDay(year, anchor.getMonth(), anchor.getDate());
    const candidate = startOfDay(new Date(year, anchor.getMonth(), day));

    if (candidate >= windowEndExclusive) {
      break;
    }

    if (candidate >= windowStart) {
      dates.push(candidate);
    }

    year += 1;
  }

  return dates;
}

export function getOccurrencesInWindow(
  expense: RecurringExpense,
  windowStart: Date,
  windowEndExclusive: Date,
): Date[] {
  switch (expense.frequency) {
    case 'weekly':
      return getWeeklyOccurrences(expense, windowStart, windowEndExclusive);
    case 'fortnightly':
      return getFortnightlyOccurrences(expense, windowStart, windowEndExclusive);
    case 'monthly':
      return getMonthlyOccurrences(expense, windowStart, windowEndExclusive);
    case 'yearly':
      return getYearlyOccurrences(expense, windowStart, windowEndExclusive);
    default:
      return [];
  }
}

export function getDueBeforeNextPay(
  expenses: RecurringExpense[],
  nextPayDate: Date,
  today: Date = startOfDay(new Date()),
): DueExpense[] {
  const windowStart = today;
  const windowEndExclusive = startOfDay(nextPayDate);
  const dueItems: DueExpense[] = [];

  for (const expense of expenses) {
    if (!expense.is_active) {
      continue;
    }

    const occurrences = getOccurrencesInWindow(expense, windowStart, windowEndExclusive);
    for (const dueDate of occurrences) {
      dueItems.push({ expense, dueDate });
    }
  }

  return dueItems.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

export function computePayPeriodSummary(
  payAmount: number,
  nextPayDateISO: string | null,
  expenses: RecurringExpense[],
  today: Date = startOfDay(new Date()),
): PayPeriodSummary {
  if (!nextPayDateISO) {
    return {
      dueBeforePay: [],
      committedTotal: 0,
      remainingTotal: payAmount,
      daysUntilPay: null,
    };
  }

  const nextPayDate = parseISODate(nextPayDateISO);
  const dueBeforePay = getDueBeforeNextPay(expenses, nextPayDate, today);
  const committedTotal = dueBeforePay.reduce((sum, item) => sum + item.expense.amount, 0);
  const daysUntilPay = Math.max(
    0,
    Math.round((nextPayDate.getTime() - today.getTime()) / 86_400_000),
  );

  return {
    dueBeforePay,
    committedTotal,
    remainingTotal: payAmount - committedTotal,
    daysUntilPay,
  };
}

export const FREQUENCY_LABELS: Record<ExpenseFrequency, string> = {
  weekly: 'Weekly',
  fortnightly: 'Fortnightly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export const WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export function describeDueRule(expense: RecurringExpense): string {
  switch (expense.frequency) {
    case 'weekly':
      return expense.due_weekday != null ? `Every ${WEEKDAY_LABELS[expense.due_weekday]}` : 'Weekly';
    case 'fortnightly':
      return expense.anchor_date
        ? `Every 2 weeks from ${expense.anchor_date}`
        : 'Fortnightly';
    case 'monthly':
      return expense.due_day != null ? `Day ${expense.due_day} each month` : 'Monthly';
    case 'yearly':
      return expense.anchor_date ? `Yearly on ${expense.anchor_date}` : 'Yearly';
    default:
      return expense.frequency;
  }
}
