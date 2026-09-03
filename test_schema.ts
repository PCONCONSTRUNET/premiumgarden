import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: v, error: err1 } = await supabase.from("vendas").select("id, vendedor_id, valor_comissao, status_pagamento_comissao, created_at").limit(1);
  console.log("Vendas:", v, err1);
  
  const { data: vend, error: err2 } = await supabase.from("vendedores").select("*").limit(1);
  console.log("Vendedores:", vend, err2);
}

run();
