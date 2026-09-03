import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase
    .from("vendas")
    .select("*");
    
  console.log("Error:", error);
  console.log("Vendas:", data?.map(v => ({ id: v.id, created_at: v.created_at, status: v.status, valor_total: v.valor_total, tipo: v.tipo })));
}

run();
