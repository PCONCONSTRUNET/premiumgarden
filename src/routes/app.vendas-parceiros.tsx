import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Search, CheckCircle, Store, Banknote, Wallet, Clock, TrendingUp, Trash2 } from "lucide-react";

export const Route = createFileRoute("/app/vendas-parceiros")({
  head: () => ({ meta: [{ title: "Vendas Parceiros — PREMIUM GARDEN" }] }),
  component: VendasParceiros,
});

function VendasParceiros() {
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [filtroStatusVenda, setFiltroStatusVenda] = useState("Todos");
  const [filtroStatusComissao, setFiltroStatusComissao] = useState("Todos");

  const [isSaleDetailsOpen, setIsSaleDetailsOpen] = useState(false);
  const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<any>(null);
  const [saleItems, setSaleItems] = useState<any[]>([]);
  const [loadingSaleDetails, setLoadingSaleDetails] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    desc: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", desc: "", onConfirm: () => {} });

  const handleConfirmAction = () => {
    confirmModal.onConfirm();
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const fetchVendas = async () => {
    try {
      const { data, error } = await supabase
        .from("vendas")
        .select(
          `
          *,
          cliente:clientes(nome),
          vendedor:vendedores(nome)
        `,
        )
        .not("vendedor_id", "is", null)
        .order("created_at", { ascending: false });

      if (data) setVendas(data);
      if (error) console.error("Erro ao buscar vendas de parceiros:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendas();
  }, []);

  const openSaleDetails = async (sale: any) => {
    setSelectedSaleForDetails(sale);
    setIsSaleDetailsOpen(true);
    setLoadingSaleDetails(true);
    setSaleItems([]);
    try {
      const { data, error } = await supabase
        .from("vendas_itens")
        .select("*, produto:produtos(nome, imagem)")
        .eq("venda_id", sale.id);
      if (!error && data) {
        setSaleItems(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSaleDetails(false);
    }
  };

  const aprovarVenda = async (venda: any) => {
    setConfirmModal({
      isOpen: true,
      title: "Aprovar Venda",
      desc: "Confirmar aprovação da venda e registro da comissão?",
      onConfirm: async () => {
        try {
          const { data: vendedor } = await supabase
            .from("vendedores")
            .select("nome, tipo_comissao, valor_comissao")
            .eq("id", venda.vendedor_id)
            .single();

          const valorVenda = Number(venda.valor_total) || 0;
          let valorComissao = 0;

          if (vendedor) {
            if (vendedor.tipo_comissao === "porcentagem") {
              valorComissao = valorVenda * (Number(vendedor.valor_comissao || 0) / 100);
            } else {
              valorComissao = Number(vendedor.valor_comissao || 0);
            }
          }

          const { error } = await supabase
            .from("vendas")
            .update({
              status_aprovacao: "Aprovada",
              status: "Em aberto",
              valor_comissao: valorComissao,
              status_pagamento_comissao: "Pendente",
            })
            .eq("id", venda.id);

          if (error) throw error;

          const dataAtual = new Date().toISOString().split("T")[0];
          await supabase.from("contas_receber").insert([
            {
              venda_id: venda.id,
              cliente_id: venda.cliente_id,
              descricao: `Venda Parceiro #${venda.numero_venda || venda.id.substring(0, 8).toUpperCase()} - ${vendedor?.nome || ""}`,
              valor: valorVenda,
              vencimento: dataAtual,
              status: "Pendente",
              data_pagamento: null,
            },
          ]);

          // Comissão não é mais lançada como pendente no financeiro ao aprovar a venda.
          // O lançamento só ocorre quando o admin clica em Pagar Comissão.

          const { data: itens } = await supabase
            .from("vendas_itens")
            .select("produto_id, quantidade")
            .eq("venda_id", venda.id);
          if (itens) {
            for (const item of itens) {
              const { data: prod } = await supabase
                .from("produtos")
                .select("estoque")
                .eq("id", item.produto_id)
                .single();
              if (prod) {
                await supabase
                  .from("produtos")
                  .update({ estoque: prod.estoque - item.quantidade })
                  .eq("id", item.produto_id);
              }
            }
          }

          toast.success("Pedido aprovado com sucesso! Financeiro e Comissão gerados, e estoque atualizado.");
          fetchVendas();
        } catch (err: any) {
          toast.error("Erro ao aprovar pedido: " + err.message);
        }
      },
    });
  };

  const rejeitarVenda = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Rejeitar Venda",
      desc: "Tem certeza que deseja rejeitar esta venda? Ela será cancelada.",
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from("vendas")
            .update({ status_aprovacao: "Rejeitada", status: "Cancelado" })
            .eq("id", id);
          if (error) throw error;

          toast.info("Pedido rejeitado.");
          fetchVendas();
        } catch (err: any) {
          toast.error("Erro ao rejeitar pedido: " + err.message);
        }
      },
    });
  };

  const handlePagarComissao = async (id: string, vendedor_id: string, valorComissao: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Confirmar Pagamento",
      desc: "Você já transferiu esse valor para o parceiro? Confirmar baixa de pagamento da comissão.",
      onConfirm: async () => {
        try {
          const { data: venda } = await supabase
            .from("vendas")
            .select("numero_venda")
            .eq("id", id)
            .single();

          const { error } = await supabase
            .from("vendas")
            .update({ status_aprovacao: "Aprovada", status_pagamento_comissao: "Paga" })
            .eq("id", id);
          if (error) throw error;

          const searchDesc = `Comissão Parceiro #${venda?.numero_venda || id.substring(0, 8).toUpperCase()} - ${vendedor?.nome || ""}`;
          
          await supabase.from("contas_pagar").insert([
            {
              venda_id: id,
              descricao: searchDesc,
              valor: valorComissao,
              vencimento: new Date().toISOString().split("T")[0],
              status: "Pago",
              data_pagamento: new Date().toISOString().split("T")[0]
            }
          ]);

          const { data: vendedor } = await supabase
            .from("vendedores")
            .select("comissoes_pendentes")
            .eq("id", vendedor_id)
            .single();
          if (vendedor) {
            const novaComissaoPendente = Math.max(
              0,
              (vendedor.comissoes_pendentes || 0) - valorComissao,
            );
            await supabase
              .from("vendedores")
              .update({ comissoes_pendentes: novaComissaoPendente })
              .eq("id", vendedor_id);
          }

          fetchVendas();
        } catch (err: any) {
          toast.error("Erro ao pagar comissão: " + err.message);
        }
      },
    });
  };

  const excluirVenda = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: "Excluir Venda",
      desc: "Tem certeza que deseja excluir esta venda permanentemente? Esta ação não pode ser desfeita.",
      onConfirm: async () => {
        try {
          // Busca a venda para saber se o estoque já tinha sido descontado
          const { data: vendaParaExcluir } = await supabase
            .from("vendas")
            .select("status_aprovacao")
            .eq("id", id)
            .single();

          if (vendaParaExcluir?.status_aprovacao === "Aprovada") {
            const { data: itens } = await supabase
              .from("vendas_itens")
              .select("produto_id, quantidade")
              .eq("venda_id", id);
              
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

          await supabase.from("contas_receber").delete().eq("venda_id", id);
          await supabase.from("contas_pagar").delete().eq("venda_id", id);
          await supabase.from("vendas_itens").delete().eq("venda_id", id);
          const { error } = await supabase.from("vendas").delete().eq("id", id);
          if (error) throw error;
          toast.success("Venda excluída com sucesso.");
          fetchVendas();
        } catch (err: any) {
          toast.error("Erro ao excluir venda: " + err.message);
        }
      },
    });
  };

  const vendasFiltradas = vendas.filter((v) => {
    const matchBusca =
      v.id.toLowerCase().includes(filtro.toLowerCase()) ||
      (v.vendedor?.nome || "").toLowerCase().includes(filtro.toLowerCase()) ||
      (v.cliente?.nome || "").toLowerCase().includes(filtro.toLowerCase());

    const statusVendaStr = v.status || v.status_aprovacao || "Indefinido";
    const matchStatusVenda = filtroStatusVenda === "Todos" || statusVendaStr === filtroStatusVenda;

    const comissaoStatusStr = v.status_pagamento_comissao === "Paga" ? "Paga" : "Pendente";
    const matchStatusComissao =
      filtroStatusComissao === "Todos" || comissaoStatusStr === filtroStatusComissao;

    return matchBusca && matchStatusVenda && matchStatusComissao;
  });

  const totalVendido = vendas
    .filter(v => v.status === "Faturado" || v.status === "Pago" || v.status === "Entregue" || v.status_aprovacao === "Aprovada")
    .reduce((acc, v) => acc + (Number(v.valor_total) || 0), 0);

  const comissoesPagas = vendas
    .filter(v => v.status_pagamento_comissao === "Paga")
    .reduce((acc, v) => acc + (Number(v.valor_comissao) || 0), 0);

  const comissoesAPagar = vendas
    .filter(v => v.status_aprovacao === "Aprovada" && v.status_pagamento_comissao !== "Paga")
    .reduce((acc, v) => acc + (Number(v.valor_comissao) || 0), 0);

  const pedidosPendentes = vendas
    .filter(v => v.status_aprovacao === "Pendente").length;

  return (
    <>
      <PageHeader
        title="Vendas dos Parceiros"
        subtitle="Auditoria geral de todas as vendas e comissões dos vendedores."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-sm border-0 ring-1 ring-emerald-500/20 bg-emerald-50/50">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 mb-2 opacity-90 text-emerald-700">
              <TrendingUp className="h-5 w-5" />
              <h3 className="font-medium text-sm">Total Vendido</h3>
            </div>
            <p className="text-3xl font-extrabold font-display text-emerald-600">
              <span className="text-lg font-bold mr-1 opacity-80">R$</span>
              {totalVendido.toFixed(2).replace(".", ",")}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 ring-1 ring-blue-500/20 bg-blue-50/50">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 mb-2 opacity-90 text-blue-700">
              <CheckCircle className="h-5 w-5" />
              <h3 className="font-medium text-sm">Comissões Pagas</h3>
            </div>
            <p className="text-3xl font-extrabold font-display text-blue-600">
              <span className="text-lg font-bold mr-1 opacity-80">R$</span>
              {comissoesPagas.toFixed(2).replace(".", ",")}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 ring-1 ring-amber-500/20 bg-amber-50/50">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 mb-2 opacity-90 text-amber-700">
              <Wallet className="h-5 w-5" />
              <h3 className="font-medium text-sm">Comissões a Pagar</h3>
            </div>
            <p className="text-3xl font-extrabold font-display text-amber-600">
              <span className="text-lg font-bold mr-1 opacity-80">R$</span>
              {comissoesAPagar.toFixed(2).replace(".", ",")}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 ring-1 ring-slate-900/5">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
            <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 grid place-items-center mb-2">
              <Clock className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{pedidosPendentes}</p>
            <p className="text-xs text-muted-foreground font-medium">Pedidos Pendentes</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card mb-6">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por vendedor, cliente ou nº do pedido..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filtroStatusVenda} onValueChange={setFiltroStatusVenda}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status Venda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todas as Vendas</SelectItem>
              <SelectItem value="Faturado">Faturadas</SelectItem>
              <SelectItem value="Entregue">Entregues</SelectItem>
              <SelectItem value="Pendente">Pendentes</SelectItem>
              <SelectItem value="Aguardando Pagamento">Aguard. Pagamento</SelectItem>
              <SelectItem value="Cancelado">Canceladas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroStatusComissao} onValueChange={setFiltroStatusComissao}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status Comissão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todas as Comissões</SelectItem>
              <SelectItem value="Pendente">Pendentes</SelectItem>
              <SelectItem value="Paga">Pagas</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="shadow-card overflow-hidden">
        <CardHeader>
          <CardTitle>Histórico de Vendas (Parceiros)</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido Nº / Data</TableHead>
              <TableHead>Parceiro</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Status Venda</TableHead>
              <TableHead className="text-right">Valor Venda</TableHead>
              <TableHead className="text-right">Comissão</TableHead>
              <TableHead className="text-center">Status Pagto.</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Carregando histórico...
                </TableCell>
              </TableRow>
            ) : vendasFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhuma venda de parceiro encontrada.
                </TableCell>
              </TableRow>
            ) : (
              vendasFiltradas.map((v) => (
                <TableRow
                  key={v.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => openSaleDetails(v)}
                >
                  <TableCell>
                    <p className="font-mono text-xs font-medium">
                      #{v.numero_venda || v.id.substring(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(v.created_at).toLocaleDateString()}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-brand" />
                      <span className="font-semibold">{v.vendedor?.nome || "Desconhecido"}</span>
                    </div>
                  </TableCell>
                  <TableCell>{v.cliente?.nome || "Consumidor Final"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        v.status === "Faturado" || v.status === "Pago" || v.status === "Entregue"
                          ? "border-success text-success bg-success/10"
                          : v.status === "Pendente" || v.status === "Aguardando Pagamento"
                            ? "border-warning text-warning bg-warning/10"
                            : v.status === "Rejeitada" || v.status === "Cancelado"
                              ? "border-destructive text-destructive bg-destructive/10"
                              : "border-info text-info bg-info/10"
                      }
                    >
                      {v.status || v.status_aprovacao || "Indefinido"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    R$ {Number(v.valor_total).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-brand font-bold">
                    R$ {Number(v.valor_comissao || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    {v.status_pagamento_comissao === "Paga" ? (
                      <Badge
                        variant="outline"
                        className="border-success text-success bg-success/10"
                      >
                        Paga
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-warning text-warning bg-warning/10"
                      >
                        Pendente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {v.status_aprovacao === "Aprovada" &&
                        v.status_pagamento_comissao !== "Paga" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-success border-success/30 hover:bg-success/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePagarComissao(v.id, v.vendedor_id, Number(v.valor_comissao));
                            }}
                          >
                            <Banknote className="h-4 w-4 mr-1" /> Pagar
                          </Button>
                        )}
                      {v.status_pagamento_comissao === "Paga" && (
                        <span className="text-xs text-muted-foreground font-medium flex items-center justify-end gap-1 mr-2">
                          <CheckCircle className="h-3 w-3 text-success" /> Quitado
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => excluirVenda(e, v.id)}
                        title="Excluir Venda"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isSaleDetailsOpen} onOpenChange={setIsSaleDetailsOpen}>
        <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90dvh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
            <DialogDescription asChild>
              <div>
                <p className="font-bold text-slate-900 text-base">
                  Pedido #{selectedSaleForDetails?.id?.substring(0, 6).toUpperCase()} • Vendedor:{" "}
                  {selectedSaleForDetails?.vendedor?.nome || "Desconhecido"}
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  Enviado em:{" "}
                  {selectedSaleForDetails?.created_at
                    ? new Date(selectedSaleForDetails.created_at).toLocaleDateString("pt-BR")
                    : ""}{" "}
                  às{" "}
                  {selectedSaleForDetails?.created_at
                    ? new Date(selectedSaleForDetails.created_at).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </p>
                {selectedSaleForDetails?.cliente?.nome && (
                  <div className="mt-3 text-sm text-slate-700 bg-slate-100 p-3 rounded-md border border-slate-200">
                    <p className="font-semibold text-slate-900 flex items-center gap-2">
                      👤 {selectedSaleForDetails.cliente.nome}
                    </p>
                    {selectedSaleForDetails.cliente.cpf_cnpj && (
                      <p className="mt-1">📄 {selectedSaleForDetails.cliente.cpf_cnpj}</p>
                    )}
                    {selectedSaleForDetails.cliente.telefone && (
                      <p className="mt-1">📞 {selectedSaleForDetails.cliente.telefone}</p>
                    )}
                    {selectedSaleForDetails.cliente.endereco && (
                      <p className="mt-1">🏠 {selectedSaleForDetails.cliente.endereco}</p>
                    )}
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {loadingSaleDetails ? (
              <div className="text-center py-6 text-muted-foreground">Carregando itens...</div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-[300px] overflow-y-auto divide-y border rounded-lg">
                  {saleItems.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Nenhum item encontrado.
                    </div>
                  ) : (
                    saleItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-slate-50/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md bg-slate-200 text-xl">
                            {item.produto?.imagem ? (
                              <img src={item.produto.imagem} alt={item.produto?.nome} className="h-full w-full object-cover" />
                            ) : (
                              "📦"
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-800">
                              {item.produto?.nome || "Produto Excluído"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantidade}x R$ {Number(item.valor_unitario).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <p className="font-bold text-brand">
                          R$ {Number(item.subtotal).toFixed(2)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex flex-col gap-1 p-4 bg-slate-100 rounded-lg">
                  {Number(selectedSaleForDetails?.desconto_valor) > 0 && (
                    <div className="flex justify-between items-center text-red-600 text-sm">
                      <span className="font-medium">
                        Desconto {Number(selectedSaleForDetails?.desconto_percentual) > 0 ? `(${selectedSaleForDetails.desconto_percentual}%)` : ''}:
                      </span>
                      <span className="font-bold">
                        - R$ {Number(selectedSaleForDetails?.desconto_valor).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-1 pt-1 border-t border-slate-200/60">
                    <span className="font-semibold text-slate-700">Total do Pedido:</span>
                    <span className="text-xl font-bold font-display text-slate-900">
                      R$ {Number(selectedSaleForDetails?.valor_total || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          {selectedSaleForDetails?.status_aprovacao === "Pendente" ? (
            <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                onClick={() => {
                  setIsSaleDetailsOpen(false);
                  rejeitarVenda(selectedSaleForDetails.id);
                }}
              >
                Recusar Pedido
              </Button>
              <Button
                className="w-full sm:w-auto bg-success hover:bg-success/90 text-white"
                onClick={() => {
                  setIsSaleDetailsOpen(false);
                  aprovarVenda(selectedSaleForDetails);
                }}
              >
                Aprovar Pedido
              </Button>
            </DialogFooter>
          ) : (
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSaleDetailsOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmModal.isOpen}
        onOpenChange={(open) => setConfirmModal({ ...confirmModal, isOpen: open })}
      >
        <DialogContent className="sm:max-w-[425px] w-[95vw] rounded-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{confirmModal.title}</DialogTitle>
            <DialogDescription className="text-base text-slate-700 py-2">
              {confirmModal.desc}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
            >
              Cancelar
            </Button>
            <Button
              className="bg-success text-success-foreground hover:bg-success/90"
              onClick={handleConfirmAction}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
