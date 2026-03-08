
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('growmate-photos', 'growmate-photos', true);

-- RLS: authenticated users can upload to their own folder
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'growmate-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: authenticated users can view own photos
CREATE POLICY "Users can view own photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'growmate-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: public read for public URLs
CREATE POLICY "Public read access for growmate-photos"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'growmate-photos');

-- RLS: users can delete own photos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'growmate-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add photo_urls columns
ALTER TABLE public.diary_entries ADD COLUMN photo_urls text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.crops ADD COLUMN photo_urls text[] NOT NULL DEFAULT '{}';
