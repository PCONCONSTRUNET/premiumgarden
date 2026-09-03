import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { error } = await supabase
    .from("contas_receber")
    .update({ descricao: "Pedido #0125ED82 - GARDEN PREMIUM PRODUTOS PARA JARDINAGEM LTDA | FALTA AINDA" })
    .eq("id", "2db81579-068f-4ace-875a-b441bfdb7f72");
  console.log("Atualizou descricao:", error ?? "OK");
}

run();
