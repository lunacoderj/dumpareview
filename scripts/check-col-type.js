import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function checkColType() {
  const { data, error } = await supabase.from('qr_codes').select('id').limit(1);
  if (error) {
    console.error(error);
    return;
  }
  
  const id = data[0].id;
  console.log('Sample ID:', id);
  console.log('Is UUID:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
}

checkColType();
