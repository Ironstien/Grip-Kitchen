import { ensureUserProfile, tables } from '@/lib/database';
import { STARTER_EXPENSES } from '@/lib/finance/starterExpenses';
import { toError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import type {
  ExpenseFrequency,
  FinanceSettings,
  RecurringExpense,
  TablesInsert,
  TablesUpdate,
} from '@/types/database';

export type FinanceSettingsInput = {
  pay_amount: number;
  next_pay_date: string | null;
};

export type RecurringExpenseInput = {
  name: string;
  amount: number;
  frequency: ExpenseFrequency;
  due_day?: number | null;
  due_weekday?: number | null;
  anchor_date?: string | null;
  category?: string | null;
  is_active?: boolean;
};

export async function fetchFinanceSettings(): Promise<FinanceSettings | null> {
  const { data, error } = await supabase
    .from(tables.financeSettings)
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw toError(error, 'Could not load pay settings.');
  }

  return data;
}

export async function upsertFinanceSettings(input: FinanceSettingsInput): Promise<FinanceSettings> {
  const existing = await fetchFinanceSettings();
  const payload = {
    pay_amount: input.pay_amount,
    pay_frequency: 'fortnightly' as const,
    next_pay_date: input.next_pay_date,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { data, error } = await supabase
      .from(tables.financeSettings)
      .update(payload)
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) {
      throw toError(error, 'Could not save pay settings.');
    }

    return data;
  }

  const { data, error } = await supabase
    .from(tables.financeSettings)
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw toError(error, 'Could not save pay settings.');
  }

  return data;
}

export async function fetchRecurringExpenses(): Promise<RecurringExpense[]> {
  const { data, error } = await supabase
    .from(tables.recurringExpenses)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw toError(error, 'Could not load recurring expenses.');
  }

  return data ?? [];
}

function buildExpensePayload(input: RecurringExpenseInput): Omit<
  TablesInsert<'recurring_expenses'>,
  'user_id'
> {
  return {
    name: input.name.trim(),
    amount: input.amount,
    frequency: input.frequency,
    due_day: input.frequency === 'monthly' ? (input.due_day ?? null) : null,
    due_weekday: input.frequency === 'weekly' ? (input.due_weekday ?? null) : null,
    anchor_date:
      input.frequency === 'fortnightly' || input.frequency === 'yearly'
        ? (input.anchor_date ?? null)
        : null,
    category: input.category?.trim() || null,
    is_active: input.is_active ?? true,
  };
}

export async function createRecurringExpense(
  input: RecurringExpenseInput,
): Promise<RecurringExpense> {
  const trimmedName = input.name.trim();
  if (!trimmedName) {
    throw new Error('Expense name is required.');
  }

  if (input.amount < 0) {
    throw new Error('Amount must be zero or greater.');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  await ensureUserProfile();

  const { data, error } = await supabase
    .from(tables.recurringExpenses)
    .insert({
      user_id: user.id,
      ...buildExpensePayload(input),
    })
    .select('*')
    .single();

  if (error) {
    throw toError(error, 'Could not add expense.');
  }

  return data;
}

export async function updateRecurringExpense(
  id: string,
  input: RecurringExpenseInput,
): Promise<RecurringExpense> {
  const trimmedName = input.name.trim();
  if (!trimmedName) {
    throw new Error('Expense name is required.');
  }

  const payload: TablesUpdate<'recurring_expenses'> = buildExpensePayload({
    ...input,
    name: trimmedName,
  });

  const { data, error } = await supabase
    .from(tables.recurringExpenses)
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw toError(error, 'Could not update expense.');
  }

  return data;
}

export async function deleteRecurringExpense(id: string): Promise<void> {
  const { error } = await supabase.from(tables.recurringExpenses).delete().eq('id', id);

  if (error) {
    throw toError(error, 'Could not delete expense.');
  }
}

export async function setRecurringExpenseActive(
  id: string,
  isActive: boolean,
): Promise<RecurringExpense> {
  const { data, error } = await supabase
    .from(tables.recurringExpenses)
    .update({ is_active: isActive })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw toError(error, 'Could not update expense.');
  }

  return data;
}

export async function seedStarterExpenses(existing: RecurringExpense[]): Promise<number> {
  const existingNames = new Set(existing.map((expense) => expense.name));
  const toCreate = STARTER_EXPENSES.filter((expense) => !existingNames.has(expense.name));

  if (toCreate.length === 0) {
    return 0;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  await ensureUserProfile();

  const rows = toCreate.map((input) => ({
    user_id: user.id,
    ...buildExpensePayload(input),
  }));

  const { error } = await supabase.from(tables.recurringExpenses).insert(rows);

  if (error) {
    throw toError(error, 'Could not add starter expenses.');
  }

  return toCreate.length;
}
