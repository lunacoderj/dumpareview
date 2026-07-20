
-- Remove overly-permissive policies on legacy tables
DROP POLICY IF EXISTS "Public can view qr_codes for scanning" ON public.qr_codes;
DROP POLICY IF EXISTS "Anyone can insert scan events" ON public.scan_events;

-- Lock down SECURITY DEFINER functions: revoke public/anon/authenticated execute
REVOKE EXECUTE ON FUNCTION public.process_scan(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_scan(uuid, text, integer) FROM PUBLIC, anon, authenticated;
