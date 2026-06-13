-- Run this SQL in your Supabase SQL Editor to create the Wall of Fame table

CREATE TABLE IF NOT EXISTS wall_of_fame (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Secure it: Only the backend service_role key can read/write to it
ALTER TABLE wall_of_fame ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct access" ON wall_of_fame FOR ALL USING (false);
