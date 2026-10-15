export interface PastaConfig {
  id: string;
  nome: string;
  descricao: string;
  cor: string;
  icone: string;
  ordem: number;
}

export const PASTAS_PADRAO: PastaConfig[] = [
  { id: "1", nome: "Vasos", descricao: "Linha tradicional de vasos", cor: "#2563eb", icone: "Package", ordem: 1 },
  { id: "2", nome: "ABC Cerâmica", descricao: "Vasos e cerâmicas ABC", cor: "#d97706", icone: "Sparkles", ordem: 2 },
  { id: "3", nome: "Jardinagem", descricao: "Insumos, substratos e adubos Mogi Mirim", cor: "#16a34a", icone: "Sprout", ordem: 3 },
];

/**
 * Retorna a pasta do produto.
 * Se o produto já possui a propriedade `pasta` gravada, respeita-a.
 * Caso contrário, faz o vínculo inteligente baseado no representante e categoria.
 */
export const getProdutoPasta = (p: any): string => {
  if (p?.pasta && typeof p.pasta === "string" && p.pasta.trim() !== "") {
    return p.pasta;
  }

  const rep = (p?.representante || "").toLowerCase();
  if (rep.includes("abc")) {
    return "ABC Cerâmica";
  }

  const cat = (p?.categoria || "").toLowerCase();
  const nome = (p?.nome || "").toLowerCase();

  if (
    rep.includes("mogi") ||
    rep.includes("jardinagem") ||
    [
      "substrato",
      "fertilizante",
      "insumo",
      "adubo",
      "terra",
      "areia",
      "argila",
      "casca",
      "húmus",
      "humus",
      "esterco",
      "carvão",
      "turfa",
      "perlita",
      "vermiculita",
      "mogi mirim",
    ].some((c) => cat.includes(c) || nome.includes(c))
  ) {
    return "Jardinagem";
  }

  return "Vasos";
};
