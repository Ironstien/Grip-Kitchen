-- User-managed ingredient categories (seeded with defaults on first use).
CREATE TABLE IF NOT EXISTS public.user_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS user_categories_user_id_idx ON public.user_categories (user_id);

ALTER TABLE public.user_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own categories" ON public.user_categories;

CREATE POLICY "Users manage own categories"
  ON public.user_categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
