CREATE TABLE IF NOT EXISTS public.apify_scraped_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  apify_review_id TEXT UNIQUE,
  reviewer_name TEXT,
  review_text TEXT,
  stars INTEGER,
  publish_time TIMESTAMP WITH TIME ZONE,
  is_used BOOLEAN DEFAULT false,
  used_by_submission_id UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add apify status and reason to submissions
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS apify_status TEXT DEFAULT 'pending' CHECK (apify_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS apify_reason TEXT;

-- Secure the new table
ALTER TABLE public.apify_scraped_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny all public operations on apify_scraped_reviews" ON public.apify_scraped_reviews FOR ALL USING (false);
