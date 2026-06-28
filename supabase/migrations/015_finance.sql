-- Finance: pay settings and recurring expenses (shared household)

CREATE TABLE public.finance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pay_amount NUMERIC NOT NULL DEFAULT 0 CHECK (pay_amount >= 0),
  pay_frequency TEXT NOT NULL DEFAULT 'fortnightly' CHECK (pay_frequency = 'fortnightly'),
  next_pay_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.recurring_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'fortnightly', 'monthly', 'yearly')),
  due_day SMALLINT CHECK (due_day IS NULL OR (due_day >= 1 AND due_day <= 31)),
  due_weekday SMALLINT CHECK (due_weekday IS NULL OR (due_weekday >= 0 AND due_weekday <= 6)),
  anchor_date DATE,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX recurring_expenses_created_at_idx ON public.recurring_expenses (created_at DESC);
CREATE INDEX recurring_expenses_is_active_idx ON public.recurring_expenses (is_active);

ALTER TABLE public.finance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shared_all_finance_settings"
  ON public.finance_settings FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "shared_all_recurring_expenses"
  ON public.recurring_expenses FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'finance_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.finance_settings;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'recurring_expenses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.recurring_expenses;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
