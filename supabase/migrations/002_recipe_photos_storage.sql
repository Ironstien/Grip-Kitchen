-- Recipe photo storage bucket with RLS

INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-photos', 'recipe-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own recipe photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'recipe-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own recipe photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'recipe-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own recipe photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'recipe-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Recipe photos are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recipe-photos');
