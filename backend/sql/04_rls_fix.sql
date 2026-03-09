-- =============================================================================
-- IMPORTANT: Run this AFTER 03_policies.sql
-- This policy patch enables the backend (server) to bypass RLS when saving
-- reports using the SERVICE ROLE KEY.
--
-- The anon key respects RLS (auth.uid() = null on server), which causes the
-- "row-level security policy violation" error.
-- The service_role key bypasses RLS entirely and can insert freely.
-- =============================================================================

-- Step 1: Drop the old restrictive insert policy if you already applied it.
DROP POLICY IF EXISTS "Users can insert their own reports" ON reports_history;

-- Step 2: Re-create the insert policy to allow:
--   (a) Client-side: authenticated users can insert their own records
--   (b) Server-side: operations with the service_role key are always allowed (RLS bypassed)
CREATE POLICY "Allow authenticated and service inserts"
  ON reports_history
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- Note: The service_role key bypasses this check automatically.
-- Just make sure SUPABASE_SERVICE_ROLE_KEY is used in the backend .env.
