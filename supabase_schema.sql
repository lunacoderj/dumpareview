-- SUPABASE SCHEMA SETUP FOR QREVIEW PRO
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

-- QR Codes Table
CREATE TABLE IF NOT EXISTS public.qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  google_review_link TEXT NOT NULL,
  messages TEXT[] DEFAULT '{}' NOT NULL,
  current_message_index INTEGER DEFAULT 0 NOT NULL,
  successful_scans INTEGER DEFAULT 0 NOT NULL,
  message_used_counts INTEGER[] DEFAULT '{}' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Scan Events Table
CREATE TABLE IF NOT EXISTS public.scan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id UUID NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  message_used TEXT,
  message_index INTEGER,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Create Functions

-- Function to process a scan and return a message
CREATE OR REPLACE FUNCTION public.process_scan(qr_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  qr_record RECORD;
  msg TEXT;
  idx INTEGER;
BEGIN
  -- Get QR code details
  SELECT * INTO qr_record FROM qr_codes WHERE id = qr_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'QR code not found');
  END IF;
  
  IF array_length(qr_record.messages, 1) IS NULL OR array_length(qr_record.messages, 1) = 0 THEN
    RETURN json_build_object('error', 'No messages configured');
  END IF;
  
  -- Calculate index (round-robin)
  idx := qr_record.current_message_index % array_length(qr_record.messages, 1);
  msg := qr_record.messages[idx + 1]; -- Postgres arrays are 1-indexed
  
  -- Increment successful scans and update index
  UPDATE qr_codes 
  SET successful_scans = successful_scans + 1,
      current_message_index = (current_message_index + 1) % array_length(messages, 1),
      updated_at = now()
  WHERE id = qr_id;
  
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
  -- Insert scan event
  INSERT INTO scan_events (qr_code_id, message_used, message_index)
  VALUES (qr_id, p_message_used, p_message_index);
  
  -- Update specific message usage counts
  -- Note: We initialize the array if it's too small
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

-- 3. Enable RLS and Basic Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read profiles (needed for public dashboard views)
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

-- Allow users to manage their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR ALL USING (true); -- Simplified for initial setup

-- Allow anyone to read QR codes (needed for scanning)
CREATE POLICY "QR codes are viewable by everyone" ON public.qr_codes
  FOR SELECT USING (true);

-- Allow users to manage their own QR codes
CREATE POLICY "Users can manage their own qr_codes" ON public.qr_codes
  FOR ALL USING (true); -- Simplified for initial setup

-- Allow anyone to read and insert scan events
CREATE POLICY "Scan events are viewable by everyone" ON public.scan_events
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert scan events" ON public.scan_events
  FOR INSERT WITH CHECK (true);
