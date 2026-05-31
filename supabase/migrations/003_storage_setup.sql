-- ================================================================
-- Storage: business-assets bucket for logo and business images
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-assets',
  'business-assets',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT DO NOTHING;

-- Public read access (images are served directly from the CDN URL)
CREATE POLICY "Public can view business assets"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'business-assets');

-- Any authenticated user can upload (server action already validates owner role)
CREATE POLICY "Authenticated users can upload business assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'business-assets');

-- Allow replacing existing files (upsert in server action)
CREATE POLICY "Authenticated users can update business assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'business-assets');
