-- Ingredient photo storage and image_url column

ALTER TABLE public.ingredients
  ADD COLUMN IF NOT EXISTS image_url TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('ingredient-photos', 'ingredient-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own ingredient photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ingredient-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own ingredient photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'ingredient-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own ingredient photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'ingredient-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Ingredient photos are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ingredient-photos');
