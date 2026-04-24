import { createClient } from '@supabase/supabase-js';
// import dotenv from 'dotenv';
// dotenv.config();


const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function check() {
  const { data: profiles, error: pError } = await supabase.from('profiles').select('id');
  if (pError) console.error('Profiles error:', pError);
  else console.log('Profiles count:', profiles?.length);

  const { data: qrcodes, error: qError } = await supabase.from('qr_codes').select('id');
  if (qError) console.error('QR Codes error:', qError);
  else console.log('QR Codes count:', qrcodes?.length);
}

check();
