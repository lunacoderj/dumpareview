import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function testAnonAccess() {
  console.log('Testing access with ANON key...');
  const { data, error, status } = await supabase.from('qr_codes').select('*').limit(1);
  if (error) {
    console.error('Anon Access Error:', error);
    console.log('Status Code:', status);
  } else {
    console.log('Anon Access Success! Row count:', data.length);
  }
}

testAnonAccess();
