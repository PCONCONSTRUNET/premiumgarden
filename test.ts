import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl!, supabaseKey!);

supabase.from('produtos').select('*').limit(1).then(r => {
  if (r.error) console.error(r.error);
  else console.log(Object.keys(r.data[0] || {}));
});