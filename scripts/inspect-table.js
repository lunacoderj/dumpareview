import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function inspect() {
  const { data, error } = await supabase.rpc('get_table_info', { table_name: 'qr_codes' });
  // If rpc doesn't exist, we can try querying information_schema if we have permission
  if (error) {
    const { data: cols, error: cError } = await supabase
      .from('qr_codes')
      .select('*')
      .limit(1);
    
    if (cError) {
       console.error('Error:', cError);
    } else {
       console.log('Sample data:', cols[0]);
    }
  } else {
    console.log('Table info:', data);
  }
}

inspect();
