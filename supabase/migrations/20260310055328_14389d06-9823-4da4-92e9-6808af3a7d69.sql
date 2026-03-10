
DROP FUNCTION public.confirm_scan(uuid, text, integer);

CREATE OR REPLACE FUNCTION public.confirm_scan(qr_id uuid, p_message_used text, p_message_index integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_event_id uuid;
BEGIN
  UPDATE qr_codes SET successful_scans = successful_scans + 1 WHERE id = qr_id;
  INSERT INTO scan_events (qr_code_id, message_used, message_index)
  VALUES (qr_id, p_message_used, p_message_index)
  RETURNING id INTO new_event_id;
  RETURN new_event_id;
END;
$$;
