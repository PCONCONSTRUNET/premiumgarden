import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const produtos = [
  { nome: "04/14/08 FERTILIZANTES", preco: 7.90, desc: "PCT 10. 500GR" },
  { nome: "10/10/10 FERTILIZANTES", preco: 7.90, desc: "PCT 10 500 GR" },
  { nome: "AREIA DE RIO", preco: 2.99, desc: "FD X 10" },
  { nome: "ARGILA EXPANDIDA /500GR", preco: 2.99, desc: "7895950001 FD x 20 Marca : GARDEN PLUS" },
  { nome: "ARGILA EXPANDIDA 2 KILOS", preco: 8.99, desc: "FARDO 10 UN" },
  { nome: "CACTOS E SUCULENTAS FARDO 10 UNIDADES", preco: 5.30, desc: "Marca : 2 KILOS" },
  { nome: "CALCÁRIO 1/5 KILOS", preco: 7.90, desc: "" },
  { nome: "CARVÃO VEGETAL", preco: 6.90, desc: "" },
  { nome: "CASCA DE PINUS", preco: 7.03, desc: "FD x 10 Marca : GARDEN PLUS" },
  { nome: "CHIP DE COCO", preco: 5.60, desc: "FD X 20 Marca : GARDEN PLUS" },
  { nome: "CORRENTAO 54", preco: 12.99, desc: "FD X 12" },
  { nome: "CORRENTAO 64", preco: 13.99, desc: "FD X 12" },
  { nome: "CORRENTE 34", preco: 4.99, desc: "FD X 12" },
  { nome: "CORRENTE 44", preco: 5.99, desc: "FD X 12" },
  { nome: "CORRENTE 54", preco: 6.49, desc: "FD X 12" },
  { nome: "CORRENTE 64", preco: 6.99, desc: "FD X 12" },
  { nome: "CORRENTE 74", preco: 7.99, desc: "FD X 12" },
  { nome: "ESTACA COCO 50/CM", preco: 16.90, desc: "" },
  { nome: "ESTACA COCO 60/CM", preco: 19.90, desc: "" },
  { nome: "ESTERCO BOVINO 1 kilo", preco: 2.99, desc: "Fd x 15" },
  { nome: "ESTERCO BOVINO CURRAL", preco: 4.99, desc: "5 LITROS" },
  { nome: "ESTERCO CURRAL 20 LITROS", preco: 19.90, desc: "" },
  { nome: "ESTERCO CURRAL ORGÂNICO", preco: 3.90, desc: "1 kilo" },
  { nome: "ESTERCO GALINHA ORGANICO", preco: 6.90, desc: "" },
  { nome: "FARINHA DE OSSO", preco: 9.90, desc: "PCT 10" },
  { nome: "FIBRA DE COCO LAVADA 1.8 LITROS", preco: 5.99, desc: "FARDO X 15" },
  { nome: "GRANILHA PALHA", preco: 29.80, desc: "SACO 30 KILOS" },
  { nome: "HUMUS 20 KILOS", preco: 12.00, desc: "Marca : GARDEN PLUS" },
  { nome: "HÚMUS 2 KILO", preco: 3.99, desc: "Fd x 15 Marca : GARDEN PLUS" },
  { nome: "MUSGO ROSA", preco: 2.99, desc: "FD X 20 Marca : GARDEN PLUS" },
  { nome: "PEDRA BRANCA 30 KILOS", preco: 54.90, desc: "" },
  { nome: "PEDRA SEIXO 5 KILOS", preco: 14.90, desc: "" },
  { nome: "PEDRA DE RIO AREIA 1KG", preco: 2.99, desc: "" },
  { nome: "PEDRA SEIXO 1 KILOS", preco: 2.99, desc: "FD x 10 P/M/G Marca : GARDEN PLUS" },
  { nome: "PEDRA SEIXO 10 KILOS", preco: 24.90, desc: "" },
  { nome: "PEDRISCO BRANCO", preco: 2.99, desc: "FD X 10 Marca : GARDEN PLUS" },
  { nome: "PO DE COCO", preco: 4.99, desc: "FD X 15 Marca : GARDEN PREMIUM/ 500 GRAMAS" },
  { nome: "PRATO VASO NÚMERO 17", preco: 2.20, desc: "" },
  { nome: "REGADOR GRANDE PRETO 8 LITROS", preco: 19.90, desc: "FD x 10" },
  { nome: "REGADOR PEQUENO PRETO 4/5", preco: 17.90, desc: "FD x 10" },
  { nome: "ROSAS DESERTO & BROMELLIAS FARDO 10 UNIDADES", preco: 6.90, desc: "Marca : 2 KILOS" },
  { nome: "SEIXO DE RIO AZEITONA", preco: 2.50, desc: "Fardo 20 unidades" },
  { nome: "SEIXO DE RIO COMUM", preco: 2.99, desc: "FD X 10" },
  { nome: "SEIXO DE RIO MESCLADO 03", preco: 2.99, desc: "Fardo 20 unidades" },
  { nome: "SEIXO DE RIO PRETO", preco: 2.99, desc: "Fardo 20 unidades" },
  { nome: "SUBTRATO DE ORQUÍDEAS GARDEN PLUS 1 kilo", preco: 7.00, desc: "Fd x 10 Marca : GARDEN PLUS" },
  { nome: "SUBTRATO ORQUÍDEAS MIX 500 GR", preco: 7.30, desc: "FARDO X 10" },
  { nome: "SUBTRATO ORQUÍDEAS PREMIUM 1/5 LITROS", preco: 9.90, desc: "FARDO X 10" },
  { nome: "SUPORTE A1", preco: 4.40, desc: "FD X 10" },
  { nome: "SUPORTE A2", preco: 6.52, desc: "FD x 10" },
  { nome: "SUPORTE A3", preco: 8.52, desc: "FD X 10" },
  { nome: "SUPORTE A4", preco: 13.80, desc: "FD X 10" },
  { nome: "SUPORTE CORAÇÃO 1", preco: 7.00, desc: "FD X 10" },
  { nome: "SUPORTE CORAÇÃO 2", preco: 7.50, desc: "FD X 10" },
  { nome: "SUPORTE CORAÇÃO 3", preco: 12.44, desc: "FD X 10" },
  { nome: "SUPORTE CORAÇÃO 4", preco: 15.99, desc: "FD X 10" },
  { nome: "TERRA GARDEN PREMIUM 2 KILOS", preco: 3.19, desc: "FD X 10" },
  { nome: "TERRA GARDEN PREMIUM 5 kilos", preco: 5.60, desc: "FD X 7" },
  { nome: "TERRA VEGETAL 10 KILOS", preco: 7.99, desc: "Marca : GARDEN PLUS" },
  { nome: "TERRA VEGETAL 2 RM", preco: 13.90, desc: "" },
  { nome: "TERRA VEGETAL 25 KILOS", preco: 13.90, desc: "Marca : GARDEN PLUS" },
  { nome: "TERRA VEGETAL PACHAMAMA 3 LITROS", preco: 3.19, desc: "FD x 10" },
  { nome: "TORTA DE MAMONA", preco: 0.01, desc: "PCT 10" },
  { nome: "Terra 15 Litros", preco: 9.90, desc: "" },
  { nome: "UREIA", preco: 0.01, desc: "FD x 10" },
];

async function main() {
  console.log(`Starting to insert ${produtos.length} products...`);
  
  for (const prod of produtos) {
    const payload = {
      codigo: `IMP-${Math.floor(Math.random() * 1000000)}`,
      nome: prod.nome,
      categoria: "Sem categoria", // default
      estoque: 100, // default dummy stock
      valor: prod.preco,
      status: "Ativo",
      imagem: "", // No image yet
      ncm: null,
      cores: prod.desc ? [prod.desc] : [],
    };
    
    // Check if it already exists by name just to be safe
    const { data: existing } = await supabase.from("produtos").select("id").eq("nome", prod.nome).single();
    if (existing) {
      console.log(`Skipping: ${prod.nome} (Already exists)`);
      continue;
    }

    const { error } = await supabase.from("produtos").insert([payload]);
    if (error) {
      console.error(`Error inserting ${prod.nome}:`, error.message);
    } else {
      console.log(`Successfully added: ${prod.nome} - R$ ${prod.preco}`);
    }
  }
  
  console.log("Done!");
}

main();
