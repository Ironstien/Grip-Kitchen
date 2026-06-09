-- Grip Kitchen initial schema with Row Level Security

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Users (profile table linked to auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Storage locations
-- ---------------------------------------------------------------------------
CREATE TABLE public.storage_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX storage_locations_user_id_idx ON public.storage_locations (user_id);

ALTER TABLE public.storage_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own storage locations"
  ON public.storage_locations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Inventory
-- ---------------------------------------------------------------------------
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Pantry',
  quantity NUMERIC NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit_of_measure TEXT NOT NULL DEFAULT 'each',
  price_per_unit NUMERIC NOT NULL DEFAULT 0 CHECK (price_per_unit >= 0),
  expiration_date DATE,
  location_id UUID REFERENCES public.storage_locations (id) ON DELETE SET NULL,
  min_threshold NUMERIC NOT NULL DEFAULT 0 CHECK (min_threshold >= 0)
);

CREATE INDEX inventory_user_id_idx ON public.inventory (user_id);
CREATE INDEX inventory_location_id_idx ON public.inventory (location_id);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own inventory"
  ON public.inventory FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Recipes
-- ---------------------------------------------------------------------------
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL DEFAULT '',
  base_serving_size NUMERIC NOT NULL DEFAULT 1 CHECK (base_serving_size > 0),
  time_to_cook INTEGER,
  dietary_tags TEXT[] NOT NULL DEFAULT '{}',
  hero_image_url TEXT
);

CREATE INDEX recipes_user_id_idx ON public.recipes (user_id);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own recipes"
  ON public.recipes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Recipe ingredients (join table)
-- ---------------------------------------------------------------------------
CREATE TABLE public.recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes (id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory (id) ON DELETE CASCADE,
  required_quantity NUMERIC NOT NULL CHECK (required_quantity > 0),
  UNIQUE (recipe_id, inventory_item_id)
);

CREATE INDEX recipe_ingredients_recipe_id_idx ON public.recipe_ingredients (recipe_id);

ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own recipe ingredients"
  ON public.recipe_ingredients FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
        AND recipes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
        AND recipes.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Meal plan
-- ---------------------------------------------------------------------------
CREATE TABLE public.meal_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES public.recipes (id) ON DELETE CASCADE,
  planned_date DATE NOT NULL,
  meal_label TEXT NOT NULL DEFAULT 'Meal',
  target_servings NUMERIC NOT NULL DEFAULT 1 CHECK (target_servings > 0),
  is_cooked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX meal_plan_user_id_idx ON public.meal_plan (user_id);
CREATE INDEX meal_plan_planned_date_idx ON public.meal_plan (planned_date);

ALTER TABLE public.meal_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own meal plan"
  ON public.meal_plan FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Shopping list
-- ---------------------------------------------------------------------------
CREATE TABLE public.shopping_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory (id) ON DELETE SET NULL,
  target_quantity NUMERIC NOT NULL CHECK (target_quantity > 0),
  is_purchased BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX shopping_list_user_id_idx ON public.shopping_list (user_id);

ALTER TABLE public.shopping_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own shopping list"
  ON public.shopping_list FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Waste log
-- ---------------------------------------------------------------------------
CREATE TABLE public.waste_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory (id) ON DELETE SET NULL,
  quantity_wasted NUMERIC NOT NULL CHECK (quantity_wasted > 0),
  cost_wasted NUMERIC NOT NULL DEFAULT 0 CHECK (cost_wasted >= 0),
  reason TEXT NOT NULL DEFAULT 'Wasted',
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX waste_log_user_id_idx ON public.waste_log (user_id);

ALTER TABLE public.waste_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own waste log"
  ON public.waste_log FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Barcode cache
-- ---------------------------------------------------------------------------
CREATE TABLE public.barcode_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,
  inventory_item_id UUID REFERENCES public.inventory (id) ON DELETE SET NULL,
  UNIQUE (user_id, barcode)
);

CREATE INDEX barcode_cache_user_id_idx ON public.barcode_cache (user_id);

ALTER TABLE public.barcode_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own barcode cache"
  ON public.barcode_cache FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Auto-create user profile on sign-up
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, COALESCE(NEW.email, ''))
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
