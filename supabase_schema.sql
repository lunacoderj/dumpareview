-- SUPABASE SCHEMA SETUP FOR DUMPAREVIEW

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
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  twelve_hour_check_triggered BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE
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
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Setup strict RLS for backend proxy mode
CREATE POLICY "Deny all public selects on profiles" ON public.user_profiles FOR SELECT USING (false);
CREATE POLICY "Deny all public updates on profiles" ON public.user_profiles FOR UPDATE USING (false);
CREATE POLICY "Deny all public inserts on profiles" ON public.user_profiles FOR INSERT WITH CHECK (false);

CREATE POLICY "Deny all public selects on campaigns" ON public.campaigns FOR SELECT USING (false);
CREATE POLICY "Deny all public selects on review_messages" ON public.review_messages FOR SELECT USING (false);
CREATE POLICY "Deny all public updates on review_messages" ON public.review_messages FOR UPDATE USING (false);

CREATE POLICY "Deny all public operations on submissions" ON public.submissions FOR ALL USING (false);
CREATE POLICY "Deny all public operations on review_disputes" ON public.review_disputes FOR ALL USING (false);
CREATE POLICY "Deny all public operations on payouts" ON public.payouts FOR ALL USING (false);

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
