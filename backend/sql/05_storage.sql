-- =============================================================================
-- Supabase Storage: PDF Reports Bucket
-- Run this in the Supabase SQL Editor to create a storage bucket for PDFs.
-- =============================================================================

-- Create the storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false)
ON CONFLICT (id) DO NOTHING;

-- Policy 1: Service role can upload PDFs (backend only)
-- Note: service_role bypasses RLS automatically, so this is documentation.
CREATE POLICY "Backend can upload reports"
  ON storage.objects
  FOR INSERT
  TO service_role
  WITH CHECK ( bucket_id = 'reports' );

-- Policy 2: Authenticated users can download their own PDFs
-- Files are stored as: reports/{user_id}/{filename}.pdf
CREATE POLICY "Users can download own reports"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'reports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy 3: Block all public/anon access to the bucket
CREATE POLICY "Deny anon access to reports bucket"
  ON storage.objects
  FOR ALL
  TO anon
  USING ( bucket_id != 'reports' )
  WITH CHECK ( bucket_id != 'reports' );
