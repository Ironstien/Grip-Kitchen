-- Shared household access: any signed-in user can read and write all app data.
-- Grip Kitchen is a single shared kitchen for the family, not per-user silos.

-- ---------------------------------------------------------------------------
-- public.users
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Authenticated users can view all profiles"
  ON public.users FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Shared data tables
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users manage own storage locations" ON public.storage_locations;
CREATE POLICY "Authenticated users manage shared storage locations"
  ON public.storage_locations FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users manage own inventory" ON public.inventory;
CREATE POLICY "Authenticated users manage shared inventory"
  ON public.inventory FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users manage own recipes" ON public.recipes;
CREATE POLICY "Authenticated users manage shared recipes"
  ON public.recipes FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users manage own recipe ingredients" ON public.recipe_ingredients;
CREATE POLICY "Authenticated users manage shared recipe ingredients"
  ON public.recipe_ingredients FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users manage own meal plan" ON public.meal_plan;
CREATE POLICY "Authenticated users manage shared meal plan"
  ON public.meal_plan FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users manage own shopping list" ON public.shopping_list;
CREATE POLICY "Authenticated users manage shared shopping list"
  ON public.shopping_list FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users manage own shopping lists" ON public.shopping_lists;
CREATE POLICY "Authenticated users manage shared shopping lists"
  ON public.shopping_lists FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users manage own waste log" ON public.waste_log;
CREATE POLICY "Authenticated users manage shared waste log"
  ON public.waste_log FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users manage own barcode cache" ON public.barcode_cache;
CREATE POLICY "Authenticated users manage shared barcode cache"
  ON public.barcode_cache FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users manage own units" ON public.user_units;
CREATE POLICY "Authenticated users manage shared units"
  ON public.user_units FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users manage own categories" ON public.user_categories;
CREATE POLICY "Authenticated users manage shared categories"
  ON public.user_categories FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users manage own ingredients" ON public.ingredients;
CREATE POLICY "Authenticated users manage shared ingredients"
  ON public.ingredients FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users manage own ingredient conversions" ON public.ingredient_conversions;
CREATE POLICY "Authenticated users manage shared ingredient conversions"
  ON public.ingredient_conversions FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ---------------------------------------------------------------------------
-- Storage: recipe and ingredient photos
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can upload own recipe photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own recipe photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own recipe photos" ON storage.objects;

CREATE POLICY "Authenticated users can upload recipe photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'recipe-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update recipe photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'recipe-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete recipe photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'recipe-photos' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can upload own ingredient photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own ingredient photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own ingredient photos" ON storage.objects;

CREATE POLICY "Authenticated users can upload ingredient photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ingredient-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update ingredient photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'ingredient-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete ingredient photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'ingredient-photos' AND auth.uid() IS NOT NULL);
