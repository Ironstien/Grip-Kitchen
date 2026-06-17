-- Shopping list sessions (named lists with archive support)
-- ---------------------------------------------------------------------------
CREATE TABLE public.shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  meal_plan_week_start DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX shopping_lists_user_id_idx ON public.shopping_lists (user_id);
CREATE INDEX shopping_lists_user_status_idx ON public.shopping_lists (user_id, status);

ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own shopping lists"
  ON public.shopping_lists FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Link existing shopping list rows to session headers
ALTER TABLE public.shopping_list
  ADD COLUMN shopping_list_id UUID REFERENCES public.shopping_lists (id) ON DELETE CASCADE;

INSERT INTO public.shopping_lists (user_id, name, status)
SELECT DISTINCT user_id, to_char(CURRENT_DATE, 'YYYY-MM-DD'), 'active'
FROM public.shopping_list;

UPDATE public.shopping_list AS item
SET shopping_list_id = header.id
FROM public.shopping_lists AS header
WHERE item.user_id = header.user_id
  AND item.shopping_list_id IS NULL;

CREATE INDEX shopping_list_session_id_idx ON public.shopping_list (shopping_list_id);

-- One recipe per meal slot per day per user
ALTER TABLE public.meal_plan
  ADD CONSTRAINT meal_plan_user_date_label_key UNIQUE (user_id, planned_date, meal_label);
