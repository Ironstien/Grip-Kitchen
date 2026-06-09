-- User-managed units and conversion rules (seeded with Australian defaults on first use).
CREATE TABLE public.user_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  family TEXT NOT NULL CHECK (family IN ('mass', 'volume', 'count')),
  base_unit TEXT NOT NULL,
  to_base_multiplier NUMERIC NOT NULL CHECK (to_base_multiplier > 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (user_id, symbol)
);

CREATE INDEX user_units_user_id_idx ON public.user_units (user_id);

ALTER TABLE public.user_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own units"
  ON public.user_units FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
