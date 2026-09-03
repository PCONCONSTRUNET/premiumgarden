/**
 * Categoriza todos os produtos do banco com categorias organizadas.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yzvesbpnbewpmnpkomic.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6dmVzYnBuYmV3cG1ucGtvbWljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxODA1OTYsImV4cCI6MjEwMzc1NjU5Nn0.ogrdQJoEjOD82OOXH8PD47L86SLTCz7nglzZkgH2otQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Mapeamento: nome_do_produto (parte) → categoria
const CATEGORIAS = [
  // ─── Fertilizantes Químicos ───────────────────────────────────────────────
  { match: ["04/14/08 FERTILIZANTES", "10/10/10 FERTILIZANTES", "UREIA", "CALCÁRIO"], categoria: "Fertilizantes" },

  // ─── Fertilizantes Orgânicos ─────────────────────────────────────────────
  { match: ["ESTERCO", "HÚMUS", "HUMUS", "FARINHA DE OSSO", "TORTA DE MAMONA"], categoria: "Fertilizantes Orgânicos" },

  // ─── Substratos Especiais ─────────────────────────────────────────────────
  { match: ["ORQUÍDEA", "SUBTRATO", "CACTOS E SUCULENTAS", "ROSAS DESERTO", "ROSAS DESERTO & BROMELIIAS"], categoria: "Substratos Especiais" },

  // ─── Substratos e Solos ───────────────────────────────────────────────────
  { match: ["AREIA DE RIO", "ARGILA EXPANDIDA", "CARVÃO VEGETAL", "CASCA DE PINUS", "CHIP DE COCO",
            "FIBRA DE COCO", "PO DE COCO", "TERRA", "MUSGO ROSA"], categoria: "Substratos e Solos" },

  // ─── Decoração e Paisagismo ───────────────────────────────────────────────
  { match: ["GRANILHA", "PEDRA", "PEDRISCO", "SEIXO"], categoria: "Decoração e Paisagismo" },

  // ─── Suportes e Estruturas ────────────────────────────────────────────────
  { match: ["CORRENTE", "CORRENTAO", "CORRENTÃO", "ESTACA COCO", "SUPORTE"], categoria: "Suportes e Estruturas" },

  // ─── Ferramentas e Equipamentos ───────────────────────────────────────────
  { match: ["REGADOR"], categoria: "Ferramentas e Equipamentos" },

  // ─── Vasos e Acessórios ───────────────────────────────────────────────────
  { match: ["PRATO VASO", "VASO"], categoria: "Vasos e Acessórios" },
];

function getCategoria(nome) {
  const nomeUpper = nome.toUpperCase();
  for (const rule of CATEGORIAS) {
    if (rule.match.some((m) => nomeUpper.includes(m.toUpperCase()))) {
      return rule.categoria;
    }
  }
  return "Outros";
}

async function main() {
  const { data: produtos, error } = await supabase
    .from("produtos")
    .select("id, nome, categoria");

  if (error) { console.error("Erro:", error); process.exit(1); }

  console.log(`Total: ${produtos.length} produtos\n`);

  // Agrupa por categoria para mostrar preview
  const preview = {};
  for (const p of produtos) {
    const cat = getCategoria(p.nome);
    if (!preview[cat]) preview[cat] = [];
    preview[cat].push(p.nome);
  }

  console.log("Preview das categorias:");
  for (const [cat, nomes] of Object.entries(preview).sort()) {
    console.log(`\n  📂 ${cat} (${nomes.length})`);
    nomes.forEach(n => console.log(`     - ${n}`));
  }

  console.log("\nAtualizando banco de dados...");

  let ok = 0;
  for (const p of produtos) {
    const novaCat = getCategoria(p.nome);
    const { error: err } = await supabase
      .from("produtos")
      .update({ categoria: novaCat })
      .eq("id", p.id);

    if (err) {
      console.error(`  ERRO ${p.nome}:`, err.message);
    } else {
      ok++;
    }
  }

  console.log(`\nPronto! ${ok}/${produtos.length} produtos categorizados.`);
}

main();
