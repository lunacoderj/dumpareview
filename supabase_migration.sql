ALTER TABLE user_profiles
ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;

-- Add new columns to submissions for security checks
ALTER TABLE submissions
ADD COLUMN image_hash TEXT,
ADD COLUMN is_flagged BOOLEAN DEFAULT false;

-- Create table to track used Apify reviews
CREATE TABLE apify_used_reviews (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  apify_review_id text NOT NULL UNIQUE,
  submission_id uuid REFERENCES submissions(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
