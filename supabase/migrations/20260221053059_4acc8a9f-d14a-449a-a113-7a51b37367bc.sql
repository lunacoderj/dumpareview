
-- Add message_used_counts column
ALTER TABLE public.qr_codes ADD COLUMN message_used_counts integer[] NOT NULL DEFAULT '{}';

-- Initialize existing rows
UPDATE public.qr_codes 
SET message_used_counts = array_fill(0, ARRAY[array_length(messages, 1)])
WHERE array_length(messages, 1) > 0;

-- process_scan: picks a random least-used message, increments used_count, resets when all used
CREATE OR REPLACE FUNCTION public.process_scan(qr_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  qr_record RECORD;
  min_count integer;
  candidate_indices integer[];
  selected_index integer;
  selected_message text;
  new_counts integer[];
BEGIN
  SELECT * INTO qr_record FROM qr_codes WHERE id = qr_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'QR code not found');
  END IF;

  IF array_length(qr_record.messages, 1) IS NULL OR array_length(qr_record.messages, 1) = 0 THEN
    RETURN jsonb_build_object('error', 'No messages configured');
  END IF;

  new_counts := qr_record.message_used_counts;
  IF array_length(new_counts, 1) IS NULL OR array_length(new_counts, 1) != array_length(qr_record.messages, 1) THEN
    new_counts := array_fill(0, ARRAY[array_length(qr_record.messages, 1)]);
  END IF;

  -- Find minimum used_count
  min_count := new_counts[1];
  FOR i IN 2..array_length(new_counts, 1) LOOP
    IF new_counts[i] < min_count THEN
      min_count := new_counts[i];
    END IF;
  END LOOP;

  -- Reset all to 0 if all have been used at least once
  IF min_count > 0 THEN
    new_counts := array_fill(0, ARRAY[array_length(new_counts, 1)]);
    min_count := 0;
  END IF;

  -- Collect indices with min_count
  candidate_indices := '{}';
  FOR i IN 1..array_length(new_counts, 1) LOOP
    IF new_counts[i] = min_count THEN
      candidate_indices := candidate_indices || i;
    END IF;
  END LOOP;

  -- Pick random from candidates
  selected_index := candidate_indices[1 + floor(random() * array_length(candidate_indices, 1))::integer];
  selected_message := qr_record.messages[selected_index];

  -- Increment used_count
  new_counts[selected_index] := new_counts[selected_index] + 1;

  -- Update qr_codes
  UPDATE qr_codes SET message_used_counts = new_counts WHERE id = qr_id;

  RETURN jsonb_build_object(
    'message', selected_message,
    'message_index', selected_index - 1,
    'google_review_link', qr_record.google_review_link,
    'name', qr_record.name
  );
END;
$$;

-- confirm_scan: called after successful clipboard copy
CREATE OR REPLACE FUNCTION public.confirm_scan(qr_id uuid, p_message_used text, p_message_index integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE qr_codes SET successful_scans = successful_scans + 1 WHERE id = qr_id;
  INSERT INTO scan_events (qr_code_id, message_used, message_index)
  VALUES (qr_id, p_message_used, p_message_index);
END;
$$;
