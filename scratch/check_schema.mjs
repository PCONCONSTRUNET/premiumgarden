import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envText = fs.readFileSync('.env', 'utf8');
const env = envText.split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k && v.length) {
    acc[k.trim()] = v.join('=').replace(/['"\r]/g, '').trim();
  }
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('tarefas').select('*').limit(1);
  if (error) {
    console.log("Error:", error);
  } else {
    console.log("Vendedores:", data);
  }
}
run();
