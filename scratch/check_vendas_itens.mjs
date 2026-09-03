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
  const { data: vendas, error: erroVendas } = await supabase.from('vendas').select('id').limit(1);
  console.log("Vendas:", vendas, erroVendas);

  if (vendas && vendas.length > 0) {
    const { data: itens, error: erroItens } = await supabase
      .from('vendas_itens')
      .select('*, produto:produtos(nome, emoji)')
      .eq('venda_id', vendas[0].id);
    console.log("Itens da venda:", itens, erroItens);
  }
  
  // Let's also just select all from vendas_itens to see if any exist
  const { data: allItens, error: errorAll } = await supabase.from('vendas_itens').select('*').limit(5);
  console.log("Todos os itens (limit 5):", allItens, errorAll);
}
run();
