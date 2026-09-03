/**
 * Renumera os códigos de todos os produtos importados (que começam com "IMP-")
 * com uma sequência numérica simples: 01, 02, 03, ...
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yzvesbpnbewpmnpkomic.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6dmVzYnBuYmV3cG1ucGtvbWljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxODA1OTYsImV4cCI6MjEwMzc1NjU5Nn0.ogrdQJoEjOD82OOXH8PD47L86SLTCz7nglzZkgH2otQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  // Busca todos os produtos ordenados por data de criação
  const { data: produtos, error } = await supabase
    .from("produtos")
    .select("id, codigo, nome")
    .order("created_at", { ascending: true });

  if (error) { console.error("Erro:", error); process.exit(1); }

  console.log(`Total de produtos: ${produtos.length}`);

  let contador = 1;
  for (const produto of produtos) {
    const novocodigo = String(contador).padStart(2, "0");
    const { error: updateError } = await supabase
      .from("produtos")
      .update({ codigo: novocodigo })
      .eq("id", produto.id);

    if (updateError) {
      console.error(`  ERRO ${produto.nome}:`, updateError.message);
    } else {
      console.log(`  ${novocodigo} → ${produto.nome}`);
    }
    contador++;
  }

  console.log("\nPronto! Todos os códigos foram renumerados.");
}

main();
