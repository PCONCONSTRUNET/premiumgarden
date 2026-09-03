import { toast } from "sonner";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Eye,
  FileText,
  MessageCircle,
  PackageCheck,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
  UserRound,
  X,
  FileDown,
  Wallet,
  Banknote,
  FileSignature,
  Info,
  DollarSign,
  Receipt,
} from "lucide-react";
import premiumGardenLogo from "@/assets/premium-garden-logo.png";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useConfirm } from "@/contexts/ConfirmContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/app/vendas")({
  head: () => ({ meta: [{ title: "Pedidos - PREMIUM GARDEN" }] }),
  component: Pedidos,
});

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function Pedidos() {
  const confirm = useConfirm();
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [typeFilter, setTypeFilter] = useState("todos");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const [selectedVenda, setSelectedVenda] = useState<any>(null);
  const [openSheet, setOpenSheet] = useState(false);
  const [vendaItens, setVendaItens] = useState<any[]>([]);
  const [loadingItens, setLoadingItens] = useState(false);
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [newTotalValue, setNewTotalValue] = useState("");

  const [openFaturar, setOpenFaturar] = useState(false);
  const [faturarLoading, setFaturarLoading] = useState(false);
  const [valorJaFaturado, setValorJaFaturado] = useState(0);
  const [faturarValor, setFaturarValor] = useState<string>("");
  const [faturarNota, setFaturarNota] = useState("");
  const [faturarData, setFaturarData] = useState(new Date().toISOString().split("T")[0]);
  const [faturarInfo, setFaturarInfo] = useState("");

  const [openVisualizar, setOpenVisualizar] = useState(false);
  const [empresaDados, setEmpresaDados] = useState<any>(null);

  const [openPrintModal, setOpenPrintModal] = useState(false);

  const fetchVendas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vendas")
        .select("*, clientes(nome, telefone, endereco, numero, cidade, uf), vendedores(nome), contas_receber(valor)")
        .or("status_aprovacao.neq.Pendente,status_aprovacao.is.null")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVendas(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao buscar pedidos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendas();
    supabase.from("configuracoes").select("*").eq("id", 1).single().then(({ data }) => {
      if (data) setEmpresaDados(data);
    });
  }, []);

  const getOrderNumber = (venda: any) =>
    venda.numero
      ? String(venda.numero)
      : venda.numero_venda || venda.id?.substring(0, 8).toUpperCase();

  const getStatusLabel = (venda: any) => {
    if (venda.tipo === "DAV" && (!venda.status || venda.status === "Pendente")) {
      return "Em orçamento";
    }
    return venda.status || "Pendente";
  };

  const handleAprovarOrcamento = async (id: string) => {
    try {
      const { error } = await supabase
        .from("vendas")
        .update({ status: "Em aberto" })
        .eq("id", id);
      if (error) throw error;
      setVendas((current) =>
        current.map((v) => (v.id === id ? { ...v, status: "Em aberto" } : v))
      );
      toast.success("Orçamento aprovado e transformado em pedido!");
    } catch (err: any) {
      toast.error("Erro ao aprovar orçamento: " + err.message);
    }
  };

  const handleOpenFaturar = async (venda: any) => {
    setSelectedVenda(venda);
    setFaturarData(new Date().toISOString().split("T")[0]);
    setFaturarNota("");
    setFaturarInfo("");
    try {
      // Calculate already invoiced from contas_receber
      const { data } = await supabase.from("contas_receber").select("valor").eq("venda_id", venda.id);
      const totalFaturado = (data || []).reduce((acc, curr) => acc + Number(curr.valor), 0);
      setValorJaFaturado(totalFaturado);
      
      const totalRestante = Number(venda.valor_total || 0) - totalFaturado;
      setFaturarValor(Math.max(0, Math.round(totalRestante * 100) / 100));
      
      setOpenFaturar(true);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar dados de faturamento.");
    }
  };

  const handleFaturar = async () => {
    const valorNum = Number(faturarValor);
    if (!selectedVenda) return;
    if (valorNum <= 0) {
      toast.error("O valor a faturar deve ser maior que zero.");
      return;
    }
    
    setFaturarLoading(true);
    try {
      const valorTotal = Number(selectedVenda.valor_total || 0);
      // Recalculate from DB to avoid stale state
      const { data: contasExistentes } = await supabase
        .from("contas_receber")
        .select("valor")
        .eq("venda_id", selectedVenda.id);
      const totalJaFaturadoDB = (contasExistentes || []).reduce((acc, c) => acc + Number(c.valor), 0);
      const novoTotalFaturado = totalJaFaturadoDB + valorNum;
      
      // Só marca como Concluído quando o valor total foi coberto
      const isFullyInvoiced = novoTotalFaturado >= valorTotal - 0.01;
      const newStatus = isFullyInvoiced ? "Concluído" : "Parcialmente Faturado";
      
      const today = new Date().toISOString().split("T")[0];
      const { error: contasError } = await supabase.from("contas_receber").insert([{
        venda_id: selectedVenda.id,
        cliente_id: selectedVenda.cliente_id,
        descricao: `${faturarNota ? `NF: ${faturarNota}` : `Pedido #${getOrderNumber(selectedVenda)}`}${selectedVenda.clientes?.nome ? ` - ${selectedVenda.clientes.nome}` : ''}${faturarInfo ? ` | ${faturarInfo}` : ''}`,
        valor: valorNum,
        vencimento: faturarData,
        status: "Pago",
        data_pagamento: today,
      }]);
      if (contasError) throw contasError;

      const { error: vendaError } = await supabase.from("vendas").update({ status: newStatus }).eq("id", selectedVenda.id);
      if (vendaError) throw vendaError;

      setVendas((current) => current.map((v) => v.id === selectedVenda.id ? { ...v, status: newStatus } : v));
      setSelectedVenda((current: any) => current ? { ...current, status: newStatus } : current);
      toast.success("Faturamento registrado com sucesso!");
      setOpenFaturar(false);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao faturar: " + err.message);
    } finally {
      setFaturarLoading(false);
    }
  };

  const handleOpenVisualizar = async (venda: any) => {
    setSelectedVenda(venda);
    setLoadingItens(true);
    setOpenVisualizar(true);
    setValorJaFaturado(0);
    try {
      const { data, error } = await supabase
        .from("vendas_itens")
        .select("*, produtos(nome, codigo, imagem, ncm)")
        .eq("venda_id", venda.id);
      if (error) throw error;
      setVendaItens(data || []);

      const { data: contasData } = await supabase
        .from("contas_receber")
        .select("valor")
        .eq("venda_id", venda.id);
      const pago = (contasData || []).reduce((acc, c) => acc + Number(c.valor), 0);
      setValorJaFaturado(pago);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar os itens do pedido.");
    } finally {
      setLoadingItens(false);
    }
  };

  const handlePrint = () => {
    if (!selectedVenda) return;
    const cur = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
    const venda = selectedVenda;
    const itensHTML = vendaItens.map((item: any) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${item.produtos?.codigo || "-"}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center">
          ${item.produtos?.imagem ? `<img src="${item.produtos.imagem}" style="height:36px;width:36px;object-fit:cover;border-radius:4px" />` : ""}
        </td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-weight:500">${item.produtos?.nome || ""}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${item.quantidade} ${item.produtos?.unidade_medida || "un"}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${cur.format(Number(item.valor_unitario))}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:500">${cur.format(Number(item.subtotal))}</td>
      </tr>
    `).join("");
    const subtotalVal = (Number(venda.valor_total) || 0) + (Number(venda.desconto_valor) || 0);
    const desconto = Number(venda.desconto_valor) || 0;
    const total = Number(venda.valor_total) || 0;
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <title>Pedido #${getOrderNumber(venda)}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#111;padding:32px}
    h1{font-size:20px;font-weight:700}h2{font-size:15px;font-weight:600}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:16px;margin-bottom:20px}
    .section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#555;margin-bottom:8px}
    .client-box{background:#f9fafb;border:1px solid #e5e7eb;padding:12px;border-radius:4px;margin-bottom:20px;display:grid;grid-template-columns:1fr 1fr;gap:8px}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    thead{background:#f3f4f6}
    th{padding:7px 8px;text-align:left;font-size:11px;font-weight:700;border-bottom:2px solid #e5e7eb}
    .totals{display:flex;justify-content:flex-end}
    .totals-box{width:240px}
    .totals-row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #e5e7eb;font-size:12px}
    .totals-total{display:flex;justify-content:space-between;padding:8px 0;font-weight:700;font-size:15px}
    .footer{margin-top:32px;display:flex;justify-content:space-between;border-top:1px solid #e5e7eb;padding-top:16px;font-size:11px;color:#555}
    @media print{body{padding:16px}}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <img src="${window.location.origin}${premiumGardenLogo}" alt="Logo" style="height:48px;margin-bottom:8px;object-fit:contain" />
      <h1>${empresaDados?.razao_social || "PREMIUM GARDEN"}</h1>
      <div style="font-size:12px;color:#555;margin-top:4px">${empresaDados?.endereco || ""}</div>
      <div style="font-size:12px;color:#555">CNPJ: ${empresaDados?.cnpj || ""}</div>
    </div>
    <div style="text-align:right">
      <h2>Pedido #${getOrderNumber(venda)}</h2>
      <div style="font-size:12px;color:#555;margin-top:4px">Emitido em: ${new Date(venda.created_at).toLocaleDateString("pt-BR")}</div>
      <div style="font-size:12px;color:#555">Vendedor: ${venda.vendedores?.nome || "Admin"}</div>
    </div>
  </div>

  <div class="section-title">Dados do Cliente</div>
  <div class="client-box">
    <div><span style="color:#888">Nome:</span> <strong>${venda.clientes?.nome || ""}</strong></div>
    <div><span style="color:#888">Telefone:</span> ${venda.clientes?.telefone || "Não informado"}</div>
    <div style="grid-column:span 2"><span style="color:#888">Endereço:</span> ${venda.clientes?.endereco ? `${venda.clientes.endereco}, ${venda.clientes.numero || "S/N"} - ${venda.clientes.cidade || ""}/${venda.clientes.uf || ""}` : "Não informado"}</div>
  </div>

  <div class="section-title">Itens do Pedido</div>
  <table>
    <thead>
      <tr>
        <th>Cód.</th><th>Foto</th><th>Descrição</th><th style="text-align:right">Qtd</th><th style="text-align:right">Preço Un.</th><th style="text-align:right">Subtotal</th>
      </tr>
    </thead>
    <tbody>${itensHTML}</tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span style="color:#555">Subtotal:</span><span>${cur.format(subtotalVal)}</span></div>
      ${desconto > 0 ? `<div class="totals-row" style="color:#dc2626"><span>Desconto:</span><span>-${cur.format(desconto)}</span></div>` : ""}
      <div class="totals-total"><span>Total:</span><span style="color:#2563eb">${cur.format(total)}</span></div>
      ${valorJaFaturado > 0 ? `<div class="totals-row" style="color:#16a34a;font-weight:600"><span>Valor Pago:</span><span>${cur.format(valorJaFaturado)}</span></div>${total - valorJaFaturado > 0.01 ? `<div class="totals-row" style="color:#d97706;font-weight:600"><span>Restante:</span><span>${cur.format(total - valorJaFaturado)}</span></div>` : ""}` : ""}
    </div>
  </div>

  <div class="footer">
    <div><strong>Condição de Pagamento</strong><br/>${venda.condicao_pagamento || "À vista"}</div>
    <div><strong>Observações</strong><br/>${venda.informacoes || "Pedido gerado via sistema Premium Garden."}</div>
  </div>
</body>
</html>`;

    // Utiliza um iframe invisível para imprimir sem abrir nova aba
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      
      iframe.contentWindow?.focus();
      
      // Espera 500ms para a logo carregar antes de abrir o popup de impressão
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 500);
    }
  };

  const getTone = (status: string) => {
    if (["Concluído", "Pago", "Faturado", "Entregue"].includes(status)) {
      return "border-emerald-300 bg-emerald-50 text-emerald-700";
    }
    if (["Cancelado", "Rejeitado"].includes(status)) {
      return "border-red-300 bg-red-50 text-red-700";
    }
    if (["Parcialmente Faturado", "Em orçamento", "Aguardando Pagamento"].includes(status)) {
      return "border-amber-300 bg-amber-50 text-amber-700";
    }
    return "border-blue-300 bg-blue-50 text-blue-700";
  };

  const filteredVendas = useMemo(() => {
    const term = busca.trim().toLocaleLowerCase("pt-BR");
    return vendas.filter((venda) => {
      const status = getStatusLabel(venda);
      const searchText = [
        getOrderNumber(venda),
        venda.clientes?.nome,
        venda.vendedores?.nome,
        venda.tipo,
        status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      const matchesSearch = !term || searchText.includes(term);
      const matchesStatus = statusFilter === "todos" || status === statusFilter;
      const matchesType = typeFilter === "todos" || venda.tipo === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [busca, statusFilter, typeFilter, vendas]);

  const groupedVendas = useMemo(() => {
    return filteredVendas.reduce<Record<string, any[]>>((groups, venda) => {
      const key = new Date(venda.created_at).toLocaleDateString("pt-BR");
      if (!groups[key]) groups[key] = [];
      groups[key].push(venda);
      return groups;
    }, {});
  }, [filteredVendas]);

  const formatGroupLabel = (date: string) => {
    const [day, month, year] = date.split("/").map(Number);
    const itemDate = new Date(year, month - 1, day);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (itemDate.toDateString() === today.toDateString()) return "Hoje";
    if (itemDate.toDateString() === yesterday.toDateString()) return "Ontem";
    return itemDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleOpenDetails = async (venda: any) => {
    setSelectedVenda(venda);
    setOpenSheet(true);
    setIsEditingTotal(false);
    setLoadingItens(true);
    try {
      const { data, error } = await supabase
        .from("vendas_itens")
        .select("*, produtos(nome, imagem)")
        .eq("venda_id", venda.id);
      if (error) throw error;
      setVendaItens(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar os itens do pedido.");
    } finally {
      setLoadingItens(false);
    }
  };

  const handleShareWhatsApp = async (venda: any) => {
    try {
      const { data: itens } = await supabase
        .from("vendas_itens")
        .select("*, produtos(nome)")
        .eq("venda_id", venda.id);

      let message = `*${venda.tipo === "DAV" ? "ORÇAMENTO" : "PEDIDO"} - PREMIUM GARDEN*\n`;
      message += `Nº: ${getOrderNumber(venda)}\n`;
      message += `Cliente: ${venda.clientes?.nome || "Não informado"}\n`;
      message += `Data: ${new Date(venda.created_at).toLocaleDateString("pt-BR")}\n\n`;
      message += "*ITENS:*\n";

      itens?.forEach((item) => {
        message += `• ${item.quantidade}x ${item.produtos?.nome || "Produto"} - ${currency.format(Number(item.subtotal))}\n`;
      });

      message += `\n*TOTAL: ${currency.format(Number(venda.valor_total || 0))}*\n\n`;
      message += `${window.location.origin}/orcamento/${venda.id}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao preparar a mensagem do WhatsApp.");
    }
  };

  const handleDelete = async (venda: any) => {
    const shouldDelete = await confirm({
      description: `Tem certeza que deseja excluir o pedido #${getOrderNumber(venda)}?`,
      variant: "destructive",
    });
    if (!shouldDelete) return;

    try {
      if (["Faturado", "Pago", "Entregue"].includes(venda.status)) {
        const { data: itens } = await supabase
          .from("vendas_itens")
          .select("produto_id, quantidade")
          .eq("venda_id", venda.id);

        for (const item of itens || []) {
          const { data: product } = await supabase
            .from("produtos")
            .select("estoque")
            .eq("id", item.produto_id)
            .single();
          if (product) {
            await supabase
              .from("produtos")
              .update({ estoque: Number(product.estoque || 0) + Number(item.quantidade || 0) })
              .eq("id", item.produto_id);
          }
        }
      }

      // Excluir registros filhos primeiro para não dar erro de foreign key constraint
      await supabase.from("contas_receber").delete().eq("venda_id", venda.id);
      await supabase.from("historico_faturamento").delete().eq("venda_id", venda.id);
      await supabase.from("vendas_itens").delete().eq("venda_id", venda.id);

      const { error } = await supabase.from("vendas").delete().eq("id", venda.id);
      if (error) throw error;
      setVendas((current) => current.filter((item) => item.id !== venda.id));
      toast.success("Pedido excluído.");
    } catch (err: any) {
      toast.error("Erro ao excluir: " + err.message);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("vendas").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
      setSelectedVenda((current: any) =>
        current?.id === id ? { ...current, status: newStatus } : current,
      );
      setVendas((current) =>
        current.map((venda) => (venda.id === id ? { ...venda, status: newStatus } : venda)),
      );
      toast.success("Status do pedido atualizado.");
    } catch (err: any) {
      toast.error("Erro ao atualizar status: " + err.message);
    }
  };

  const handleEditTotal = () => {
    setNewTotalValue(String(selectedVenda?.valor_total || 0));
    setIsEditingTotal(true);
  };

  const handleSaveTotal = async () => {
    const value = Number(newTotalValue);
    if (!Number.isFinite(value) || value < 0) {
      toast.info("Informe um valor válido.");
      return;
    }

    try {
      const { error } = await supabase
        .from("vendas")
        .update({ valor_total: value })
        .eq("id", selectedVenda.id);
      if (error) throw error;
      await supabase
        .from("contas_receber")
        .update({ valor: value })
        .eq("venda_id", selectedVenda.id);
      setSelectedVenda((current: any) => ({ ...current, valor_total: value }));
      setVendas((current) =>
        current.map((venda) =>
          venda.id === selectedVenda.id ? { ...venda, valor_total: value } : venda,
        ),
      );
      setIsEditingTotal(false);
    } catch (err: any) {
      toast.error("Erro ao atualizar valor: " + err.message);
    }
  };

  return (
    <>
      <section className="overflow-hidden border-2 border-border bg-card shadow-sm">
        <div className="flex h-16 items-center gap-2 border-b-2 border-foreground/80 px-5">
          <FileText className="h-5 w-5" />
          <h1 className="text-sm font-bold uppercase tracking-wide">Pedidos</h1>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between print:hidden">
            <div className="flex flex-wrap gap-2">
              <Button className="bg-primary text-primary-foreground" asChild>
                <Link to="/app/venda-nova" search={{ id: undefined }}>
                  <Plus className="mr-2 h-4 w-4" /> Criar pedido / orçamento
                </Link>
              </Button>
              <Button variant="outline" onClick={() => setOpenPrintModal(true)}>
                <Printer className="mr-2 h-4 w-4" /> Imprimir pedidos
              </Button>
            </div>

            <div className="w-full space-y-2 xl:w-[360px]">
              <div className="relative">
                <Input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Pedido, cliente ou vendedor"
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              <p className="text-right text-[11px] text-muted-foreground">
                Pesquise por número, cliente, vendedor ou status.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-y bg-muted/20 px-3 py-3 print:hidden">
            <span className="text-xs text-muted-foreground">Mostrando</span>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 w-[170px] border-0 bg-transparent px-2 text-xs font-semibold text-primary shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Pedidos e orçamentos</SelectItem>
                <SelectItem value="VENDA">Somente pedidos</SelectItem>
                <SelectItem value="DAV">Somente orçamentos</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">com</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-[190px] border-0 bg-transparent px-2 text-xs font-semibold text-primary shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Qualquer status</SelectItem>
                <SelectItem value="Em orçamento">Em orçamento</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Aguardando Pagamento">Aguardando pagamento</SelectItem>
                <SelectItem value="Em Separação">Em separação</SelectItem>
                <SelectItem value="Faturado">Faturado</SelectItem>
                <SelectItem value="Pago">Pago</SelectItem>
                <SelectItem value="Entregue">Entregue</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <span className="ml-auto text-xs text-muted-foreground">
              {filteredVendas.length} resultado{filteredVendas.length === 1 ? "" : "s"}
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Carregando pedidos...
            </div>
          ) : filteredVendas.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <PackageCheck className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Nenhum pedido encontrado.</p>
              <p className="text-xs text-muted-foreground">
                Ajuste os filtros ou crie um novo pedido.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedVendas).map(([date, orders]) => (
                <section key={date} className="space-y-3">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-base font-medium capitalize text-muted-foreground">
                      {formatGroupLabel(date)}
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {orders.map((venda) => {
                      const status = getStatusLabel(venda);
                      const expanded = expandedId === venda.id;
                      const valorTotal = Number(venda.valor_total || 0);
                      const valorPago = (venda.contas_receber || []).reduce((acc: number, c: any) => acc + Number(c.valor), 0);
                      const valorRestante = valorTotal - valorPago;

                      return (
                        <article
                          key={venda.id}
                          className="overflow-hidden rounded-md border bg-background"
                        >
                            <button
                              type="button"
                              className="w-full text-left"
                              onClick={() => {
                                setExpandedId(expanded ? null : venda.id);
                              }}
                            >
                            <div className="flex items-center justify-between gap-4 bg-muted/40 px-4 py-3">
                              <div className="min-w-0">
                                <p className="text-sm">
                                  <span className="font-semibold text-primary">
                                    #{getOrderNumber(venda)}
                                  </span>{" "}
                                  <span className="text-muted-foreground">emitido por</span>{" "}
                                  <span className="font-medium">
                                    {venda.vendedores?.nome || "PREMIUM GARDEN"}
                                  </span>
                                </p>
                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                  {venda.clientes?.nome || "Cliente não informado"}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-3">
                                <Badge variant="outline" className={getTone(status)}>
                                  {status}
                                </Badge>
                                <ChevronDown
                                  className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between px-4 py-4">
                              <div className="flex items-center gap-3">
                                <span className="font-semibold">
                                  {currency.format(valorTotal)}
                                </span>
                                {status === "Parcialmente Faturado" && (
                                  <span className="text-xs">
                                    <span className="text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">Pago: {currency.format(valorPago)}</span>
                                    <span className="text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full ml-2">Falta: {currency.format(valorRestante)}</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(venda.created_at).toLocaleString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </button>

                          {expanded && (
                            <div className="flex flex-wrap gap-2 border-t-2 border-foreground/80 bg-card px-4 py-3 print:hidden">
                              {status === "Em orçamento" && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-0"
                                    onClick={() => handleAprovarOrcamento(venda.id)}
                                  >
                                    <Check className="mr-2 h-4 w-4" /> Aprovar orçamento (Gerar Pedido)
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => navigate({ to: "/app/venda-nova", search: { id: venda.id } as any })}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" /> Editar orçamento
                                  </Button>
                                </>
                              )}

                              {status !== "Em orçamento" && status !== "Concluído" && status !== "Cancelado" && status !== "Entregue" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenFaturar(venda)}
                                >
                                  <Check className="mr-2 h-4 w-4" />
                                  {status === "Parcialmente Faturado" ? "Faturar restante" : "Faturar pedido"}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenVisualizar(venda)}
                              >
                                <FileText className="mr-2 h-4 w-4" /> Visualizar / PDF
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenDetails(venda)}
                              >
                                <Eye className="mr-2 h-4 w-4" /> Detalhes
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleShareWhatsApp(venda)}
                              >
                                <MessageCircle className="mr-2 h-4 w-4 text-emerald-600" /> WhatsApp
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="ml-auto text-destructive hover:text-destructive"
                                onClick={() => handleDelete(venda)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                              </Button>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>

      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Pedido #{selectedVenda ? getOrderNumber(selectedVenda) : ""}</SheetTitle>
            <SheetDescription>Dados, itens e situação atual do pedido.</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div className="grid gap-4 rounded-md border bg-muted/20 p-4 text-sm sm:grid-cols-2">
              <div>
                <span className="mb-1 flex items-center gap-1 text-xs uppercase text-muted-foreground">
                  <UserRound className="h-3.5 w-3.5" /> Cliente
                </span>
                <span className="font-medium">
                  {selectedVenda?.clientes?.nome || "Não informado"}
                </span>
              </div>
              <div>
                <span className="mb-1 block text-xs uppercase text-muted-foreground">Data</span>
                <span className="font-medium">
                  {selectedVenda
                    ? new Date(selectedVenda.created_at).toLocaleDateString("pt-BR")
                    : "-"}
                </span>
              </div>
              <div>
                <span className="mb-1 block text-xs uppercase text-muted-foreground">Status</span>
                <Select
                  value={selectedVenda?.status || "Pendente"}
                  onValueChange={(value) => handleStatusChange(selectedVenda.id, value)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Em orçamento">Em orçamento</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Em aberto">Em aberto</SelectItem>
                    <SelectItem value="Aguardando Pagamento">Aguardando pagamento</SelectItem>
                    <SelectItem value="Em Separação">Em separação</SelectItem>
                    <SelectItem value="Faturado">Faturado</SelectItem>
                    <SelectItem value="Parcialmente Faturado">Parcialmente Faturado</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                    <SelectItem value="Pago">Pago</SelectItem>
                    <SelectItem value="Entregue">Entregue</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                    <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <span className="mb-1 block text-xs uppercase text-muted-foreground">Total</span>
                {isEditingTotal ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newTotalValue}
                      onChange={(event) => setNewTotalValue(event.target.value)}
                      className="h-9"
                    />
                    <Button size="icon" variant="ghost" onClick={handleSaveTotal}>
                      <Check className="h-4 w-4 text-emerald-600" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setIsEditingTotal(false)}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <strong>{currency.format(Number(selectedVenda?.valor_total || 0))}</strong>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={handleEditTotal}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between border-b pb-2">
                <h3 className="font-semibold">Produtos</h3>
                <Badge variant="outline">{vendaItens.length} itens</Badge>
              </div>
              {loadingItens ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Carregando itens...
                </p>
              ) : vendaItens.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum item encontrado.
                </p>
              ) : (
                <div className="space-y-2">
                  {vendaItens.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md bg-muted">
                          {item.produtos?.imagem ? (
                            <img
                              src={item.produtos.imagem}
                              alt={item.produtos.nome}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <PackageCheck className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {item.produtos?.nome || "Produto"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantidade} x {currency.format(Number(item.valor_unitario || 0))}
                          </p>
                        </div>
                      </div>
                      <strong className="text-sm">
                        {currency.format(Number(item.subtotal || 0))}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 border-t pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleShareWhatsApp(selectedVenda)}
              >
                <MessageCircle className="mr-2 h-4 w-4 text-emerald-600" /> WhatsApp
              </Button>
              <Button className="flex-1" asChild>
                <Link to="/orcamento/$id" params={{ id: selectedVenda?.id }}>
                  <Printer className="mr-2 h-4 w-4" /> Abrir PDF
                </Link>
              </Button>
            </div>
          </div>
          </SheetContent>
        </Sheet>

      {/* Faturar Modal */}
      <Dialog open={openFaturar} onOpenChange={setOpenFaturar}>
        <DialogContent className="sm:max-w-[450px] overflow-hidden p-0 rounded-2xl">
          <div className="bg-gradient-to-b from-brand/10 to-transparent p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Receipt className="w-5 h-5 text-brand" />
                Faturar Pedido
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1">
                Lance um faturamento parcial ou total para este pedido.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {selectedVenda && (
            <div className="px-6 space-y-6 pb-2">
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl shadow-sm">
                <div>
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mb-1">Pagamento</span>
                  <span className="font-semibold text-sm text-slate-700">{selectedVenda.condicao_pagamento || "Não informado"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mb-1">Já Faturado</span>
                  <span className="font-semibold text-sm text-amber-600">{currency.format(valorJaFaturado)}</span>
                </div>
                <div className="col-span-2 pt-2 mt-2 border-t border-slate-200/60">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mb-1">Total do Pedido</span>
                  <span className="font-bold text-brand text-lg">{currency.format(selectedVenda.valor_total)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" /> Valor a faturar agora
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 font-medium">R$</span>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      className="pl-9 h-11 text-base font-semibold focus-visible:ring-emerald-500 border-slate-300 shadow-sm"
                      value={faturarValor} 
                      onChange={(e) => setFaturarValor(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                      <FileSignature className="w-3.5 h-3.5" /> Nota Fiscal
                    </Label>
                    <Input 
                      value={faturarNota} 
                      onChange={(e) => setFaturarNota(e.target.value)} 
                      placeholder="Ex: NF 12345"
                      className="h-10 text-sm shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" /> Vencimento
                    </Label>
                    <Input 
                      type="date"
                      value={faturarData} 
                      onChange={(e) => setFaturarData(e.target.value)}
                      className="h-10 text-sm shadow-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" /> Informações Adicionais
                  </Label>
                  <Input 
                    value={faturarInfo} 
                    onChange={(e) => setFaturarInfo(e.target.value)}
                    className="h-10 text-sm shadow-sm" 
                  />
                </div>
              </div>
            </div>
          )}
          <div className="p-6 pt-4 bg-slate-50 border-t flex justify-end gap-3 rounded-b-2xl">
            <Button variant="outline" className="h-10 px-4" onClick={() => setOpenFaturar(false)}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-6 shadow-md transition-all active:scale-95" onClick={handleFaturar} disabled={faturarLoading}>
              <Check className="w-4 h-4 mr-2" />
              {faturarLoading ? "Faturando..." : "Confirmar Faturamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Visualizar / Imprimir Modal */}
      <Dialog open={openVisualizar} onOpenChange={setOpenVisualizar}>
        <DialogContent className="max-w-[800px] p-0 overflow-hidden bg-white text-black print:shadow-none print:border-none print:max-w-full">
          {selectedVenda && (
            <div className="max-h-[85vh] overflow-y-auto print:overflow-visible print:max-h-none print:h-auto" id="print-area">
              <div className="p-8 space-y-6 print:p-0">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-gray-300 pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <img src="/logo.png" alt="Logo" className="h-12 w-12 object-contain hidden" />
                      <h2 className="text-2xl font-bold">{empresaDados?.razao_social || "PREMIUM GARDEN"}</h2>
                    </div>
                    <div className="text-sm text-gray-500 mt-2 max-w-sm">
                      {empresaDados?.endereco || "Endereço não configurado"}<br/>
                      CNPJ: {empresaDados?.cnpj || "00.000.000/0000-00"}
                    </div>
                  </div>
                  <div className="text-right">
                    <h3 className="text-xl font-semibold text-gray-800">Pedido #{getOrderNumber(selectedVenda)}</h3>
                    <p className="text-sm font-medium text-gray-500">
                      Emitido em: {new Date(selectedVenda.created_at).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-sm font-medium text-gray-500">
                      Vendedor: {selectedVenda.vendedores?.nome || "Admin"}
                    </p>
                  </div>
                </div>

                {/* Cliente Info */}
                <div>
                  <h4 className="font-semibold text-gray-700 uppercase text-xs mb-2 tracking-wider">Dados do Cliente</h4>
                  <div className="bg-gray-50 p-4 rounded border border-gray-100 text-sm grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-500">Nome:</span> <span className="font-medium">{selectedVenda.clientes?.nome}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Telefone:</span> <span>{selectedVenda.clientes?.telefone || "Não informado"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Endereço:</span> <span>{selectedVenda.clientes?.endereco ? `${selectedVenda.clientes?.endereco}, ${selectedVenda.clientes?.numero || 'S/N'} - ${selectedVenda.clientes?.cidade || ''}/${selectedVenda.clientes?.uf || ''}` : "Não informado"}</span>
                    </div>
                  </div>
                </div>

                {/* Itens */}
                <div>
                  <h4 className="font-semibold text-gray-700 uppercase text-xs mb-2 tracking-wider">Itens do Pedido</h4>
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="py-2 px-3 border-b font-semibold">Cód.</th>
                        <th className="py-2 px-3 border-b font-semibold w-16">Foto</th>
                        <th className="py-2 px-3 border-b font-semibold">Descrição</th>
                        <th className="py-2 px-3 border-b font-semibold text-right">Qtd</th>
                        <th className="py-2 px-3 border-b font-semibold text-right">Preço Un.</th>
                        <th className="py-2 px-3 border-b font-semibold text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingItens ? (
                        <tr><td colSpan={5} className="py-4 text-center text-gray-500">Carregando itens...</td></tr>
                      ) : vendaItens.length === 0 ? (
                        <tr><td colSpan={5} className="py-4 text-center text-gray-500">Nenhum item.</td></tr>
                      ) : (
                        vendaItens.map((item) => (
                          <tr key={item.id} className="border-b border-gray-50">
                            <td className="py-2 px-3 text-gray-500">{item.produtos?.codigo || "-"}</td>
                            <td className="py-2 px-3 text-center">
                              {item.produtos?.imagem ? (
                                <img src={item.produtos.imagem} alt="Foto" className="h-10 w-10 object-cover rounded-md bg-white border inline-block" />
                              ) : (
                                <div className="h-10 w-10 bg-slate-100 rounded-md inline-block border"></div>
                              )}
                            </td>
                            <td className="py-2 px-3 font-medium">{item.produtos?.nome}</td>
                            <td className="py-2 px-3 text-right">{item.quantidade} {item.produtos?.unidade_medida || "un"}</td>
                            <td className="py-2 px-3 text-right">{currency.format(Number(item.valor_unitario))}</td>
                            <td className="py-2 px-3 text-right font-medium">{currency.format(Number(item.subtotal))}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totais */}
                <div className="flex justify-end pt-4">
                  <div className="w-64 space-y-2 text-sm">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-gray-500">Subtotal:</span>
                      <span>{currency.format((Number(selectedVenda.valor_total) || 0) + (Number(selectedVenda.desconto_valor) || 0))}</span>
                    </div>
                    {Number(selectedVenda.desconto_valor) > 0 && (
                      <div className="flex justify-between border-b pb-1 text-red-600">
                        <span>Desconto:</span>
                        <span>-{currency.format(Number(selectedVenda.desconto_valor))}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold pt-1">
                      <span>Total:</span>
                      <span className="text-blue-600">{currency.format(Number(selectedVenda.valor_total))}</span>
                    </div>
                    {valorJaFaturado > 0 && (
                      <div className="mt-2 pt-2 border-t space-y-1">
                        <div className="flex justify-between text-sm font-semibold text-emerald-600">
                          <span>Valor Pago:</span>
                          <span>{currency.format(valorJaFaturado)}</span>
                        </div>
                        {Number(selectedVenda.valor_total) - valorJaFaturado > 0.01 && (
                          <div className="flex justify-between text-sm font-semibold text-amber-600">
                            <span>Restante / Pendente:</span>
                            <span>{currency.format(Number(selectedVenda.valor_total) - valorJaFaturado)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Rodapé Adicional */}
                <div className="pt-8 border-t border-gray-200 text-xs text-gray-500 grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-semibold text-gray-700 block">Condição de Pagamento</span>
                    {selectedVenda.condicao_pagamento || "Não informada"}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700 block">Observações</span>
                    Pedido gerado via sistema Premium Garden.
                  </div>
                </div>
              </div>

              {/* Botões - Não aparecem na impressão */}
              <div className="bg-gray-50 p-4 border-t flex justify-end gap-3 print:hidden">
                <Button variant="outline" onClick={() => setOpenVisualizar(false)}>Fechar</Button>
                <Button 
                  onClick={handlePrint}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Printer className="mr-2 h-4 w-4" /> Imprimir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Print Modal */}
      <Dialog open={openPrintModal} onOpenChange={setOpenPrintModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Imprimir Pedido</DialogTitle>
            <DialogDescription>Selecione qual pedido da lista você deseja imprimir.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-2 mt-4 px-1">
            {filteredVendas.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                Nenhum pedido encontrado nos filtros atuais.
              </p>
            ) : (
              filteredVendas.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30">
                  <div>
                    <p className="font-semibold text-sm text-primary">
                      #{getOrderNumber(v)} - {v.clientes?.nome || "Cliente Padrão"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(v.created_at).toLocaleDateString()} • {currency.format(Number(v.valor_total || 0))}
                    </p>
                  </div>
                  <Button size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90" asChild>
                    <a href={`/orcamento/${v.id}`} target="_blank" rel="noopener noreferrer">
                      <Printer className="w-4 h-4 mr-2" /> Imprimir
                    </a>
                  </Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenPrintModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
