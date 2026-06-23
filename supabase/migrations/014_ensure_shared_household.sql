-- Definitive shared-household fix: safe to re-run.
-- Drops every existing RLS policy on app tables, then recreates shared access
-- so all signed-in users see and edit the same data (including notes).

-- ---------------------------------------------------------------------------
-- Notes table (create if missing)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(trim(text)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notes_created_at_idx ON public.notes (created_at DESC);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Drop ALL existing policies on public app tables
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'users',
        'storage_locations',
        'inventory',
        'recipes',
        'recipe_ingredients',
        'meal_plan',
        'shopping_list',
        'shopping_lists',
        'waste_log',
        'barcode_cache',
        'user_units',
        'user_categories',
        'ingredients',
        'ingredient_conversions',
        'notes'
      ])
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      pol.policyname,
      pol.schemaname,
      pol.tablename
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Shared policies: any authenticated user can read/write everything
-- ---------------------------------------------------------------------------
CREATE POLICY "shared_select_users"
  ON public.users FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "shared_insert_users"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "shared_update_users"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "shared_all_storage_locations"
  ON public.storage_locations FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "shared_all_inventory"
  ON public.inventory FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "shared_all_recipes"
  ON public.recipes FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "shared_all_recipe_ingredients"
  ON public.recipe_ingredients FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "shared_all_meal_plan"
  ON public.meal_plan FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "shared_all_shopping_list"
  ON public.shopping_list FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "shared_all_shopping_lists"
  ON public.shopping_lists FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "shared_all_waste_log"
  ON public.waste_log FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "shared_all_barcode_cache"
  ON public.barcode_cache FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "shared_all_user_units"
  ON public.user_units FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "shared_all_user_categories"
  ON public.user_categories FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "shared_all_ingredients"
  ON public.ingredients FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "shared_all_ingredient_conversions"
  ON public.ingredient_conversions FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "shared_all_notes"
  ON public.notes FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ---------------------------------------------------------------------------
-- Storage: shared photo access
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        policyname ILIKE '%recipe photo%'
        OR policyname ILIKE '%ingredient photo%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "shared_upload_recipe_photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'recipe-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "shared_update_recipe_photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'recipe-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "shared_delete_recipe_photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'recipe-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "shared_upload_ingredient_photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ingredient-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "shared_update_ingredient_photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'ingredient-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "shared_delete_ingredient_photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'ingredient-photos' AND auth.uid() IS NOT NULL);

-- Keep public read policies if they exist; recreate if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Recipe photos are publicly readable'
  ) THEN
    CREATE POLICY "Recipe photos are publicly readable"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'recipe-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Ingredient photos are publicly readable'
  ) THEN
    CREATE POLICY "Ingredient photos are publicly readable"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'ingredient-photos');
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Realtime for notes (live sync between devices)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
