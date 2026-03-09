-- =============================================================================
-- RLS Policies for AgentFlow (Strict Security)
--
-- Strategy:
--   Backend (FastAPI) uses SUPABASE_SERVICE_ROLE_KEY which BYPASSES RLS.
--   This means the backend can freely read/write to all tables.
--   These policies only restrict direct access via the anon key (e.g. Postman,
--   browser console, etc.) and control what authenticated frontend users can do.
-- =============================================================================

-- ========================
-- 1. agent_memory table
-- INTERNAL server-only table. NO public access allowed.
-- The backend bypasses these via service_role key.
-- ========================

ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;

-- Block everything for anon and authenticated roles
CREATE POLICY "Deny all access on agent_memory"
  ON agent_memory
  FOR ALL
  TO anon, authenticated
  USING ( false )
  WITH CHECK ( false );

-- ========================
-- 2. reports_history table
-- Authenticated users can READ their own reports from the frontend.
-- All INSERT/UPDATE/DELETE from browser is blocked.
-- The backend inserts via service_role key (bypasses RLS).
-- ========================

ALTER TABLE reports_history ENABLE ROW LEVEL SECURITY;

-- Authenticated users can only SELECT their own reports (for /history page)
CREATE POLICY "Users can view own reports"
  ON reports_history
  FOR SELECT
  TO authenticated
  USING ( auth.uid() = user_id );

-- Block all other operations for anon and authenticated
CREATE POLICY "Deny anon access on reports_history"
  ON reports_history
  FOR ALL
  TO anon
  USING ( false )
  WITH CHECK ( false );

CREATE POLICY "Deny authenticated writes on reports_history"
  ON reports_history
  FOR INSERT
  TO authenticated
  WITH CHECK ( false );

-- Allow authenticated users to UPDATE their own reports
CREATE POLICY "Users can update own reports"
  ON reports_history
  FOR UPDATE
  TO authenticated
  USING ( auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );

-- Allow authenticated users to DELETE their own reports
CREATE POLICY "Users can delete own reports"
  ON reports_history
  FOR DELETE
  TO authenticated
  USING ( auth.uid() = user_id );
