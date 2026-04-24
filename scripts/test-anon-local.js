import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)="?([^"]*)"?$/);
  if (match) env[match[1]] = match[2];
});

async function testAnon() {
  console.log('Testing ANON access to qr_codes...');
  const anonClient = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);
  
  const { data, error, status } = await anonClient
    .from('qr_codes')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('ANON Error:', error);
    console.log('Status:', status);
  } else {
    console.log('ANON Success! Row count:', data.length);
  }
}

testAnon();
