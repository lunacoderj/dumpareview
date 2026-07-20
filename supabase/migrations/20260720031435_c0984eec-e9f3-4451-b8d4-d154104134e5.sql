
-- Ensure no direct execute permission remains on the SECURITY DEFINER helpers
REVOKE ALL ON FUNCTION public.process_scan(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_scan(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.process_scan(uuid) FROM authenticated;

REVOKE ALL ON FUNCTION public.confirm_scan(uuid, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_scan(uuid, text, integer) FROM anon;
REVOKE ALL ON FUNCTION public.confirm_scan(uuid, text, integer) FROM authenticated;
