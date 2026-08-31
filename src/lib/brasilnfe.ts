/**
 * Brasil NFe — Serviço de Integração
 * API: https://api.brasilnfe.com.br
 *
 * ATENÇÃO: O token está exposto no frontend (MVP). Para produção,
 * mover as chamadas para uma Supabase Edge Function.
 */

export const BRASIL_NFE_BASE_URL = "https://api.brasilnfe.com.br";

// Token fornecido para transmissão de documentos fiscais
export const BRASIL_NFE_TOKEN =
  "cEVOS0pSKzRoR2tQdFBBQURxbVdUY0ZqNDNtSU5DcmRyN01kUHZxcHhaST06T2IrNi9hY0Yva09yd28rTWk0U2pjQT09OjA2LzA3LzIwMzY=";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type TipoAmbiente = 1 | 2; // 1 = Produção, 2 = Homologação

export interface EnderecoNFe {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  codigoMunicipio: number;
  nomeMunicipio: string;
  uf: string;
  cep: string;
  codigoPais?: number;
  nomePais?: string;
  telefone?: string;
}

export interface EmitenteNFe {
  cnpj: string;
  xNome: string; // Razão social
  xFant?: string; // Nome fantasia
  ie: string; // Inscrição estadual
  im?: string; // Inscrição municipal
  crt: 1 | 2 | 3; // Regime tributário: 1=SN, 2=SN Excesso, 3=Normal
  endereco: EnderecoNFe;
}

export interface DestinatarioNFe {
  cpfCnpj: string;
  xNome: string;
  ie?: string;
  indIEDest?: 1 | 2 | 9; // 1=Contribuinte, 2=Isento, 9=Não contribuinte
  email?: string;
  endereco?: EnderecoNFe;
}

export interface ImpostoICMS {
  orig: number; // Origem da mercadoria (0=Nacional)
  cst?: string; // Para regime normal
  csosn?: string; // Para Simples Nacional
  modBC?: number;
  vBC?: number;
  pICMS?: number;
  vICMS?: number;
}

export interface ImpostoPIS {
  cst: string;
  vBC?: number;
  pPIS?: number;
  vPIS: number;
}

export interface ImpostoCOFINS {
  cst: string;
  vBC?: number;
  pCOFINS?: number;
  vCOFINS: number;
}

export interface ImpostoIPI {
  cEnq?: string;
  cst?: string;
  vBC?: number;
  pIPI?: number;
  vIPI?: number;
}

export interface ProdutoNFe {
  cProd: string; // Código do produto
  cEAN?: string; // Código de barras EAN
  xProd: string; // Descrição do produto
  ncm: string; // NCM (8 dígitos)
  cfop: string; // CFOP (4 dígitos)
  uCom: string; // Unidade comercial (ex: "UN", "KG", "CX")
  qCom: number; // Quantidade comercial
  vUnCom: number; // Valor unitário
  vProd: number; // Valor total do produto
  cEANTrib?: string;
  uTrib?: string;
  qTrib?: number;
  vUnTrib?: number;
  indTot?: 1 | 0;
  imposto: {
    icms: ImpostoICMS;
    pis?: ImpostoPIS;
    cofins?: ImpostoCOFINS;
    ipi?: ImpostoIPI;
  };
}

export interface TotaisNFe {
  vBC?: number;
  vICMS?: number;
  vICMSDeson?: number;
  vFCP?: number;
  vBCST?: number;
  vST?: number;
  vFCPST?: number;
  vFCPSTRet?: number;
  vProd: number;
  vFrete?: number;
  vSeg?: number;
  vDesc?: number;
  vII?: number;
  vIPI?: number;
  vIPIDevol?: number;
  vPIS?: number;
  vCOFINS?: number;
  vOutro?: number;
  vNF: number;
  vTotTrib?: number;
}

export interface PagamentoNFe {
  tPag: string; // 01=Dinheiro, 03=Cartão Crédito, 04=Cartão Débito, 15=Boleto, 90=Sem Pagamento
  vPag: number;
  tpIntegra?: 1 | 2;
}

export interface TransporteNFe {
  modFrete: 0 | 1 | 2 | 3 | 4 | 9; // 0=Emitente, 1=Destinatário, 2=Terceiros, 9=Sem transporte
  transportadora?: {
    cnpj?: string;
    xNome?: string;
    ie?: string;
    xEnder?: string;
    xMun?: string;
    uf?: string;
  };
  vol?: Array<{
    qVol?: number;
    esp?: string;
    marca?: string;
    pesoL?: number;
    pesoB?: number;
  }>;
}

export interface PayloadNFe {
  modelo?: number; // 55 = NF-e, 65 = NFC-e
  numero?: number;
  serie?: number;
  tipoAmbiente: TipoAmbiente;
  naturezaOperacao: string;
  emitente: EmitenteNFe;
  destinatario: DestinatarioNFe;
  produtos: ProdutoNFe[];
  totais: TotaisNFe;
  transporte: TransporteNFe;
  pagamentos: PagamentoNFe[];
  infAdic?: {
    infCpl?: string; // Informações complementares
    infAdFisco?: string;
  };
}

// ─── Respostas da API ─────────────────────────────────────────────────────────

export interface RespostaNFe {
  sucesso: boolean;
  id?: number;
  numero?: number;
  serie?: number;
  chaveAcesso?: string;
  numeroProtocolo?: string;
  codStatus?: number;
  dsStatus?: string;
  codLote?: string;
  erro?: string;
  erros?: string[];
}

export interface RespostaConsulta {
  id: number;
  numero: number;
  serie: number;
  chaveAcesso: string;
  numeroProtocolo: string;
  codStatus: number;
  dsStatus: string;
  tipoAmbiente: TipoAmbiente;
  xmlBase64?: string;
  pdfBase64?: string;
}

// ─── Cliente HTTP base ────────────────────────────────────────────────────────

// Edge Function do Supabase como proxy CORS confiável
const PROXY_FUNCTION_URL = "https://mpbmssohpjwijkyhtucm.supabase.co/functions/v1/brasilnfe-proxy";

async function brasilNFeRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(PROXY_FUNCTION_URL, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Token": BRASIL_NFE_TOKEN,
      "Target-Path": path,
      ...(options.headers || {}),
    },
  });

  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After") ?? "10";
    throw new Error(
      `Rate limit atingido. Aguarde ${retryAfter}s antes de tentar novamente.`,
    );
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    throw new Error(`Erro na API (Status ${response.status})`);
  }

  if (!response.ok || (data && typeof data === "object" && (
    data.sucesso === false ||
    (data.Error && data.Error !== "") ||
    (data.ReturnNF && data.ReturnNF.Ok === false)
  ))) {
    const msg =
      data?.Error ||
      data?.message ||
      data?.erro ||
      data?.ReturnNF?.DsStatusRespostaSefaz ||
      (Array.isArray(data?.erros) ? data.erros.join("; ") : null) ||
      `Erro na SEFAZ (Status ${response.status})`;
    throw new Error(msg);
  }

  return data as T;
}

// ─── Funções de API ───────────────────────────────────────────────────────────

/**
 * Emite uma NF-e (modelo 55) de forma síncrona.
 * Retorna o resultado da transmissão à SEFAZ.
 */
export async function emitirNFe(payload: PayloadNFe): Promise<RespostaNFe> {
  const raw = await brasilNFeRequest<any>("/services/Fiscal/EnviarNotaFiscal", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  // Mapear resposta real da API Brasil NFe para nossa interface
  const nf = raw?.ReturnNF ?? raw;
  return {
    sucesso: nf?.Ok === true || nf?.sucesso === true,
    id: nf?.Id ?? raw?.id,
    numero: nf?.Numero ?? nf?.numero,
    serie: nf?.Serie ?? nf?.serie,
    chaveAcesso: nf?.ChaveNF ?? nf?.chaveAcesso,
    numeroProtocolo: nf?.NumeroProtocolo ?? nf?.numeroProtocolo,
    codStatus: nf?.CodStatusRespostaSefaz ?? nf?.codStatus,
    dsStatus: nf?.DsStatusRespostaSefaz ?? nf?.dsStatus,
    erro: raw?.Error ?? raw?.erro,
  };
}

/**
 * Consulta o status de uma NF-e pelo ID interno do Brasil NFe.
 */
export async function consultarNFe(id: number): Promise<RespostaConsulta> {
  return brasilNFeRequest<RespostaConsulta>(`/services/Fiscal/ConsultarNFe/${id}`, {
    method: "GET",
  });
}

/**
 * Cancela uma NF-e autorizada.
 * @param id - ID interno da nota no Brasil NFe
 * @param justificativa - Mínimo 15, máximo 255 caracteres
 */
export async function cancelarNFe(
  id: number,
  justificativa: string,
): Promise<RespostaNFe> {
  return brasilNFeRequest<RespostaNFe>(`/services/Fiscal/CancelarNFe/${id}`, {
    method: "POST",
    body: JSON.stringify({ justificativa }),
  });
}

/**
 * Baixa o PDF da DANFE em Base64.
 */
export async function downloadDanfe(id: number): Promise<string> {
  const resp = await brasilNFeRequest<{ pdfBase64: string }>(
    `/services/Fiscal/DownloadDanfe/${id}`,
    { method: "GET" },
  );
  return resp.pdfBase64;
}

/**
 * Baixa o XML da NF-e em Base64.
 */
export async function downloadXml(id: number): Promise<string> {
  const resp = await brasilNFeRequest<{ xmlBase64: string }>(
    `/services/Fiscal/DownloadXml/${id}`,
    { method: "GET" },
  );
  return resp.xmlBase64;
}

/**
 * Testa a conexão com a API Brasil NFe (verifica se o token é válido).
 */
export async function testarConexao(): Promise<boolean> {
  try {
    await brasilNFeRequest("/Status", { method: "GET" });
    return true;
  } catch {
    return false;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converte Base64 para Blob e inicia o download no browser.
 */
export function downloadBase64File(
  base64: string,
  filename: string,
  mimeType: string,
): void {
  const bytes = atob(base64);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);
  const blob = new Blob([buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Formata a chave de acesso (44 dígitos) com espaços a cada 4 dígitos.
 */
export function formatarChaveAcesso(chave: string): string {
  return chave.replace(/(.{4})/g, "$1 ").trim();
}

/**
 * Retorna a descrição legível do código de status SEFAZ.
 */
export function descreverStatusSefaz(codStatus: number): string {
  const STATUS: Record<number, string> = {
    100: "Autorizado o uso da NF-e",
    101: "Cancelamento de NF-e homologado",
    110: "Uso denegado",
    150: "Autorizado fora do prazo",
    204: "Duplicidade de NF-e",
    225: "Rejeição: Falha no Schema XML",
    999: "Rejeição: Erro não catalogado",
  };
  return STATUS[codStatus] ?? `Status ${codStatus}`;
}

/**
 * Retorna a cor de badge para o status da nota.
 */
export function corStatusNFe(codStatus?: number, dsStatus?: string): string {
  if (!codStatus) return "bg-warning/15 text-warning border-0";
  if (codStatus === 100 || codStatus === 150)
    return "bg-success/15 text-success border-0";
  if (codStatus === 101) return "bg-info/15 text-info border-0";
  if (codStatus === 110) return "bg-destructive/10 text-destructive border-0";
  return "bg-muted text-muted-foreground border-0";
}

/**
 * Retorna o label de ambiente.
 */
export function labelAmbiente(tipoAmbiente: TipoAmbiente): string {
  return tipoAmbiente === 1 ? "Produção" : "Homologação";
}
