export interface PastaConfig {
  id: string;
  nome: string;
  descricao: string;
  cor: string;
  icone: string;
  ordem: number;
}

export const PASTAS_PADRAO: PastaConfig[] = [
  { id: "1", nome: "Vasos", descricao: "Linha tradicional de vasos, pratos e floreiras", cor: "#2563eb", icone: "Package", ordem: 1 },
  { id: "2", nome: "ABC Cerâmica", descricao: "Vasos, cerâmicas e artesanais ABC", cor: "#d97706", icone: "Sparkles", ordem: 2 },
  { id: "3", nome: "Jardinagem", descricao: "Substratos, terras, adubos, fertilizantes e insumos", cor: "#16a34a", icone: "Sprout", ordem: 3 },
  { id: "4", nome: "Suportes e Estruturas", descricao: "Suportes de ferro, correntes, estacas de coco e rodízios", cor: "#6366f1", icone: "Layers", ordem: 4 },
  { id: "5", nome: "Decoração e Paisagismo", descricao: "Pedras ornamentais, pedriscos, seixos e granilhas", cor: "#ec4899", icone: "Sparkles", ordem: 5 },
  { id: "6", nome: "Linha Pet e Aves", descricao: "Comedouros, bebedouros e ninhos", cor: "#f97316", icone: "Heart", ordem: 6 },
  { id: "7", nome: "Ferramentas e Equipamentos", descricao: "Regadores, pulverizadores e equipamentos", cor: "#06b6d4", icone: "Folder", ordem: 7 },
];

/**
 * Retorna a pasta do produto.
 * Se o produto já possui a propriedade `pasta` gravada, respeita-a.
 * Caso contrário, faz o vínculo inteligente baseado no nome, representante e categoria.
 */
export const getProdutoPasta = (p: any): string => {
  if (p?.pasta && typeof p.pasta === "string" && p.pasta.trim() !== "") {
    return p.pasta;
  }

  const rep = (p?.representante || "").toUpperCase();
  const cat = (p?.categoria || "").toUpperCase();
  const nome = (p?.nome || "").toUpperCase();

  // 1. ABC Cerâmica (todos do representante ABC Cerâmica)
  if (rep.includes("ABC")) {
    return "ABC Cerâmica";
  }

  // 2. Linha Pet e Aves
  if (
    nome.includes("COMEDOURO") ||
    nome.includes("BEBEDOURO") ||
    nome.includes("PÁSSARO") ||
    nome.includes("PASSARO") ||
    nome.includes("COELHO") ||
    nome.includes("GALINHA") ||
    nome.includes("CÃES") ||
    nome.includes("GATOS") ||
    cat.includes("PET")
  ) {
    return "Linha Pet e Aves";
  }

  // 3. Suportes e Estruturas
  if (
    nome.includes("SUPORTE") ||
    nome.includes("CORRENTE") ||
    nome.includes("CORRENTÃO") ||
    nome.includes("CORRENTAO") ||
    nome.includes("ESTACA") ||
    nome.includes("GANCHO") ||
    nome.includes("RODÍZIO") ||
    nome.includes("RODIZIO") ||
    cat.includes("SUPORTE")
  ) {
    return "Suportes e Estruturas";
  }

  // 4. Decoração e Paisagismo
  if (
    nome.includes("PEDRA") ||
    nome.includes("PEDRISCO") ||
    nome.includes("SEIXO") ||
    nome.includes("GRANILHA") ||
    cat.includes("DECORAÇÃO") ||
    cat.includes("PAISAGISMO")
  ) {
    return "Decoração e Paisagismo";
  }

  // 5. Ferramentas e Equipamentos
  if (
    nome.includes("REGADOR") ||
    nome.includes("PULVERIZADOR") ||
    nome.includes("TESOURA") ||
    cat.includes("FERRAMENTA")
  ) {
    return "Ferramentas e Equipamentos";
  }

  // 6. Jardinagem (Substratos, Terras, Fertilizantes, Adubos, etc.)
  if (
    nome.includes("TERRA") ||
    nome.includes("SUBSTRATO") ||
    nome.includes("SUBTRATO") ||
    nome.includes("FERTILIZANTE") ||
    nome.includes("HÚMUS") ||
    nome.includes("HUMUS") ||
    nome.includes("ESTERCO") ||
    nome.includes("COMPOSTO") ||
    nome.includes("FLORES E FOLHAGENS") ||
    nome.includes("UREIA") ||
    nome.includes("CALCÁRIO") ||
    nome.includes("CALCARIO") ||
    nome.includes("FARINHA DE OSSO") ||
    nome.includes("TORTA DE MAMONA") ||
    nome.includes("ARGILA EXPANDIDA") ||
    nome.includes("CARVÃO") ||
    nome.includes("CARVAO") ||
    nome.includes("CASCA DE PINUS") ||
    nome.includes("CHIP DE COCO") ||
    nome.includes("FIBRA DE COCO") ||
    nome.includes("PO DE COCO") ||
    nome.includes("PÓ DE COCO") ||
    nome.includes("AREIA") ||
    nome.includes("MUSGO") ||
    cat.includes("SUBSTRATO") ||
    cat.includes("FERTILIZANTE") ||
    cat.includes("JARDINAGEM") ||
    rep.includes("MOGI")
  ) {
    return "Jardinagem";
  }

  return "Vasos";
};
