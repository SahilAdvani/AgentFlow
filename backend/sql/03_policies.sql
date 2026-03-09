-- Enable Row Level Security (RLS) on user-facing tables
ALTER TABLE reports_history ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can only READ their own reports
CREATE POLICY "Users can view their own reports"
  ON reports_history 
  FOR SELECT
  USING ( auth.uid() = user_id );

-- Policy 2: Users can only INSERT reports assigned to their own user ID
CREATE POLICY "Users can insert their own reports"
  ON reports_history 
  FOR INSERT
  WITH CHECK ( auth.uid() = user_id );
