import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Manually load .env
const env = dotenv.parse(fs.readFileSync('.env'));

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function checkPermissions() {
  console.log('Checking permissions and data...');
  
  // 1. Check if tables exist and have data
  const { data: qrCodes, error: qrError } = await supabase.from('qr_codes').select('count', { count: 'exact' });
  if (qrError) console.error('QR Codes error:', qrError);
  else console.log('QR Codes total:', qrCodes);

  // 2. Check if anon role has grants
  // We can check this by querying information_schema
  const { data: grants, error: grantError } = await supabase.rpc('check_grants');
  // Wait, I don't have this RPC. I'll use a direct query if possible, or just try to select as anon.
  
  console.log('---');
  console.log('Testing as ANON...');
  const anonClient = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);
  const { data: anonData, error: anonError, status } = await anonClient.from('qr_codes').select('*').limit(1);
  
  if (anonError) {
    console.error('ANON ERROR:', anonError);
    console.log('Status:', status);
  } else {
    console.log('ANON SUCCESS! Data:', anonData);
  }
}

checkPermissions();
