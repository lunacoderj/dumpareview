-- SUPABASE SCHEMA SETUP FOR DUMPAREVIEW
-- Run this in the Supabase SQL Editor

-- 1. Create Tables

-- Profiles Table (Linked to Firebase Auth via user_id)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE, -- Firebase UID
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- QR Codes Table (with 100-message refill lifecycle tracking)
CREATE TABLE IF NOT EXISTS public.qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  google_review_link TEXT NOT NULL,
  business_category TEXT,
  status TEXT DEFAULT 'active' NOT NULL, -- 'active' | 'exhausted' | 'pending_refill'
  auto_refill_prompted BOOLEAN DEFAULT false NOT NULL,
  last_generated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  messages TEXT[] DEFAULT '{}' NOT NULL,
  current_message_index INTEGER DEFAULT 0 NOT NULL,
  successful_scans INTEGER DEFAULT 0 NOT NULL,
  message_used_counts INTEGER[] DEFAULT '{}' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Safe migrations for existing qr_codes tables:
ALTER TABLE public.qr_codes ADD COLUMN IF NOT EXISTS business_category TEXT;
ALTER TABLE public.qr_codes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.qr_codes ADD COLUMN IF NOT EXISTS auto_refill_prompted BOOLEAN DEFAULT false;
ALTER TABLE public.qr_codes ADD COLUMN IF NOT EXISTS last_generated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Scan Events Table (with 24-Hour Agent Audit fields)
CREATE TABLE IF NOT EXISTS public.scan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id UUID NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  message_used TEXT,
  message_index INTEGER,
  verification_status TEXT DEFAULT 'pending' NOT NULL, -- 'pending' | 'verified_success' | 'verified_fail'
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_batch_id TEXT,
  matched_google_review_id TEXT,
  agent_notes TEXT,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Safe migrations for existing scan_events tables:
ALTER TABLE public.scan_events ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';
ALTER TABLE public.scan_events ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.scan_events ADD COLUMN IF NOT EXISTS verification_batch_id TEXT;
ALTER TABLE public.scan_events ADD COLUMN IF NOT EXISTS matched_google_review_id TEXT;
ALTER TABLE public.scan_events ADD COLUMN IF NOT EXISTS agent_notes TEXT;

-- Notifications Table (For 100-Message Exhaustion & Audit Alerts)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  qr_code_id UUID REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'messages_exhausted' | 'batch_audit_completed' | 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_type TEXT DEFAULT 'none' NOT NULL, -- 'refill_permission' | 'none'
  action_status TEXT DEFAULT 'pending' NOT NULL, -- 'pending' | 'accepted' | 'rejected'
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_scan_events_maturity ON public.scan_events (scanned_at, verification_status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications (user_id, is_read);

-- 2. Create Functions

-- Function to process a scan, return a message, and detect 100-message cycle completion
CREATE OR REPLACE FUNCTION public.process_scan(qr_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  qr_record RECORD;
  msg TEXT;
  idx INTEGER;
  total_msgs INTEGER;
  next_idx INTEGER;
BEGIN
  -- Get QR code details
  SELECT * INTO qr_record FROM qr_codes WHERE id = qr_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'QR code not found');
  END IF;
  
  total_msgs := array_length(qr_record.messages, 1);
  IF total_msgs IS NULL OR total_msgs = 0 THEN
    RETURN json_build_object('error', 'No messages configured');
  END IF;
  
  -- Calculate current index (round-robin)
  idx := qr_record.current_message_index % total_msgs;
  msg := qr_record.messages[idx + 1]; -- Postgres arrays are 1-indexed
  next_idx := (qr_record.current_message_index + 1) % total_msgs;

  -- Check if all messages have cycled (100 messages used)
  IF next_idx = 0 AND NOT qr_record.auto_refill_prompted THEN
    -- Flag QR code as exhausted and create an in-app notification for the owner
    UPDATE qr_codes 
    SET successful_scans = successful_scans + 1,
        current_message_index = next_idx,
        status = 'exhausted',
        auto_refill_prompted = true,
        updated_at = now()
    WHERE id = qr_id;

    INSERT INTO notifications (user_id, qr_code_id, type, title, message, action_type, action_status)
    VALUES (
      qr_record.user_id,
      qr_id,
      'messages_exhausted',
      'All 100 Review Messages Used!',
      'All 100 pre-written review messages for ' || qr_record.name || ' have been used by customers. Would you like to generate a fresh batch of 100 reviews?',
      'refill_permission',
      'pending'
    );
  ELSE
    -- Standard scan increment
    UPDATE qr_codes 
    SET successful_scans = successful_scans + 1,
        current_message_index = next_idx,
        updated_at = now()
    WHERE id = qr_id;
  END IF;
  
  RETURN json_build_object(
    'message', msg,
    'message_index', idx,
    'google_review_link', qr_record.google_review_link
  );
END;
$$;

-- Function to confirm a scan and record usage
CREATE OR REPLACE FUNCTION public.confirm_scan(qr_id UUID, p_message_used TEXT, p_message_index INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert scan event with pending verification status
  INSERT INTO scan_events (qr_code_id, message_used, message_index, verification_status)
  VALUES (qr_id, p_message_used, p_message_index, 'pending');
  
  -- Update specific message usage counts
  UPDATE qr_codes
  SET message_used_counts = (
    SELECT array_agg(
      CASE 
        WHEN i = p_message_index + 1 THEN COALESCE(message_used_counts[i], 0) + 1
        ELSE COALESCE(message_used_counts[i], 0)
      END
    )
    FROM generate_series(1, array_length(messages, 1)) i
  )
  WHERE id = qr_id;
END;
$$;

-- 3. Row Level Security Configuration
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
