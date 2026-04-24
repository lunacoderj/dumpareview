import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function checkScanEvents() {
  const { data, error } = await supabase.from('scan_events').select('*').limit(1);
  if (error) console.error('Scan events table error:', error);
  else console.log('Scan events sample:', data[0]);
}

checkScanEvents();
