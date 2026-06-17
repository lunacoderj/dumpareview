-- 1. Add extracted_name to existing submissions table
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS extracted_name TEXT;

-- 2. Create the new company_reviews table for tracking duplicates
CREATE TABLE IF NOT EXISTS public.company_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  extracted_name TEXT NOT NULL,
  extracted_message TEXT NOT NULL,
  extracted_stars INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Enable RLS on the new table
ALTER TABLE public.company_reviews ENABLE ROW LEVEL SECURITY;

-- 4. Block direct public access on company_reviews (inserted via secure server proxy)
CREATE POLICY "Deny all public operations on company_reviews" ON public.company_reviews FOR ALL USING (false);
