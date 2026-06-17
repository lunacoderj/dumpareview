-- SUPABASE MASTER SCHEMA SETUP FOR DUMPAREVIEW

-- 1. Create Tables

CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  google_review_link TEXT NOT NULL,
  target_count INTEGER NOT NULL,
  current_count INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.review_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'completed')),
  assigned_to TEXT, -- Firebase UID
  assigned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id TEXT PRIMARY KEY, -- Firebase UID
  email TEXT NOT NULL,
  full_name TEXT,
  phonepe_details TEXT,
  current_streak INTEGER DEFAULT 0 NOT NULL,
  lifetime_reviews INTEGER DEFAULT 0 NOT NULL,
  fcm_token TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.review_messages(id) ON DELETE CASCADE,
  screenshot_url TEXT NOT NULL,
  screenshot_hash VARCHAR(64),
  image_hash TEXT,
  is_flagged BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  twelve_hour_check_triggered BOOLEAN DEFAULT false,
  apify_verified BOOLEAN DEFAULT false,
  apify_status TEXT DEFAULT 'pending' CHECK (apify_status IN ('pending', 'approved', 'rejected')),
  apify_reason TEXT,
  extracted_email TEXT,
  extracted_name TEXT,
  extracted_message TEXT,
  extracted_stars INTEGER,
  admin_message TEXT,
  user_message TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.apify_used_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  apify_review_id text NOT NULL UNIQUE,
  submission_id uuid REFERENCES public.submissions(id),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.company_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  extracted_name TEXT NOT NULL,
  extracted_message TEXT NOT NULL,
  extracted_stars INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.review_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  admin_message TEXT NOT NULL,
  proof_image_url TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  receipt_url TEXT NOT NULL,
  user_receipt_url TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wall_of_fame (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  received_image_url TEXT,
  description TEXT NOT NULL,
  amount NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- 2. Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apify_used_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apify_scraped_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wall_of_fame ENABLE ROW LEVEL SECURITY;

-- 3. Setup strict RLS for backend proxy mode
-- We deny all public operations because all queries pass through the secured server-side code (using the service_role key)
CREATE POLICY "Deny all public selects on profiles" ON public.user_profiles FOR SELECT USING (false);
CREATE POLICY "Deny all public updates on profiles" ON public.user_profiles FOR UPDATE USING (false);
CREATE POLICY "Deny all public inserts on profiles" ON public.user_profiles FOR INSERT WITH CHECK (false);

CREATE POLICY "Deny all public selects on campaigns" ON public.campaigns FOR SELECT USING (false);
CREATE POLICY "Deny all public selects on review_messages" ON public.review_messages FOR SELECT USING (false);
CREATE POLICY "Deny all public updates on review_messages" ON public.review_messages FOR UPDATE USING (false);

CREATE POLICY "Deny all public operations on submissions" ON public.submissions FOR ALL USING (false);
CREATE POLICY "Deny all public operations on apify_used_reviews" ON public.apify_used_reviews FOR ALL USING (false);
CREATE POLICY "Deny all public operations on apify_scraped_reviews" ON public.apify_scraped_reviews FOR ALL USING (false);
CREATE POLICY "Deny all public operations on company_reviews" ON public.company_reviews FOR ALL USING (false);
CREATE POLICY "Deny all public operations on review_disputes" ON public.review_disputes FOR ALL USING (false);
CREATE POLICY "Deny all public operations on payouts" ON public.payouts FOR ALL USING (false);
CREATE POLICY "Deny all public operations on notifications" ON public.notifications FOR ALL USING (false);
CREATE POLICY "Deny all public operations on wall_of_fame" ON public.wall_of_fame FOR ALL USING (false);

-- 4. Grants (SECURITY: Only service_role gets full access — anon/authenticated get NOTHING)
-- Your backend uses service_role key, so all DB calls go through the server.
-- This prevents anyone from using the public anon key to bypass RLS.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, authenticated;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;

-- 5. Security Tables

-- Audit Log (tracks all admin actions)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id TEXT NOT NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny all on audit_logs" ON public.audit_logs FOR ALL USING (false);
GRANT ALL ON public.audit_logs TO service_role;

-- System Locks (prevents concurrent cron runs)
CREATE TABLE IF NOT EXISTS public.system_locks (
  lock_name TEXT PRIMARY KEY,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.system_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny all on system_locks" ON public.system_locks FOR ALL USING (false);
GRANT ALL ON public.system_locks TO service_role;
