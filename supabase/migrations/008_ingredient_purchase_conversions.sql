-- Purchase-format master ingredients, per-ingredient conversions, recipe units.
-- Safe to re-run.

-- New purchase & display columns on ingredients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ingredients' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE public.ingredients ADD COLUMN display_name TEXT NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ingredients' AND column_name = 'purchase_price'
  ) THEN
    ALTER TABLE public.ingredients ADD COLUMN purchase_price NUMERIC NOT NULL DEFAULT 0
      CHECK (purchase_price >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ingredients' AND column_name = 'purchase_qty'
  ) THEN
    ALTER TABLE public.ingredients ADD COLUMN purchase_qty NUMERIC NOT NULL DEFAULT 1
      CHECK (purchase_qty > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ingredients' AND column_name = 'purchase_unit'
  ) THEN
    ALTER TABLE public.ingredients ADD COLUMN purchase_unit TEXT NOT NULL DEFAULT 'each';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ingredients' AND column_name = 'stock_unit'
  ) THEN
    ALTER TABLE public.ingredients ADD COLUMN stock_unit TEXT NOT NULL DEFAULT 'each';
  END IF;
END $$;

-- Migrate legacy price/unit fields into purchase format
UPDATE public.ingredients
SET
  purchase_price = CASE
    WHEN purchase_price = 0 AND price_per_unit > 0 THEN price_per_unit
    ELSE purchase_price
  END,
  purchase_qty = CASE
    WHEN purchase_qty = 1 AND price_per_unit > 0 THEN 1
    ELSE purchase_qty
  END,
  purchase_unit = CASE
    WHEN purchase_unit = 'each' AND price_unit_of_measure IS NOT NULL AND price_unit_of_measure <> ''
      THEN price_unit_of_measure
    ELSE purchase_unit
  END,
  stock_unit = CASE
    WHEN stock_unit = 'each' AND unit_of_measure IS NOT NULL AND unit_of_measure <> ''
      THEN unit_of_measure
    ELSE stock_unit
  END
WHERE purchase_price = 0 OR purchase_unit = 'each' OR stock_unit = 'each';

-- Keep derived legacy columns in sync
UPDATE public.ingredients
SET
  price_per_unit = purchase_price / NULLIF(purchase_qty, 0),
  price_unit_of_measure = purchase_unit,
  unit_of_measure = stock_unit
WHERE purchase_qty > 0;

-- Per-ingredient conversion rules (1 from_unit = factor × to_unit)
CREATE TABLE IF NOT EXISTS public.ingredient_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES public.ingredients (id) ON DELETE CASCADE,
  from_unit TEXT NOT NULL,
  to_unit TEXT NOT NULL,
  factor NUMERIC NOT NULL CHECK (factor > 0),
  UNIQUE (ingredient_id, from_unit, to_unit)
);

CREATE INDEX IF NOT EXISTS ingredient_conversions_ingredient_id_idx
  ON public.ingredient_conversions (ingredient_id);

ALTER TABLE public.ingredient_conversions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own ingredient conversions" ON public.ingredient_conversions;

CREATE POLICY "Users manage own ingredient conversions"
  ON public.ingredient_conversions FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.ingredients
      WHERE ingredients.id = ingredient_conversions.ingredient_id
        AND ingredients.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.ingredients
      WHERE ingredients.id = ingredient_conversions.ingredient_id
        AND ingredients.user_id = auth.uid()
    )
  );

-- Recipe ingredients store the unit used in the recipe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'recipe_ingredients' AND column_name = 'required_unit'
  ) THEN
    ALTER TABLE public.recipe_ingredients ADD COLUMN required_unit TEXT NOT NULL DEFAULT 'each';
  END IF;
END $$;

-- Backfill recipe units from linked ingredient stock unit
UPDATE public.recipe_ingredients AS link
SET required_unit = ingredient.stock_unit
FROM public.ingredients AS ingredient
WHERE link.ingredient_id = ingredient.id
  AND (link.required_unit = 'each' OR link.required_unit IS NULL);
