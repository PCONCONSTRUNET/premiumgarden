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
import { Search, CheckCircle, Store, Banknote } from "lucide-react";

export const Route = createFileRoute("/app/vendas-parceiros")({
  head: () => ({ meta: [{ title: "Vendas Parceiros — VIVAVERDE ERP" }] }),
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
        .or("status_aprovacao.neq.Pendente,status_aprovacao.is.null")
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
        .select("*, produto:produtos(nome, emoji)")
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

  const handlePagarComissao = async (id: string, vendedor_id: string, valorComissao: number) => {
    if (!confirm("Confirmar o pagamento desta comissão ao parceiro?")) return;
    try {
      const { error } = await supabase
        .from("vendas")
        .update({ status_pagamento_comissao: "Paga" })
        .eq("id", id);
      if (error) throw error;

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
      alert("Erro ao pagar comissão: " + err.message);
    }
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

  return (
    <>
      <PageHeader
        title="Vendas dos Parceiros"
        subtitle="Auditoria geral de todas as vendas e comissões dos vendedores."
      />

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
                    {v.status_aprovacao === "Aprovada" &&
                      v.status_pagamento_comissao !== "Paga" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-success border-success/30 hover:bg-success/10"
                          onClick={() =>
                            handlePagarComissao(v.id, v.vendedor_id, Number(v.valor_comissao))
                          }
                        >
                          <Banknote className="h-4 w-4 mr-1" /> Pagar
                        </Button>
                      )}
                    {v.status_pagamento_comissao === "Paga" && (
                      <span className="text-xs text-muted-foreground font-medium flex items-center justify-end gap-1">
                        <CheckCircle className="h-3 w-3 text-success" /> Quitado
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isSaleDetailsOpen} onOpenChange={setIsSaleDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
            <DialogDescription asChild>
              <div>
                Pedido #{selectedSaleForDetails?.id?.substring(0, 6).toUpperCase()} • Vendedor:{" "}
                {selectedSaleForDetails?.vendedor?.nome || "Desconhecido"}
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
                          <div className="text-2xl">{item.produto?.emoji || "📦"}</div>
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
                <div className="flex justify-between items-center p-4 bg-slate-100 rounded-lg">
                  <span className="font-semibold text-slate-700">Total do Pedido:</span>
                  <span className="text-xl font-bold font-display text-slate-900">
                    R$ {Number(selectedSaleForDetails?.valor_total || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaleDetailsOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
