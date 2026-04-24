import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function checkProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').limit(5);
  if (error) console.error(error);
  else console.log('Profiles:', data);
}

checkProfiles();
