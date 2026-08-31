import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  FileCode2,
  Send,
  Building2,
  Package,
  CreditCard,
  Truck,
  Info,
  Copy,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  emitirNFe,
  downloadBase64File,
  corStatusNFe,
  labelAmbiente,
  downloadDanfe,
  downloadXml,
  type PayloadNFe,
  type TipoAmbiente,
  type ProdutoNFe,
} from "@/lib/brasilnfe";

export const Route = createFileRoute("/app/fiscal")({
  head: () => ({ meta: [{ title: "Fiscal — VIVAVERDE ERP" }] }),
  component: Fiscal,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface ItemEmissao {
  id: string;
  produto_id: string;
  produto_nome: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
  // Campos fiscais a serem preenchidos
  ncm: string;
  cfop: string;
  uCom: string;
  orig: number;
  csosn: string; // Simples Nacional
  cst: string; // Regime Normal
  cProd: string;
}

interface ConfigEmissao {
  // Destinatário
  cpfCnpj: string;
  xNome: string;
  email: string;
  indIEDest: "1" | "2" | "9";
  // Endereço destinatário
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  nomeMunicipio: string;
  codigoMunicipio: string;
  uf: string;
  cep: string;
  // Informações gerais
  naturezaOperacao: string;
  tipoAmbiente: TipoAmbiente;
  // Pagamento
  tPag: string;
  // Transporte
  modFrete: string;
  // Informações complementares
  infCpl: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const CFOP_OPTIONS = [
  { value: "5102", label: "5102 — Venda de mercadoria adquirida ou recebida de terceiros" },
  { value: "5103", label: "5103 — Venda de produção do estabelecimento" },
  { value: "5405", label: "5405 — Venda de mercadoria com ST" },
  { value: "5906", label: "5906 — Remessa para demonstração" },
  { value: "6102", label: "6102 — Venda de mercadoria (interestadual)" },
];

const CSOSN_OPTIONS = [
  { value: "102", label: "102 — Tributada pelo Simples sem permissão de crédito" },
  { value: "400", label: "400 — Não tributada pelo Simples Nacional" },
  { value: "500", label: "500 — ICMS cobrado anteriormente por ST" },
  { value: "900", label: "900 — Outros (Simples Nacional)" },
];

const CST_OPTIONS = [
  { value: "00", label: "00 — Tributada integralmente" },
  { value: "20", label: "20 — Com redução de BC" },
  { value: "40", label: "40 — Isenta" },
  { value: "41", label: "41 — Não tributada" },
  { value: "60", label: "60 — ICMS cobrado por ST" },
];

const TPAG_OPTIONS = [
  { value: "01", label: "01 — Dinheiro" },
  { value: "02", label: "02 — Cheque" },
  { value: "03", label: "03 — Cartão de Crédito" },
  { value: "04", label: "04 — Cartão de Débito" },
  { value: "05", label: "05 — Crédito Loja" },
  { value: "10", label: "10 — Vale Alimentação" },
  { value: "15", label: "15 — Boleto Bancário" },
  { value: "90", label: "90 — Sem Pagamento" },
  { value: "99", label: "99 — Outros" },
];

// ─── Componente Principal ─────────────────────────────────────────────────────

function Fiscal() {
  const [notas, setNotas] = useState<any[]>([]);
  const [pendentes, setPendentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [configuracoes, setConfiguracoes] = useState<any>(null);

  // Modal de emissão
  const [modalOpen, setModalOpen] = useState(false);
  const [vendaSelecionada, setVendaSelecionada] = useState<any>(null);
  const [itensEmissao, setItensEmissao] = useState<ItemEmissao[]>([]);
  const [configEmissao, setConfigEmissao] = useState<ConfigEmissao>({
    cpfCnpj: "",
    xNome: "",
    email: "",
    indIEDest: "9",
    logradouro: "",
    numero: "S/N",
    complemento: "",
    bairro: "",
    nomeMunicipio: "",
    codigoMunicipio: "",
    uf: "",
    cep: "",
    naturezaOperacao: "Venda de mercadoria",
    tipoAmbiente: 2,
    tPag: "01",
    modFrete: "9",
    infCpl: "",
  });
  const [emitindo, setEmitindo] = useState(false);
  const [erroEmissao, setErroEmissao] = useState<string | null>(null);
  const [usarCRT, setUsarCRT] = useState<1 | 3>(1); // 1=Simples Nacional, 3=Normal

  // Ações na tabela de notas
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const fetchFiscalData = async () => {
    setLoading(true);
    try {
      const { data: nfData, error: nfErr } = await supabase
        .from("notas_fiscais")
        .select("*, vendas(valor_total, clientes(nome))")
        .order("created_at", { ascending: false });

      if (nfErr) console.error("Erro notas_fiscais:", nfErr.message);
      if (nfData) setNotas(nfData);

      const { data: vData, error: vErr } = await supabase
        .from("vendas")
        .select("*, clientes(nome, cidade, cpf_cnpj, endereco, uf)");

      if (vErr) console.error("Erro vendas:", vErr.message);

      if (vData) {
        const nfIds = nfData?.map((n) => n.venda_id) || [];
        const todas = vData.filter((v) => !nfIds.includes(v.id));
        setPendentes(todas);
      }

      // Buscar configurações da empresa
      const { data: cfg } = await supabase
        .from("configuracoes")
        .select("*")
        .eq("id", 1)
        .single();
      if (cfg) setConfiguracoes(cfg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiscalData();
  }, []);

  // ── Abrir modal de emissão ────────────────────────────────────────────────

  const handleAbrirEmissao = async (venda: any) => {
    setVendaSelecionada(venda);
    setErroEmissao(null);
    setEmitindo(false);

    // Buscar itens da venda
    const { data: itens } = await supabase
      .from("vendas_itens")
      .select("*, produtos(nome, codigo, ncm)")
      .eq("venda_id", venda.id);

    const itensFormatados: ItemEmissao[] = (itens || []).map((item: any, idx: number) => ({
      id: item.id,
      produto_id: item.produto_id,
      produto_nome: item.produtos?.nome || "Produto",
      quantidade: Number(item.quantidade),
      valor_unitario: Number(item.valor_unitario),
      subtotal: Number(item.subtotal),
      ncm: item.produtos?.ncm || "",
      cfop: item.produtos?.cfop || "5102",
      uCom: "UN",
      orig: 0,
      csosn: "400",
      cst: "40",
      cProd: item.produtos?.codigo || String(idx + 1).padStart(6, "0"),
    }));

    setItensEmissao(itensFormatados);

    // Pré-preencher dados do destinatário
    const cli = venda.clientes;
    let parsedEndereco = cli?.endereco || "";
    let parsedNumero = "S/N";
    let parsedBairro = "Centro";
    let parsedCep = "";

    if (parsedEndereco) {
      const parts = parsedEndereco.split(",").map((p: string) => p.trim());
      const newEnderecoParts: string[] = [];
      for (const part of parts) {
        if (part.startsWith("nº ")) {
          parsedNumero = part.substring(3);
        } else if (part.startsWith("Bairro ")) {
          parsedBairro = part.substring(7);
        } else if (part.startsWith("CEP ")) {
          parsedCep = part.substring(4);
        } else {
          newEnderecoParts.push(part);
        }
      }
      parsedEndereco = newEnderecoParts.join(", ");
    }

    setConfigEmissao((prev) => ({
      ...prev,
      cpfCnpj: cli?.cpf_cnpj?.replace(/\D/g, "") || "",
      xNome: cli?.nome || "CONSUMIDOR FINAL",
      logradouro: parsedEndereco || "",
      numero: parsedNumero,
      bairro: parsedBairro,
      nomeMunicipio: cli?.cidade || "",
      uf: cli?.uf || "",
      cep: parsedCep.replace(/\D/g, "") || "",
    }));

    setModalOpen(true);
  };

  const handleBuscarIBGE = async () => {
    if (!configEmissao.nomeMunicipio || !configEmissao.uf) {
      alert("Preencha o Município e a UF primeiro para buscar o código.");
      return;
    }
    try {
      const uf = configEmissao.uf.toUpperCase();
      const res = await fetch(`https://brasilapi.com.br/api/ibge/municipios/v1/${uf}`);
      const cidades = await res.json();
      
      const cidadeTarget = configEmissao.nomeMunicipio.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      const encontrada = cidades.find((c: any) => 
        c.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === cidadeTarget
      );

      if (encontrada) {
        setConfigEmissao((p) => ({ ...p, codigoMunicipio: String(encontrada.codigo_ibge) }));
      } else {
        alert("Município não encontrado nesta UF. Verifique se o nome está correto (ex: São Paulo).");
      }
    } catch (err) {
      alert("Erro ao buscar código IBGE. Tente digitar manualmente.");
    }
  };

  // ── Atualizar item de emissão ─────────────────────────────────────────────

  const updateItem = (id: string, field: keyof ItemEmissao, value: any) => {
    setItensEmissao((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // ── Montar payload e emitir ───────────────────────────────────────────────

  const handleEmitir = async () => {
    if (!configuracoes) {
      setErroEmissao("Configure os dados da empresa em Configurações → Perfil da Empresa antes de emitir.");
      return;
    }
    if (!configuracoes.cnpj) {
      setErroEmissao("CNPJ do emissor não configurado. Acesse Configurações → Perfil da Empresa.");
      return;
    }

    const valorTotal = itensEmissao.reduce((acc, i) => acc + i.subtotal, 0);

    const produtos: ProdutoNFe[] = itensEmissao.map((item) => ({
      cProd: item.cProd,
      xProd: item.produto_nome,
      ncm: item.ncm.replace(/\D/g, "").padStart(8, "0") || "99999999",
      cfop: item.cfop,
      uCom: item.uCom,
      qCom: item.quantidade,
      vUnCom: item.valor_unitario,
      vProd: item.subtotal,
      uTrib: item.uCom,
      qTrib: item.quantidade,
      vUnTrib: item.valor_unitario,
      indTot: 1,
      imposto: {
        icms:
          usarCRT === 1
            ? { orig: item.orig, csosn: item.csosn }
            : { orig: item.orig, cst: item.cst, modBC: 3, vBC: item.subtotal, pICMS: 0, vICMS: 0 },
        pis: { cst: "07", vPIS: 0 },
        cofins: { cst: "07", vCOFINS: 0 },
      },
    }));

    // Endereço do emitente a partir das configurações
    const [logEmit, numEmit] = (configuracoes.endereco || "S/N").split(",");

    const payload: PayloadNFe = {
      modelo: 55, // Forçar NF-e (evitar NFC-e)
      tipoAmbiente: configEmissao.tipoAmbiente,
      naturezaOperacao: configEmissao.naturezaOperacao,
      emitente: {
        cnpj: (configuracoes.cnpj || "").replace(/\D/g, ""),
        xNome: configuracoes.razao_social || "EMISSOR",
        ie: (configuracoes.inscricao_estadual || "").replace(/\D/g, ""),
        crt: usarCRT,
        endereco: {
          logradouro: logEmit?.trim() || "Rua",
          numero: numEmit?.trim() || "S/N",
          bairro: "Centro",
          codigoMunicipio: 0,
          nomeMunicipio: "Município",
          uf: "SP",
          cep: "00000000",
        },
      },
      destinatario: {
        cpfCnpj: configEmissao.cpfCnpj.replace(/\D/g, "") || "00000000000",
        xNome: configEmissao.xNome || "CONSUMIDOR FINAL",
        indIEDest: Number(configEmissao.indIEDest) as 1 | 2 | 9,
        email: configEmissao.email || undefined,
        endereco: configEmissao.logradouro
          ? {
              logradouro: configEmissao.logradouro,
              numero: configEmissao.numero,
              complemento: configEmissao.complemento || undefined,
              bairro: configEmissao.bairro || "Centro",
              codigoMunicipio: Number(configEmissao.codigoMunicipio) || 0,
              nomeMunicipio: configEmissao.nomeMunicipio || "Município",
              uf: configEmissao.uf || "SP",
              cep: configEmissao.cep.replace(/\D/g, "") || "00000000",
            }
          : undefined,
      },
      produtos,
      totais: {
        vProd: valorTotal,
        vNF: valorTotal,
        vBC: 0,
        vICMS: 0,
        vPIS: 0,
        vCOFINS: 0,
      },
      transporte: {
        modFrete: Number(configEmissao.modFrete) as 0 | 1 | 2 | 3 | 4 | 9,
      },
      pagamentos: [{ tPag: configEmissao.tPag, vPag: valorTotal }],
      infAdic: configEmissao.infCpl
        ? { infCpl: configEmissao.infCpl }
        : undefined,
    };

    setEmitindo(true);
    setErroEmissao(null);

    try {
      const resultado = await emitirNFe(payload);

      // Salvar no Supabase
      await supabase.from("notas_fiscais").insert([{
        venda_id: vendaSelecionada.id,
        numero: String(resultado.numero || ""),
        chave_acesso: resultado.chaveAcesso || "",
        status: resultado.codStatus === 100 || resultado.codStatus === 150
          ? "Autorizada"
          : "Erro",
        brasilnfe_id: resultado.id ?? null,
        cod_lote: resultado.codLote ?? null,
        numero_protocolo: resultado.numeroProtocolo ?? null,
        tipo_ambiente: configEmissao.tipoAmbiente,
        cod_status: resultado.codStatus ?? null,
        ds_status: resultado.dsStatus ?? resultado.erro ?? null,
        error_message: resultado.erro ?? null,
        payload_enviado: payload,
      }]);

      setModalOpen(false);
      fetchFiscalData();

      if (resultado.codStatus === 100 || resultado.codStatus === 150) {
        // Exibir mensagem de sucesso
      }
    } catch (err: any) {
      setErroEmissao(err.message || "Erro desconhecido ao transmitir para a SEFAZ.");
    } finally {
      setEmitindo(false);
    }
  };

  // ── Baixar DANFE ──────────────────────────────────────────────────────────

  const handleDownloadDanfe = async (nota: any) => {
    if (!nota.brasilnfe_id) return;
    setDownloadingId(nota.brasilnfe_id);
    try {
      // Tentar pegar do banco primeiro
      if (nota.pdf_base64) {
        downloadBase64File(nota.pdf_base64, `danfe_${nota.numero}.pdf`, "application/pdf");
      } else {
        const base64 = await downloadDanfe(nota.brasilnfe_id);
        downloadBase64File(base64, `danfe_${nota.numero}.pdf`, "application/pdf");
      }
    } catch (err: any) {
      alert("Erro ao baixar DANFE: " + err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadXml = async (nota: any) => {
    if (!nota.brasilnfe_id) return;
    setDownloadingId(nota.brasilnfe_id);
    try {
      if (nota.xml_base64) {
        downloadBase64File(nota.xml_base64, `nfe_${nota.numero}.xml`, "application/xml");
      } else {
        const base64 = await downloadXml(nota.brasilnfe_id);
        downloadBase64File(base64, `nfe_${nota.numero}.xml`, "application/xml");
      }
    } catch (err: any) {
      alert("Erro ao baixar XML: " + err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCopiarChave = (chave: string) => {
    navigator.clipboard.writeText(chave);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <PageHeader
        title="Fiscal"
        subtitle="Controle e emissão de NF-e via Brasil NFe"
        actions={
          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 gap-1.5 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Brasil NFe Conectado
          </Badge>
        }
      />

      {/* Cards de Resumo */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card className="shadow-card border-0 bg-gradient-to-br from-warning/10 to-warning/5">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Aguardando Emissão</p>
            <p className="text-3xl font-bold text-warning mt-1">
              {loading ? "—" : pendentes.length}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0 bg-gradient-to-br from-success/10 to-success/5">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">NF-e Autorizadas</p>
            <p className="text-3xl font-bold text-success mt-1">
              {loading ? "—" : notas.filter((n) => n.cod_status === 100 || n.status === "Autorizada").length}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0 bg-gradient-to-br from-info/10 to-info/5">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total em NF-e</p>
            <p className="text-3xl font-bold text-info mt-1">
              {loading
                ? "—"
                : `R$ ${notas
                    .filter((n) => n.cod_status === 100 || n.status === "Autorizada")
                    .reduce((acc, n) => acc + Number(n.vendas?.valor_total || 0), 0)
                    .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2 mb-6">
        {/* Tabela: Aguardando Emissão */}
        <Card className="shadow-card overflow-x-auto">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              Aguardando Emissão
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Venda</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : pendentes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success opacity-50" />
                    Nenhuma venda pendente de NF-e.
                  </TableCell>
                </TableRow>
              ) : (
                pendentes.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">
                      {p.numero ? String(p.numero).padStart(3, "0") : p.id.substring(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {p.clientes?.nome || "Consumidor Final"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      R$ {Number(p.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => handleAbrirEmissao(p)}
                        size="sm"
                        className="bg-primary/10 text-primary hover:bg-primary/20 border-0 gap-1.5"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Emitir NF-e
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Tabela: Notas Emitidas */}
        <Card className="shadow-card overflow-x-auto">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Notas Emitidas Recentes
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NF-e</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Ambiente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : notas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma nota emitida ainda.
                  </TableCell>
                </TableRow>
              ) : (
                notas.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell>
                      <div className="font-mono font-bold">{n.numero || "—"}</div>
                      {n.chave_acesso && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleCopiarChave(n.chave_acesso)}
                              className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mt-0.5"
                            >
                              {n.chave_acesso.substring(0, 16)}…
                              <Copy className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-mono text-xs">{n.chave_acesso}</p>
                            <p className="text-xs text-muted-foreground">Clique para copiar</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {n.vendas?.clientes?.nome || "Consumidor Final"}
                    </TableCell>
                    <TableCell>
                      {n.tipo_ambiente ? (
                        <Badge
                          className={
                            n.tipo_ambiente === 1
                              ? "bg-success/15 text-success border-0 text-xs"
                              : "bg-warning/15 text-warning border-0 text-xs"
                          }
                        >
                          {labelAmbiente(n.tipo_ambiente)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={corStatusNFe(n.cod_status, n.ds_status)}>
                        {n.ds_status || n.status || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {n.brasilnfe_id && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  disabled={downloadingId === n.brasilnfe_id}
                                  onClick={() => handleDownloadDanfe(n)}
                                >
                                  {downloadingId === n.brasilnfe_id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Download className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Baixar DANFE (PDF)</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  disabled={downloadingId === n.brasilnfe_id}
                                  onClick={() => handleDownloadXml(n)}
                                >
                                  <FileCode2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Baixar XML</TooltipContent>
                            </Tooltip>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Card Info Brasil NFe */}
      <Card className="shadow-card bg-gradient-to-r from-primary/5 via-transparent to-transparent border-primary/20">
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
            <FileText className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">Integração Brasil NFe Ativa</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              NF-e transmitidas diretamente à SEFAZ via Brasil NFe. Por padrão em{" "}
              <span className="font-semibold text-warning">homologação</span> — altere para produção
              em <strong>Configurações → Fiscal</strong>.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={fetchFiscalData}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </CardContent>
      </Card>

      {/* ── Modal de Emissão ──────────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Emitir NF-e — Venda{" "}
              {vendaSelecionada?.numero
                ? String(vendaSelecionada.numero).padStart(3, "0")
                : vendaSelecionada?.id?.substring(0, 8).toUpperCase()}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados fiscais e transmita para a SEFAZ via Brasil NFe.
            </DialogDescription>
          </DialogHeader>

          {/* Ambiente + CRT */}
          <div className="flex flex-wrap gap-4 p-3 rounded-lg bg-muted/40 mb-2">
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium">Ambiente:</Label>
              <Select
                value={String(configEmissao.tipoAmbiente)}
                onValueChange={(v) =>
                  setConfigEmissao((p) => ({ ...p, tipoAmbiente: Number(v) as TipoAmbiente }))
                }
              >
                <SelectTrigger className="h-8 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-warning" />
                      Homologação
                    </span>
                  </SelectItem>
                  <SelectItem value="1">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-success" />
                      Produção
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium">Regime:</Label>
              <Select
                value={String(usarCRT)}
                onValueChange={(v) => setUsarCRT(Number(v) as 1 | 3)}
              >
                <SelectTrigger className="h-8 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Simples Nacional</SelectItem>
                  <SelectItem value="3">Regime Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="destinatario">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="destinatario" className="text-xs gap-1">
                <Building2 className="h-3.5 w-3.5" />
                Destinatário
              </TabsTrigger>
              <TabsTrigger value="produtos" className="text-xs gap-1">
                <Package className="h-3.5 w-3.5" />
                Produtos
              </TabsTrigger>
              <TabsTrigger value="pagamento" className="text-xs gap-1">
                <CreditCard className="h-3.5 w-3.5" />
                Pagamento
              </TabsTrigger>
              <TabsTrigger value="outros" className="text-xs gap-1">
                <Truck className="h-3.5 w-3.5" />
                Outros
              </TabsTrigger>
            </TabsList>

            {/* ── Aba Destinatário ── */}
            <TabsContent value="destinatario" className="space-y-4 mt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs mb-1.5 block">CPF/CNPJ do Destinatário</Label>
                  <Input
                    value={configEmissao.cpfCnpj}
                    onChange={(e) =>
                      setConfigEmissao((p) => ({ ...p, cpfCnpj: e.target.value }))
                    }
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Nome / Razão Social</Label>
                  <Input
                    value={configEmissao.xNome}
                    onChange={(e) =>
                      setConfigEmissao((p) => ({ ...p, xNome: e.target.value }))
                    }
                    placeholder="CONSUMIDOR FINAL"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">E-mail</Label>
                  <Input
                    type="email"
                    value={configEmissao.email}
                    onChange={(e) =>
                      setConfigEmissao((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="email@destinatario.com"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Indicador IE Destinatário</Label>
                  <Select
                    value={configEmissao.indIEDest}
                    onValueChange={(v) =>
                      setConfigEmissao((p) => ({ ...p, indIEDest: v as "1" | "2" | "9" }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9">9 — Não Contribuinte</SelectItem>
                      <SelectItem value="1">1 — Contribuinte ICMS</SelectItem>
                      <SelectItem value="2">2 — Isento de IE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Endereço do Destinatário (opcional para Consumidor Final)
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label className="text-xs mb-1.5 block">Logradouro</Label>
                    <Input
                      value={configEmissao.logradouro}
                      onChange={(e) =>
                        setConfigEmissao((p) => ({ ...p, logradouro: e.target.value }))
                      }
                      placeholder="Rua das Flores"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Número</Label>
                    <Input
                      value={configEmissao.numero}
                      onChange={(e) =>
                        setConfigEmissao((p) => ({ ...p, numero: e.target.value }))
                      }
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Bairro</Label>
                    <Input
                      value={configEmissao.bairro}
                      onChange={(e) =>
                        setConfigEmissao((p) => ({ ...p, bairro: e.target.value }))
                      }
                      placeholder="Centro"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Município</Label>
                    <Input
                      value={configEmissao.nomeMunicipio}
                      onChange={(e) =>
                        setConfigEmissao((p) => ({ ...p, nomeMunicipio: e.target.value }))
                      }
                      placeholder="São Paulo"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 flex items-center justify-between">
                      <span>Cód. Município IBGE</span>
                      <button 
                        type="button" 
                        onClick={handleBuscarIBGE}
                        className="text-[10px] text-brand hover:underline"
                        title="Buscar código pelo nome do município"
                      >
                        Buscar Auto
                      </button>
                    </Label>
                    <Input
                      value={configEmissao.codigoMunicipio}
                      onChange={(e) =>
                        setConfigEmissao((p) => ({
                          ...p,
                          codigoMunicipio: e.target.value,
                        }))
                      }
                      placeholder="3550308"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">UF</Label>
                    <Input
                      value={configEmissao.uf}
                      onChange={(e) =>
                        setConfigEmissao((p) => ({
                          ...p,
                          uf: e.target.value.toUpperCase().slice(0, 2),
                        }))
                      }
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">CEP</Label>
                    <Input
                      value={configEmissao.cep}
                      onChange={(e) =>
                        setConfigEmissao((p) => ({ ...p, cep: e.target.value }))
                      }
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Aba Produtos ── */}
            <TabsContent value="produtos" className="space-y-4 mt-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-info/5 border border-info/20">
                <Info className="h-4 w-4 text-info shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Preencha o NCM (8 dígitos) e CFOP para cada item. Estes dados são
                  obrigatórios pela SEFAZ.
                </p>
              </div>

              {itensEmissao.map((item, idx) => (
                <div
                  key={item.id}
                  className="border rounded-xl p-4 space-y-3 bg-muted/10"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{item.produto_nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantidade}x R${" "}
                        {item.valor_unitario.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        ={" "}
                        <strong>
                          R${" "}
                          {item.subtotal.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </strong>
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Item {idx + 1}
                    </Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <Label className="text-xs mb-1.5 block">
                        NCM{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={item.ncm}
                        onChange={(e) => updateItem(item.id, "ncm", e.target.value)}
                        placeholder="00000000"
                        maxLength={8}
                        className={!item.ncm ? "border-warning/50 focus-visible:ring-warning/30" : ""}
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">
                        CFOP{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={item.cfop}
                        onValueChange={(v) => updateItem(item.id, "cfop", v)}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CFOP_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value} className="text-xs">
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">Unidade</Label>
                      <Select
                        value={item.uCom}
                        onValueChange={(v) => updateItem(item.id, "uCom", v)}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["UN", "PC", "KG", "CX", "LT", "M", "M2", "M3"].map((u) => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">Origem da Merc.</Label>
                      <Select
                        value={String(item.orig)}
                        onValueChange={(v) => updateItem(item.id, "orig", Number(v))}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0 — Nacional</SelectItem>
                          <SelectItem value="1">1 — Estrangeira (importação direta)</SelectItem>
                          <SelectItem value="2">2 — Estrangeira (adquirida no mercado interno)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {usarCRT === 1 ? (
                      <div>
                        <Label className="text-xs mb-1.5 block">CSOSN (Simples Nacional)</Label>
                        <Select
                          value={item.csosn}
                          onValueChange={(v) => updateItem(item.id, "csosn", v)}
                        >
                          <SelectTrigger className="text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CSOSN_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value} className="text-xs">
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div>
                        <Label className="text-xs mb-1.5 block">CST (Regime Normal)</Label>
                        <Select
                          value={item.cst}
                          onValueChange={(v) => updateItem(item.id, "cst", v)}
                        >
                          <SelectTrigger className="text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CST_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value} className="text-xs">
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* ── Aba Pagamento ── */}
            <TabsContent value="pagamento" className="space-y-4 mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs mb-1.5 block">Forma de Pagamento</Label>
                  <Select
                    value={configEmissao.tPag}
                    onValueChange={(v) =>
                      setConfigEmissao((p) => ({ ...p, tPag: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TPAG_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Natureza da Operação</Label>
                  <Input
                    value={configEmissao.naturezaOperacao}
                    onChange={(e) =>
                      setConfigEmissao((p) => ({ ...p, naturezaOperacao: e.target.value }))
                    }
                    placeholder="Venda de mercadoria"
                  />
                </div>
              </div>

              <div className="rounded-xl border p-4 bg-muted/20">
                <p className="text-xs text-muted-foreground mb-2">Resumo da Nota</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Produtos ({itensEmissao.length} itens)</span>
                    <span className="font-semibold">
                      R$ {itensEmissao
                        .reduce((a, i) => a + i.subtotal, 0)
                        .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-1.5">
                    <span className="font-semibold">Total NF-e</span>
                    <span className="font-bold text-primary">
                      R$ {itensEmissao
                        .reduce((a, i) => a + i.subtotal, 0)
                        .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Aba Outros ── */}
            <TabsContent value="outros" className="space-y-4 mt-4">
              <div>
                <Label className="text-xs mb-1.5 block">Modalidade de Frete</Label>
                <Select
                  value={configEmissao.modFrete}
                  onValueChange={(v) =>
                    setConfigEmissao((p) => ({ ...p, modFrete: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9">9 — Sem transporte</SelectItem>
                    <SelectItem value="0">0 — Por conta do emitente</SelectItem>
                    <SelectItem value="1">1 — Por conta do destinatário</SelectItem>
                    <SelectItem value="2">2 — Por conta de terceiros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Informações Complementares</Label>
                <textarea
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  value={configEmissao.infCpl}
                  onChange={(e) =>
                    setConfigEmissao((p) => ({ ...p, infCpl: e.target.value }))
                  }
                  placeholder="Ex: Nota emitida em homologação. Sem valor fiscal."
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Erro */}
          {erroEmissao && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive text-sm">Erro na transmissão</p>
                <p className="text-sm text-destructive/80 mt-0.5">{erroEmissao}</p>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-between items-center gap-3 pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {configEmissao.tipoAmbiente === 2 ? (
                <span className="text-warning font-semibold">⚠ Modo Homologação — sem valor fiscal</span>
              ) : (
                <span className="text-success font-semibold">✓ Modo Produção — válido na SEFAZ</span>
              )}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={emitindo}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEmitir}
                disabled={emitindo}
                className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground min-w-[160px]"
              >
                {emitindo ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Transmitindo…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Transmitir à SEFAZ
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
