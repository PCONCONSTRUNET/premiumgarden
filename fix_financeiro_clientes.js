import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function fix() {
  const { data: records, error } = await supabase
    .from('contas_receber')
    .select('id, venda_id')
    .is('cliente_id', null)
    .not('venda_id', 'is', null);

  if (error) {
    console.error('Error fetching contas_receber:', error);
    return;
  }

  for (const record of records) {
    const { data: venda } = await supabase
      .from('vendas')
      .select('cliente_id')
      .eq('id', record.venda_id)
      .single();

    if (venda && venda.cliente_id) {
      await supabase
        .from('contas_receber')
        .update({ cliente_id: venda.cliente_id })
        .eq('id', record.id);
      console.log(`Updated contas_receber ${record.id} with cliente_id ${venda.cliente_id}`);
    }
  }
  console.log('Fix complete.');
}
fix();
