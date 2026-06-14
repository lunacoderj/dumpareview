-- Run this in your Supabase SQL Editor to enable notifications

-- 1. Add fcm_token column to user_profiles if it doesn't exist
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- 2. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Secure it (only backend can access)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct access" ON public.notifications FOR ALL USING (false);
