-- Master ingredient catalog (metadata) separate from pantry stock rows.
-- Requires 003_price_unit_of_measure.sql on inventory first.
-- If this fails partway, run 006_fix_ingredients_master_list.sql instead.

CREATE TABLE public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Pantry',
  unit_of_measure TEXT NOT NULL DEFAULT 'each',
  price_per_unit NUMERIC NOT NULL DEFAULT 0 CHECK (price_per_unit >= 0),
  price_unit_of_measure TEXT NOT NULL DEFAULT 'each',
  UNIQUE (user_id, name)
);

CREATE INDEX ingredients_user_id_idx ON public.ingredients (user_id);

ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own ingredients"
  ON public.ingredients FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Link pantry stock to master ingredients and migrate existing data.
ALTER TABLE public.inventory
  ADD COLUMN ingredient_id UUID REFERENCES public.ingredients (id) ON DELETE CASCADE;

INSERT INTO public.ingredients (user_id, name, category, unit_of_measure, price_per_unit, price_unit_of_measure)
SELECT DISTINCT ON (user_id, lower(trim(name)))
  user_id,
  trim(name),
  category,
  unit_of_measure,
  price_per_unit,
  COALESCE(price_unit_of_measure, unit_of_measure, 'each')
FROM public.inventory
ORDER BY user_id, lower(trim(name)), id;

UPDATE public.inventory AS stock
SET ingredient_id = ingredient.id
FROM public.ingredients AS ingredient
WHERE stock.user_id = ingredient.user_id
  AND lower(trim(stock.name)) = lower(trim(ingredient.name));

-- Recipes reference master ingredients, not pantry stock rows.
ALTER TABLE public.recipe_ingredients
  ADD COLUMN ingredient_id UUID REFERENCES public.ingredients (id) ON DELETE RESTRICT;

UPDATE public.recipe_ingredients AS link
SET ingredient_id = stock.ingredient_id
FROM public.inventory AS stock
WHERE link.inventory_item_id = stock.id;

ALTER TABLE public.recipe_ingredients
  DROP CONSTRAINT recipe_ingredients_inventory_item_id_fkey;

ALTER TABLE public.recipe_ingredients
  DROP COLUMN inventory_item_id;

ALTER TABLE public.recipe_ingredients
  ALTER COLUMN ingredient_id SET NOT NULL;

ALTER TABLE public.recipe_ingredients
  ADD CONSTRAINT recipe_ingredients_recipe_id_ingredient_id_key UNIQUE (recipe_id, ingredient_id);

-- Pantry rows hold stock state only.
ALTER TABLE public.inventory
  DROP COLUMN name,
  DROP COLUMN category,
  DROP COLUMN unit_of_measure,
  DROP COLUMN price_per_unit,
  DROP COLUMN price_unit_of_measure;

ALTER TABLE public.inventory
  ALTER COLUMN ingredient_id SET NOT NULL;

CREATE INDEX inventory_ingredient_id_idx ON public.inventory (ingredient_id);
