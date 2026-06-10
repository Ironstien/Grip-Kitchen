-- Safe completion of the master ingredients migration.
-- Run this in Supabase SQL Editor if 005 failed or you see
-- "Could not find the table public.ingredients" / price_unit_of_measure errors.
--
-- Safe to re-run. Skips steps already applied.

-- Prerequisite from 003 (inventory price unit column)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'inventory'
      AND column_name = 'price_unit_of_measure'
  ) THEN
    ALTER TABLE public.inventory
      ADD COLUMN price_unit_of_measure TEXT NOT NULL DEFAULT 'each';

    UPDATE public.inventory
    SET price_unit_of_measure = unit_of_measure;
  END IF;
END $$;

-- Master ingredients table
CREATE TABLE IF NOT EXISTS public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Pantry',
  unit_of_measure TEXT NOT NULL DEFAULT 'each',
  price_per_unit NUMERIC NOT NULL DEFAULT 0 CHECK (price_per_unit >= 0),
  price_unit_of_measure TEXT NOT NULL DEFAULT 'each',
  UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS ingredients_user_id_idx ON public.ingredients (user_id);

ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own ingredients" ON public.ingredients;

CREATE POLICY "Users manage own ingredients"
  ON public.ingredients FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Link pantry stock to master ingredients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'inventory'
      AND column_name = 'ingredient_id'
  ) THEN
    ALTER TABLE public.inventory
      ADD COLUMN ingredient_id UUID REFERENCES public.ingredients (id) ON DELETE CASCADE;
  END IF;
END $$;

-- Migrate legacy inventory rows (only while name column still exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'inventory'
      AND column_name = 'name'
  ) THEN
    INSERT INTO public.ingredients (
      user_id,
      name,
      category,
      unit_of_measure,
      price_per_unit,
      price_unit_of_measure
    )
    SELECT DISTINCT ON (user_id, lower(trim(name)))
      user_id,
      trim(name),
      category,
      unit_of_measure,
      price_per_unit,
      COALESCE(price_unit_of_measure, unit_of_measure, 'each')
    FROM public.inventory
    ORDER BY user_id, lower(trim(name)), id
    ON CONFLICT (user_id, name) DO NOTHING;

    UPDATE public.inventory AS stock
    SET ingredient_id = ingredient.id
    FROM public.ingredients AS ingredient
    WHERE stock.user_id = ingredient.user_id
      AND lower(trim(stock.name)) = lower(trim(ingredient.name))
      AND stock.ingredient_id IS NULL;
  END IF;
END $$;

-- Recipes reference master ingredients instead of pantry rows
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'recipe_ingredients'
      AND column_name = 'inventory_item_id'
  ) THEN
    ALTER TABLE public.recipe_ingredients
      ADD COLUMN IF NOT EXISTS ingredient_id UUID REFERENCES public.ingredients (id) ON DELETE RESTRICT;

    UPDATE public.recipe_ingredients AS link
    SET ingredient_id = stock.ingredient_id
    FROM public.inventory AS stock
    WHERE link.inventory_item_id = stock.id
      AND link.ingredient_id IS NULL;

    ALTER TABLE public.recipe_ingredients
      DROP CONSTRAINT IF EXISTS recipe_ingredients_inventory_item_id_fkey;

    ALTER TABLE public.recipe_ingredients
      DROP COLUMN inventory_item_id;

    ALTER TABLE public.recipe_ingredients
      ALTER COLUMN ingredient_id SET NOT NULL;

    ALTER TABLE public.recipe_ingredients
      DROP CONSTRAINT IF EXISTS recipe_ingredients_recipe_id_ingredient_id_key;

    ALTER TABLE public.recipe_ingredients
      ADD CONSTRAINT recipe_ingredients_recipe_id_ingredient_id_key
      UNIQUE (recipe_id, ingredient_id);
  END IF;
END $$;

-- Pantry rows hold stock state only
ALTER TABLE public.inventory DROP COLUMN IF EXISTS name;
ALTER TABLE public.inventory DROP COLUMN IF EXISTS category;
ALTER TABLE public.inventory DROP COLUMN IF EXISTS unit_of_measure;
ALTER TABLE public.inventory DROP COLUMN IF EXISTS price_per_unit;
ALTER TABLE public.inventory DROP COLUMN IF EXISTS price_unit_of_measure;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.inventory WHERE ingredient_id IS NULL) THEN
    ALTER TABLE public.inventory
      ALTER COLUMN ingredient_id SET NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS inventory_ingredient_id_idx ON public.inventory (ingredient_id);
