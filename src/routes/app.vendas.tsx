import { toast } from "sonner";
import { createFileRoute, Link } from "@tanstack/react-router";
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
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useConfirm } from "@/contexts/ConfirmContext";
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

  const [selectedVenda, setSelectedVenda] = useState<any>(null);
  const [openSheet, setOpenSheet] = useState(false);
  const [vendaItens, setVendaItens] = useState<any[]>([]);
  const [loadingItens, setLoadingItens] = useState(false);
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [newTotalValue, setNewTotalValue] = useState("");

  const fetchVendas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vendas")
        .select("*, clientes(nome), vendedores(nome)")
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

  const getTone = (status: string) => {
    if (["Pago", "Faturado", "Entregue"].includes(status)) {
      return "border-emerald-300 bg-emerald-50 text-emerald-700";
    }
    if (["Cancelado", "Rejeitado"].includes(status)) {
      return "border-red-300 bg-red-50 text-red-700";
    }
    if (["Em orçamento", "Aguardando Pagamento"].includes(status)) {
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
                <Link to="/app/venda-nova">
                  <Plus className="mr-2 h-4 w-4" /> Criar pedido / orçamento
                </Link>
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
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
                      return (
                        <article
                          key={venda.id}
                          className="overflow-hidden rounded-md border bg-background"
                        >
                          <button
                            type="button"
                            className="w-full text-left"
                            onClick={() => setExpandedId(expanded ? null : venda.id)}
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
                              <span className="font-semibold">
                                {currency.format(Number(venda.valor_total || 0))}
                              </span>
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
                              {status !== "Faturado" && status !== "Entregue" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusChange(venda.id, "Faturado")}
                                >
                                  <Check className="mr-2 h-4 w-4" /> Gerar pedido
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenDetails(venda)}
                              >
                                <Eye className="mr-2 h-4 w-4" /> Visualizar
                              </Button>
                              <Button size="sm" variant="outline" asChild>
                                <Link to="/orcamento/$id" params={{ id: venda.id }}>
                                  <Printer className="mr-2 h-4 w-4" /> PDF
                                </Link>
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
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Aguardando Pagamento">Aguardando pagamento</SelectItem>
                    <SelectItem value="Em Separação">Em separação</SelectItem>
                    <SelectItem value="Faturado">Faturado</SelectItem>
                    <SelectItem value="Pago">Pago</SelectItem>
                    <SelectItem value="Entregue">Entregue</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
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
    </>
  );
}
