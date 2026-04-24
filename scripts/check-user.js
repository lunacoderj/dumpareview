import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Parse .env manually to avoid dependencies
const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)="?([^"]*)"?$/);
  if (match) env[match[1]] = match[2];
});

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function checkUser() {
  const targetUid = '9s0Z3NqQycXGTH9yQn4aX78qzb42';
  console.log(`Checking if user ${targetUid} exists in profiles...`);
  
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', targetUid);
  
  if (error) {
    console.error('Error:', error);
  } else if (data.length === 0) {
    console.log('User NOT found in profiles table.');
    // Check all profiles to see what we have
    const { data: all } = await supabase.from('profiles').select('user_id, email');
    console.log('Existing profiles:', all);
  } else {
    console.log('User FOUND:', data[0]);
    
    // Check their QR codes
    const { data: qr } = await supabase.from('qr_codes').select('id, name').eq('user_id', targetUid);
    console.log(`User has ${qr.length} QR codes.`);
  }
}

checkUser();
