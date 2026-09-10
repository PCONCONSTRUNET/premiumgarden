import { downloadVendaPdf, shareVendaWhatsApp } from "@/lib/orcamento-pdf";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabaseParceiro as supabase } from "@/lib/supabase";
import { formatNumero } from "@/lib/utils";
import { toast } from "sonner";
import {
  FileText,
  Search,
  ShoppingCart,
  CalendarDays,
  Clock,
  Eye,
  X,
  Trash2,
  Ban,
  Edit2,
  Plus,
  Minus,
  Save,
  PlusCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/parceiro/vendas")({
  head: () => ({ meta: [{ title: "Vendas - Parceiro" }] }),
  component: VendasParceiro,
});

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function VendasParceiro() {
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [vendedorData, setVendedorData] = useState<any>(null);
  
  // Sheet state
  const [selectedVenda, setSelectedVenda] = useState<any>(null);
  const [openSheet, setOpenSheet] = useState(false);
  const [vendaItens, setVendaItens] = useState<any[]>([]);
  const [loadingItens, setLoadingItens] = useState(false);
  const [cancelingOrder, setCancelingOrder] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(false);

  // Estados de Edição de Itens
  const [isEditingItems, setIsEditingItems] = useState(false);
  const [editItemsList, setEditItemsList] = useState<any[]>([]);
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);
  const [savingItems, setSavingItems] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    const fetchVendas = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Pegar vendedor
        const { data: vData } = await supabase
          .from("vendedores")
          .select("id, tipo_comissao, valor_comissao")
          .eq("user_id", session.user.id)
          .single();

        if (vData) {
          setVendedorData(vData);
          const { data, error } = await supabase
            .from("vendas")
            .select("*, clientes(nome, cpf_cnpj, telefone, endereco, numero, bairro, cidade, uf, cep)")
            .eq("vendedor_id", vData.id)
            .in("tipo", ["VENDA", "PDV", "DAV"])
            .order("created_at", { ascending: false });

          if (error) throw error;
          setVendas(data || []);
        }
      } catch (err: any) {
        console.error(err);
        toast.error("Erro ao carregar vendas.");
      } finally {
        setLoading(false);
      }
    };

    fetchVendas();
  }, []);

  const openDetails = async (venda: any) => {
    setSelectedVenda(venda);
    setOpenSheet(true);
    setLoadingItens(true);
    setIsEditingItems(false);
    setDeletedItemIds([]);
    setShowAddProduct(false);

    try {
      const { data, error } = await supabase
        .from("vendas_itens")
        .select("*, produtos(nome, codigo, imagem, emoji, valor, estoque)")
        .eq("venda_id", venda.id);

      if (error) throw error;
      setVendaItens(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar itens da venda.");
    } finally {
      setLoadingItens(false);
    }
  };

  const iniciarEdicaoItens = () => {
    setEditItemsList(
      vendaItens.map((item) => ({
        ...item,
        quantidade: Number(item.quantidade) || 1,
        valor_unitario: Number(item.valor_unitario) || 0,
        subtotal: (Number(item.quantidade) || 1) * (Number(item.valor_unitario) || 0),
      }))
    );
    setDeletedItemIds([]);
    setIsEditingItems(true);
    setShowAddProduct(false);
  };

  const cancelarEdicaoItens = () => {
    setIsEditingItems(false);
    setEditItemsList([]);
    setDeletedItemIds([]);
    setShowAddProduct(false);
  };

  const handleUpdateQuantidade = (index: number, novaQtd: number) => {
    if (novaQtd <= 0) return;
    setEditItemsList((prev) => {
      const copy = [...prev];
      const item = copy[index];
      const qtd = Number(novaQtd);
      copy[index] = {
        ...item,
        quantidade: qtd,
        subtotal: qtd * Number(item.valor_unitario || 0),
      };
      return copy;
    });
  };

  const handleRemoverItem = (index: number) => {
    if (editItemsList.length <= 1) {
      toast.error("O pedido deve conter pelo menos 1 produto. Se deseja cancelar o pedido, utilize a opção Cancelar Orçamento.");
      return;
    }
    const itemToRemove = editItemsList[index];
    if (!itemToRemove.isNew && itemToRemove.id) {
      setDeletedItemIds((prev) => [...prev, itemToRemove.id]);
    }
    setEditItemsList((prev) => prev.filter((_, i) => i !== index));
    toast.info("Produto removido do pedido.");
  };

  const abrirBuscarProdutos = async () => {
    setShowAddProduct(true);
    if (availableProducts.length === 0) {
      setLoadingProducts(true);
      try {
        const { data, error } = await supabase
          .from("produtos")
          .select("id, nome, valor, imagem, codigo, emoji, estoque")
          .eq("status", "Ativo")
          .order("nome");
        if (!error && data) {
          setAvailableProducts(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProducts(false);
      }
    }
  };

  const handleAdicionarProduto = (prod: any) => {
    const unitPrice = Number(prod.valor) || 0;
    const newItem = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      isNew: true,
      venda_id: selectedVenda.id,
      produto_id: prod.id,
      quantidade: 1,
      valor_unitario: unitPrice,
      subtotal: unitPrice,
      produtos: {
        nome: prod.nome,
        imagem: prod.imagem,
        codigo: prod.codigo,
        emoji: prod.emoji,
      },
    };
    setEditItemsList((prev) => [...prev, newItem]);
    setShowAddProduct(false);
    setProductSearch("");
    toast.success(`${prod.nome} adicionado ao pedido!`);
  };

  // Cálculos dinâmicos em modo de edição
  const editSubtotal = editItemsList.reduce(
    (acc, item) => acc + (Number(item.quantidade) * Number(item.valor_unitario)),
    0
  );
  const descontoPerc = Number(selectedVenda?.desconto_percentual) || 0;
  const descontoOrig = Number(selectedVenda?.desconto_valor) || 0;
  const editDesconto = descontoPerc > 0
    ? (editSubtotal * descontoPerc) / 100
    : Math.min(editSubtotal, descontoOrig);
  const editTotal = Math.max(0, editSubtotal - editDesconto);

  const handleSalvarEdicaoItens = async () => {
    if (!selectedVenda) return;
    if (editItemsList.length === 0) {
      toast.error("O pedido precisa conter pelo menos 1 item.");
      return;
    }

    setSavingItems(true);
    try {
      // 1. Deletar itens excluídos
      if (deletedItemIds.length > 0) {
        await supabase.from("vendas_itens").delete().in("id", deletedItemIds);
        try {
          await supabase.from("dav_items").delete().in("id", deletedItemIds);
        } catch {}
      }

      // 2. Atualizar itens existentes
      for (const item of editItemsList.filter((i) => !i.isNew)) {
        const itemSubtotal = Number(item.quantidade) * Number(item.valor_unitario);
        await supabase
          .from("vendas_itens")
          .update({
            quantidade: Number(item.quantidade),
            subtotal: itemSubtotal,
            valor_unitario: Number(item.valor_unitario),
          })
          .eq("id", item.id);
      }

      // 3. Inserir novos itens adicionados
      const novos = editItemsList
        .filter((i) => i.isNew)
        .map((item) => ({
          venda_id: selectedVenda.id,
          produto_id: item.produto_id,
          quantidade: Number(item.quantidade),
          valor_unitario: Number(item.valor_unitario),
          subtotal: Number(item.quantidade) * Number(item.valor_unitario),
        }));

      if (novos.length > 0) {
        const { error: insErr } = await supabase.from("vendas_itens").insert(novos);
        if (insErr) throw insErr;
      }

      // 4. Calcular totais e comissão
      const finalSubtotal = editSubtotal;
      const finalDesconto = editDesconto;
      const finalTotal = editTotal;

      let finalComissao = Number(selectedVenda.valor_comissao) || 0;
      if (vendedorData) {
        finalComissao =
          vendedorData.tipo_comissao === "fixo"
            ? Number(vendedorData.valor_comissao) || 0
            : (finalTotal * (Number(vendedorData.valor_comissao) || 0)) / 100;
      }

      // 5. Atualizar tabela de vendas
      const { error: vErr } = await supabase
        .from("vendas")
        .update({
          valor_total: finalTotal,
          subtotal: finalSubtotal,
          desconto_valor: finalDesconto,
          valor_comissao: finalComissao,
        })
        .eq("id", selectedVenda.id);

      if (vErr) throw vErr;

      // Sincronizar davs se existir
      try {
        await supabase
          .from("davs")
          .update({
            valor_total: finalTotal,
            subtotal: finalSubtotal,
            desconto_valor: finalDesconto,
          })
          .eq("id", selectedVenda.id);
      } catch {}

      // Sincronizar contas_receber se houver pendente
      try {
        await supabase
          .from("contas_receber")
          .update({ valor: finalTotal })
          .eq("venda_id", selectedVenda.id)
          .neq("status", "Recebido");
      } catch {}

      // 6. Recarregar itens atualizados
      const { data: refreshedItems } = await supabase
        .from("vendas_itens")
        .select("*, produtos(nome, codigo, imagem, emoji, valor, estoque)")
        .eq("venda_id", selectedVenda.id);

      setVendaItens(refreshedItems || []);

      // 7. Atualizar a venda selecionada no Sheet
      setSelectedVenda((prev: any) => ({
        ...prev,
        valor_total: finalTotal,
        subtotal: finalSubtotal,
        desconto_valor: finalDesconto,
        valor_comissao: finalComissao,
      }));

      // 8. Atualizar lista global de vendas
      setVendas((prev) =>
        prev.map((v) =>
          v.id === selectedVenda.id
            ? {
                ...v,
                valor_total: finalTotal,
                total: finalTotal,
                subtotal: finalSubtotal,
                desconto_valor: finalDesconto,
                valor_comissao: finalComissao,
              }
            : v
        )
      );

      setIsEditingItems(false);
      setDeletedItemIds([]);
      toast.success("Pedido atualizado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar alterações do pedido:", err);
      toast.error("Erro ao salvar alterações: " + (err.message || "Erro desconhecido"));
    } finally {
      setSavingItems(false);
    }
  };

  const filteredVendas = vendas.filter(
    (v) =>
      v.numero?.toString().includes(busca) ||
      v.clientes?.nome?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-[#4a148c]" />
            Minhas Vendas
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Acompanhe o histórico de pedidos gerados por você.
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por número do pedido ou nome do cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 bg-slate-50 border-slate-200 w-full"
          />
        </div>
      </div>

      {/* Lista de Vendas */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando vendas...</div>
        ) : filteredVendas.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Nenhuma venda encontrada</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              Você ainda não gerou pedidos ou sua busca não retornou resultados.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredVendas.map((v) => (
              <div
                key={v.id}
                className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer"
                onClick={() => openDetails(v)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 text-[#4a148c]">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-slate-800">Pedido #{formatNumero(v.numero, v.id)}</h4>
                      {v.tipo === "DAV" && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                          Orçamento
                        </span>
                      )}
                      {v.status_aprovacao === "Aprovado" ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                          Aprovado
                        </span>
                      ) : v.status_aprovacao === "Reprovado" ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider">
                          Reprovado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                          Pendente
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">
                      Cliente: <span className="font-medium text-slate-700">{v.clientes?.nome || "Consumidor Final"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-2 font-medium">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {new Date(v.created_at).toLocaleDateString("pt-BR")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(v.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 sm:w-auto w-full border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Total da Venda</div>
                    <div className="font-bold text-lg text-slate-800">
                      {currency.format(v.valor_total || v.total || 0)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs font-semibold gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg shadow-xs"
                      onClick={() => downloadVendaPdf(v)}
                      title="Baixar PDF"
                    >
                      <FileText className="w-3.5 h-3.5 text-red-500" />
                      PDF
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs font-semibold gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-lg shadow-xs"
                      onClick={() => shareVendaWhatsApp(v)}
                      title="Enviar PDF no WhatsApp"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                      WhatsApp
                    </Button>
                  </div>
                  
                  <Button variant="ghost" size="icon" className="text-slate-400 group-hover:text-[#4a148c] group-hover:bg-[#4a148c]/10">
                    <Eye className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Venda */}
      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-white border-l-0 sm:border-l">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl text-slate-800 flex items-center gap-2">
              Detalhes do Pedido #{formatNumero(selectedVenda?.numero, selectedVenda?.id)}
            </SheetTitle>
          </SheetHeader>

          {selectedVenda && (
            <div className="space-y-6 pb-12">
              {/* Infos */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-3 text-sm">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Cliente</span>
                  <span className="font-semibold text-slate-800">{selectedVenda.clientes?.nome || "Consumidor Final"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Data</span>
                  <span className="font-semibold text-slate-800">{new Date(selectedVenda.created_at).toLocaleString("pt-BR")}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Status</span>
                  <span className="font-semibold text-slate-800">{selectedVenda.status_aprovacao}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pagamento</span>
                  <span className="font-semibold text-slate-800">{selectedVenda.condicao_pagamento || "-"}</span>
                </div>
              </div>

              {/* Itens */}
              <div>
                {isEditingItems ? (
                  /* MODO DE EDIÇÃO DE ITENS */
                  <div className="space-y-4 animate-in fade-in-50 duration-200">
                    <div className="flex items-center justify-between bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-lg text-xs">
                      <span className="font-semibold flex items-center gap-1.5">
                        <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                        Edite as quantidades ou remova itens
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-amber-900 hover:bg-amber-100"
                        onClick={cancelarEdicaoItens}
                        disabled={savingItems}
                      >
                        Cancelar
                      </Button>
                    </div>

                    <div className="max-h-[320px] overflow-y-auto divide-y border rounded-lg bg-white shadow-2xs">
                      {editItemsList.map((item, index) => {
                        const prodNome = item.produtos?.nome || item.produto?.nome || "Produto";
                        const prodImg = item.produtos?.imagem || item.produto?.imagem;
                        const prodEmoji = item.produtos?.emoji || item.produto?.emoji || "📦";
                        const prodCodigo = item.produtos?.codigo || item.produto?.codigo;
                        const unitPrice = Number(item.valor_unitario) || 0;
                        const itemSubtotal = Number(item.quantidade) * unitPrice;

                        return (
                          <div key={item.id || index} className="p-3 bg-slate-50/50 flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-md bg-slate-200 text-lg">
                                  {prodImg ? (
                                    <img src={prodImg} alt={prodNome} className="h-full w-full object-cover" />
                                  ) : (
                                    prodEmoji
                                  )}
                                </div>
                                <div className="min-w-0">
                                  {prodCodigo && (
                                    <div className="text-[10px] text-slate-400">Cód. {prodCodigo}</div>
                                  )}
                                  <p className="font-semibold text-xs sm:text-sm text-slate-800 truncate" title={prodNome}>
                                    {prodNome}
                                  </p>
                                  <p className="text-[11px] text-slate-500">
                                    {currency.format(unitPrice)} / un
                                  </p>
                                </div>
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-500 hover:bg-red-100 hover:text-red-700 shrink-0"
                                title="Excluir item"
                                onClick={() => handleRemoverItem(index)}
                                disabled={savingItems}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>

                            {/* Controles de Quantidade e Subtotal */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                                  onClick={() => handleUpdateQuantidade(index, Number(item.quantidade) - 1)}
                                  disabled={Number(item.quantidade) <= 1 || savingItems}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <input
                                  type="number"
                                  min="1"
                                  step="any"
                                  value={item.quantidade}
                                  onChange={(e) => handleUpdateQuantidade(index, Number(e.target.value))}
                                  disabled={savingItems}
                                  className="w-12 text-center text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-slate-600 hover:bg-slate-100"
                                  onClick={() => handleUpdateQuantidade(index, Number(item.quantidade) + 1)}
                                  disabled={savingItems}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>

                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 mr-1.5">Subtotal:</span>
                                <span className="font-bold text-xs sm:text-sm text-brand">
                                  {currency.format(itemSubtotal)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Adicionar Produto ao Pedido */}
                    {!showAddProduct ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={abrirBuscarProdutos}
                        className="w-full border-dashed border-brand/40 text-brand hover:bg-brand/5 text-xs font-semibold gap-1.5 h-9"
                        disabled={savingItems}
                      >
                        <PlusCircle className="w-4 h-4" />
                        Adicionar Outro Produto ao Pedido
                      </Button>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">Selecione um produto</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[10px] text-slate-500"
                            onClick={() => setShowAddProduct(false)}
                          >
                            Fechar
                          </Button>
                        </div>
                        <Input
                          placeholder="Buscar por nome ou código..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="h-8 text-xs bg-white"
                          autoFocus
                        />
                        <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 bg-white rounded-lg border border-slate-200">
                          {loadingProducts ? (
                            <div className="p-3 text-center text-xs text-slate-400">Carregando catálogo...</div>
                          ) : (
                            availableProducts
                              .filter(
                                (p) =>
                                  !productSearch ||
                                  p.nome?.toLowerCase().includes(productSearch.toLowerCase()) ||
                                  p.codigo?.toLowerCase().includes(productSearch.toLowerCase())
                              )
                              .slice(0, 10)
                              .map((p) => (
                                <div key={p.id} className="flex items-center justify-between p-2 hover:bg-slate-50 text-xs">
                                  <div className="truncate mr-2">
                                    <p className="font-semibold text-slate-800 truncate">{p.nome}</p>
                                    <p className="text-slate-500 text-[10px]">
                                      {currency.format(Number(p.valor) || 0)}
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="h-6 px-2 text-[10px] bg-brand text-white hover:bg-brand/90"
                                    onClick={() => handleAdicionarProduto(p)}
                                  >
                                    Adicionar
                                  </Button>
                                </div>
                              ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Box de Totais Recalculados */}
                    <div className="flex flex-col gap-1 p-3.5 bg-slate-100 rounded-lg border border-slate-200">
                      <div className="flex justify-between items-center text-xs text-slate-600">
                        <span>Novo Subtotal:</span>
                        <span className="font-semibold">{currency.format(editSubtotal)}</span>
                      </div>
                      {editDesconto > 0 && (
                        <div className="flex justify-between items-center text-xs text-red-600">
                          <span>Desconto:</span>
                          <span className="font-bold">- {currency.format(editDesconto)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-slate-200">
                        <span className="font-bold text-sm text-slate-800">Novo Total do Pedido:</span>
                        <span className="text-lg font-extrabold text-emerald-600 font-display">
                          {currency.format(editTotal)}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 text-right mt-0.5">Valores recalculados em tempo real</p>
                    </div>

                    {/* Botões de Ação do Modo Edição */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full font-semibold border-slate-300 text-slate-700 h-10"
                        onClick={cancelarEdicaoItens}
                        disabled={savingItems}
                      >
                        Descartar
                      </Button>
                      <Button
                        type="button"
                        className="w-full font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 shadow-sm h-10"
                        onClick={handleSalvarEdicaoItens}
                        disabled={savingItems}
                      >
                        <Save className="w-4 h-4" />
                        {savingItems ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* MODO VISUALIZAÇÃO PADRÃO */
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                        Itens do Pedido ({vendaItens.length})
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={iniciarEdicaoItens}
                        className="h-7 px-2 text-xs font-semibold gap-1 text-brand border-brand/30 hover:bg-brand/10 rounded-md shadow-2xs"
                      >
                        <Edit2 className="w-3 h-3" />
                        Editar Itens
                      </Button>
                    </div>

                    {loadingItens ? (
                      <div className="text-center p-4 text-slate-400">Carregando itens...</div>
                    ) : (
                      <div className="space-y-3">
                        {vendaItens.map((i) => (
                          <div key={i.id} className="flex justify-between items-center bg-white border border-slate-100 p-3 rounded-lg shadow-sm">
                            <div className="flex-1">
                              {i.produtos?.codigo && (
                                <div className="text-xs text-slate-400 mb-0.5">Cód. {i.produtos.codigo}</div>
                              )}
                              <div className="font-semibold text-slate-800 text-sm leading-tight">
                                {i.produtos?.nome || "Produto"}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {i.quantidade}x {currency.format(i.valor_unitario)}
                              </div>
                            </div>
                            <div className="font-bold text-slate-800 text-sm">
                              {currency.format(i.subtotal)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {!isEditingItems && (
                <>
                  {/* Totais */}
                  <div className="bg-slate-800 text-white p-4 rounded-xl space-y-2 mt-4">
                    <div className="flex justify-between text-sm opacity-80">
                      <span>Subtotal</span>
                      <span>{currency.format(selectedVenda.valor_total + (selectedVenda.desconto_valor || 0))}</span>
                    </div>
                    {selectedVenda.desconto_valor > 0 && (
                      <div className="flex justify-between text-sm text-emerald-400">
                        <span>Desconto</span>
                        <span>-{currency.format(selectedVenda.desconto_valor)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-600/50">
                      <span>Total</span>
                      <span>{currency.format(selectedVenda.valor_total)}</span>
                    </div>
                  </div>

                  {/* Ações da Venda/Orçamento */}
                  <div className="space-y-2 pt-4 border-t border-slate-200">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                        onClick={() => downloadVendaPdf(selectedVenda, vendaItens)}
                      >
                        <FileText className="w-4 h-4 text-red-400" />
                        Baixar PDF
                      </Button>
                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                        onClick={() => shareVendaWhatsApp(selectedVenda, vendaItens)}
                      >
                        <WhatsAppIcon className="w-4 h-4 text-white" />
                        WhatsApp (PDF)
                      </Button>
                    </div>

                    {/* Botão de Editar Itens também nas ações */}
                    <Button
                      variant="outline"
                      className="w-full border-brand/40 text-brand hover:bg-brand/10 font-semibold flex items-center justify-center gap-2"
                      onClick={iniciarEdicaoItens}
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar Itens do Pedido (Quantidades e Produtos)
                    </Button>

                    {/* Cancelar Orçamento */}
                    {(selectedVenda.tipo === "DAV" || selectedVenda.status_aprovacao === "Pendente") && (
                      <Button
                        variant="outline"
                        className="w-full border-amber-200 text-amber-700 hover:bg-amber-50 font-semibold flex items-center justify-center gap-2"
                        disabled={cancelingOrder}
                        onClick={async () => {
                          if (!confirm("Deseja realmente cancelar este orçamento?")) return;
                          setCancelingOrder(true);
                          try {
                            await supabase
                              .from("vendas")
                              .update({ status: "Cancelado", status_aprovacao: "Recusado" })
                              .eq("id", selectedVenda.id);
                            await supabase
                              .from("davs")
                              .update({ status: "Cancelado" })
                              .eq("id", selectedVenda.id);
                            toast.success("Orçamento cancelado com sucesso!");
                            setVendas((prev) =>
                              prev.map((v) =>
                                v.id === selectedVenda.id
                                  ? { ...v, status: "Cancelado", status_aprovacao: "Recusado" }
                                  : v
                              )
                            );
                            setOpenSheet(false);
                          } catch (err: any) {
                            toast.error("Erro ao cancelar: " + err.message);
                          } finally {
                            setCancelingOrder(false);
                          }
                        }}
                      >
                        <Ban className="w-4 h-4" />
                        {cancelingOrder ? "Cancelando..." : "Cancelar Orçamento"}
                      </Button>
                    )}

                    {/* Excluir Pedido */}
                    <Button
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 font-semibold flex items-center justify-center gap-2"
                      disabled={deletingOrder}
                      onClick={async () => {
                        if (!confirm("Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.")) return;
                        setDeletingOrder(true);
                        try {
                          await supabase.from("vendas_itens").delete().eq("venda_id", selectedVenda.id);
                          await supabase.from("dav_items").delete().eq("dav_id", selectedVenda.id);
                          await supabase.from("davs").delete().eq("id", selectedVenda.id);
                          const { error } = await supabase.from("vendas").delete().eq("id", selectedVenda.id);
                          if (error) throw error;
                          toast.success("Pedido excluído com sucesso!");
                          setVendas((prev) => prev.filter((v) => v.id !== selectedVenda.id));
                          setOpenSheet(false);
                        } catch (err: any) {
                          toast.error("Erro ao excluir pedido: " + err.message);
                        } finally {
                          setDeletingOrder(false);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      {deletingOrder ? "Excluindo..." : "Excluir Pedido"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
