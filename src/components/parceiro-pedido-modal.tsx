import { useState, useEffect, useMemo } from "react";
import { supabaseParceiro as supabase, supabase as supabaseAdmin } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Trash2,
  Plus,
  Minus,
  Search,
  Pencil,
  FileText,
  Download,
  Copy,
  Ban,
  Check,
  X,
  User,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import {
  WhatsAppIcon,
  shareOrderWhatsApp,
  openOrderPdf,
  downloadOrderPdf,
  getOrderNumber,
  isOrderDav,
} from "@/lib/order-pdf";

export interface ParceiroPedidoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venda: any | null;
  vendedor?: {
    id?: string;
    tipo_comissao?: string;
    valor_comissao?: number;
    nome?: string;
  } | null;
  onVendaUpdated?: (updatedVenda: any, updatedItens?: any[]) => void;
  onVendaDeleted?: (vendaId: string) => void;
}

export function ParceiroPedidoModal({
  open,
  onOpenChange,
  venda,
  vendedor,
  onVendaUpdated,
  onVendaDeleted,
}: ParceiroPedidoModalProps) {
  const [loadingItens, setLoadingItens] = useState(false);
  const [itens, setItens] = useState<any[]>([]);

  // Estados de Edição
  const [isEditing, setIsEditing] = useState(false);
  const [editItens, setEditItens] = useState<any[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);

  // Estados de Edição do Cliente
  const [clienteForm, setClienteForm] = useState({
    nome: "",
    cpf_cnpj: "",
    telefone: "",
  });

  // Estados de busca/adição de produtos
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchProductQuery, setSearchProductQuery] = useState("");
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // Ações de compartilhamento e envio
  const [isSharing, setIsSharing] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sendingToOwner, setSendingToOwner] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(false);

  // Carrega itens da venda selecionada
  useEffect(() => {
    if (!open || !venda) {
      setIsEditing(false);
      setIsAddingProduct(false);
      setSearchProductQuery("");
      return;
    }

    const fetchItens = async () => {
      setLoadingItens(true);
      try {
        let loadedItems: any[] = [];
        const clients = [supabase, supabaseAdmin].filter(Boolean);

        // 1. Tenta carregar com join em produtos (vendas_itens)
        for (const client of clients) {
          if (loadedItems.length > 0) break;
          try {
            const { data, error } = await client
              .from("vendas_itens")
              .select("*, produtos(id, nome, codigo, imagem, valor)")
              .eq("venda_id", venda.id);
            if (!error && data && data.length > 0) {
              loadedItems = data;
              break;
            }
          } catch (e) {
            console.warn("Falha no select vendas_itens com join:", e);
          }
        }

        // 2. Se join falhou, tenta select simples de vendas_itens
        if (loadedItems.length === 0) {
          for (const client of clients) {
            if (loadedItems.length > 0) break;
            try {
              const { data, error } = await client
                .from("vendas_itens")
                .select("*")
                .eq("venda_id", venda.id);
              if (!error && data && data.length > 0) {
                loadedItems = data;
                break;
              }
            } catch (e) {
              console.warn("Falha no select simples de vendas_itens:", e);
            }
          }
        }

        // 3. Fallback para dav_items (com join)
        if (loadedItems.length === 0) {
          for (const client of clients) {
            if (loadedItems.length > 0) break;
            try {
              const { data, error } = await client
                .from("dav_items")
                .select("*, produtos(id, nome, codigo, imagem, valor)")
                .eq("dav_id", venda.id);
              if (!error && data && data.length > 0) {
                loadedItems = data;
                break;
              }
            } catch (e) {
              console.warn("Falha no select dav_items com join:", e);
            }
          }
        }

        // 4. Fallback para dav_items (simples)
        if (loadedItems.length === 0) {
          for (const client of clients) {
            if (loadedItems.length > 0) break;
            try {
              const { data, error } = await client
                .from("dav_items")
                .select("*")
                .eq("dav_id", venda.id);
              if (!error && data && data.length > 0) {
                loadedItems = data;
                break;
              }
            } catch (e) {
              console.warn("Falha no select simples de dav_items:", e);
            }
          }
        }

        // Se algum item está sem dados do produto, busca os produtos pelos IDs
        const missingIds = loadedItems
          .map((item) => item.produto_id || item.id_produto)
          .filter((id): id is string => Boolean(id));

        const productsMap: Record<string, any> = {};
        if (missingIds.length > 0) {
          try {
            for (const client of clients) {
              const { data: prods, error } = await client
                .from("produtos")
                .select("id, nome, codigo, imagem, valor")
                .in("id", missingIds);
              if (!error && prods && prods.length > 0) {
                for (const p of prods) {
                  productsMap[p.id] = p;
                }
                break;
              }
            }
          } catch (e) {
            console.warn("Falha ao buscar produtos complementares:", e);
          }
        }

        // Normaliza cada item com consistência total
        const normalized = loadedItems.map((item) => {
          const prodObj = item.produtos || item.produto || productsMap[item.produto_id || item.id_produto] || {};
          const nomeFinal = prodObj.nome || item.nome || item.produto || item.produto_nome || "Produto";
          const imagemFinal = prodObj.imagem || item.imagem || null;
          const codigoFinal = prodObj.codigo || item.codigo || null;
          const valorUnit = Number(item.valor_unitario ?? prodObj.valor ?? 0);
          const qtd = Number(item.quantidade ?? item.qtd ?? 1);
          const subt = Number(item.subtotal ?? (qtd * valorUnit));

          const productShape = {
            id: prodObj.id || item.produto_id,
            nome: nomeFinal,
            codigo: codigoFinal,
            imagem: imagemFinal,
            emoji: "📦",
            valor: valorUnit,
          };

          return {
            ...item,
            quantidade: qtd,
            valor_unitario: valorUnit,
            subtotal: subt,
            produto_nome: nomeFinal,
            imagem: imagemFinal,
            codigo: codigoFinal,
            produto: productShape,
            produtos: productShape,
          };
        });

        setItens(normalized);
      } catch (err) {
        console.error("Erro ao carregar itens da venda:", err);
        setItens([]);
      } finally {
        setLoadingItens(false);
      }
    };

    fetchItens();

    // Sincroniza formulário do cliente
    const clientData = venda.cliente || venda.clientes || {};
    setClienteForm({
      nome: clientData.nome || "",
      cpf_cnpj: clientData.cpf_cnpj || "",
      telefone: clientData.telefone || "",
    });
  }, [open, venda]);

  // Carrega produtos do catálogo para adicionar quando entrar no modo de edição
  const fetchCatalogProducts = async () => {
    if (catalogProducts.length > 0) return;
    setLoadingProducts(true);
    try {
      const clients = [supabase, supabaseAdmin].filter(Boolean);
      for (const client of clients) {
        const { data, error } = await client
          .from("produtos")
          .select("id, nome, codigo, imagem, valor, status")
          .eq("status", "Ativo")
          .order("nome");
        if (!error && data && data.length > 0) {
          setCatalogProducts(
            data.map((p) => ({
              ...p,
              emoji: "📦",
            }))
          );
          break;
        }
      }
    } catch (err) {
      console.error("Erro ao carregar catálogo de produtos:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleStartEditing = () => {
    // Clona os itens atuais para a lista editável
    const cloned = itens.map((i) => ({
      ...i,
      produto_id: i.produto_id || i.produto?.id || i.produtos?.id || i.id,
      quantidade: Number(i.quantidade || i.qtd || 1),
      valor_unitario: Number(i.valor_unitario || 0),
      subtotal:
        Number(i.quantidade || i.qtd || 1) * Number(i.valor_unitario || 0),
      produto: i.produto || i.produtos || {
        nome: i.produto_nome || "Produto",
        codigo: i.codigo,
        emoji: "📦",
        imagem: i.imagem,
      },
      produtos: i.produtos || i.produto || {
        nome: i.produto_nome || "Produto",
        codigo: i.codigo,
        emoji: "📦",
        imagem: i.imagem,
      },
    }));
    setEditItens(cloned);
    const clientData = venda?.cliente || venda?.clientes || {};
    setClienteForm({
      nome: clientData.nome || "",
      cpf_cnpj: clientData.cpf_cnpj || "",
      telefone: clientData.telefone || "",
    });
    setIsEditing(true);
    fetchCatalogProducts();
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setIsAddingProduct(false);
    setSearchProductQuery("");
  };

  // Funções de manipulação dos itens em edição
  const handleQuantityChange = (index: number, delta: number) => {
    setEditItens((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      const newQtd = Math.max(1, (Number(item.quantidade) || 1) + delta);
      item.quantidade = newQtd;
      item.subtotal = newQtd * Number(item.valor_unitario || 0);
      next[index] = item;
      return next;
    });
  };

  const handleDirectQtyChange = (index: number, rawValue: string) => {
    const val = parseFloat(rawValue.replace(",", "."));
    const newQtd = isNaN(val) || val < 1 ? 1 : val;
    setEditItens((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      item.quantidade = newQtd;
      item.subtotal = newQtd * Number(item.valor_unitario || 0);
      next[index] = item;
      return next;
    });
  };

  const handleUpdatePrice = (index: number, rawValue: string) => {
    // Permite que o parceiro edite o valor unitário (dar desconto ou aumentar)
    const val = parseFloat(rawValue.replace(",", "."));
    const newPrice = isNaN(val) || val < 0 ? 0 : val;
    setEditItens((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      item.valor_unitario = newPrice;
      item.subtotal = (Number(item.quantidade) || 1) * newPrice;
      next[index] = item;
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setEditItens((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddProductToOrder = (prod: any) => {
    const defaultPrice = Number(prod.valor ?? prod.preco_venda ?? 0);
    // Se o produto já estiver na lista, apenas aumenta a quantidade
    const existingIndex = editItens.findIndex((i) => (i.produto_id || i.produto?.id) === prod.id);

    if (existingIndex >= 0) {
      handleQuantityChange(existingIndex, 1);
    } else {
      const newItem = {
        id: `temp-${Date.now()}-${Math.random()}`,
        produto_id: prod.id,
        quantidade: 1,
        valor_unitario: defaultPrice,
        subtotal: defaultPrice,
        produto: {
          id: prod.id,
          nome: prod.nome,
          codigo: prod.codigo,
          emoji: prod.emoji || "📦",
          imagem: prod.imagem,
          valor: defaultPrice,
        },
      };
      setEditItens((prev) => [...prev, newItem]);
    }
  };

  // Cálculo dos totais editados
  const editSubtotal = useMemo(() => {
    return editItens.reduce((acc, i) => acc + Number(i.subtotal || 0), 0);
  }, [editItens]);

  const editTotal = useMemo(() => {
    const desconto = Number(venda?.desconto_valor || 0);
    return Math.max(0, editSubtotal - desconto);
  }, [editSubtotal, venda]);

  // Salva o pedido modificado no Supabase
  const handleSaveOrder = async () => {
    if (!venda) return;
    if (editItens.length === 0) {
      alert("O pedido precisa ter pelo menos 1 produto. Adicione produtos antes de salvar.");
      return;
    }

    setSavingOrder(true);
    try {
      // 1. Recalcula comissão caso o vendedor tenha comissão cadastrada
      let novaComissao = Number(venda.valor_comissao || 0);
      if (vendedor) {
        if (vendedor.tipo_comissao === "porcentagem") {
          novaComissao = editTotal * (Number(vendedor.valor_comissao || 0) / 100);
        } else if (vendedor.tipo_comissao === "fixo") {
          novaComissao = Number(vendedor.valor_comissao || 0);
        }
      }

      // 2. Atualiza a venda principal
      const updatePayload: any = {
        subtotal: editSubtotal,
        valor_total: editTotal,
        valor_comissao: novaComissao,
        updated_at: new Date().toISOString(),
      };

      const { error: vendaUpdateError } = await supabase
        .from("vendas")
        .update(updatePayload)
        .eq("id", venda.id);

      if (vendaUpdateError) throw vendaUpdateError;

      // 3. Atualiza os itens da venda (deleta antigos e insere os novos)
      const clients = [supabase, supabaseAdmin].filter(Boolean);
      for (const client of clients) {
        try {
          await client.from("vendas_itens").delete().eq("venda_id", venda.id);
          await client.from("dav_items").delete().eq("dav_id", venda.id);
          break;
        } catch {}
      }

      const itensToInsert = editItens.map((i) => ({
        venda_id: venda.id,
        produto_id: i.produto_id || i.produto?.id || i.produtos?.id,
        quantidade: Number(i.quantidade),
        valor_unitario: Number(i.valor_unitario),
        subtotal: Number(i.quantidade) * Number(i.valor_unitario),
      }));

      let insertSuccess = false;
      for (const client of clients) {
        const { error: insertError } = await client
          .from("vendas_itens")
          .insert(itensToInsert);
        if (!insertError) {
          insertSuccess = true;
          break;
        }
      }

      if (!insertSuccess) {
        throw new Error("Não foi possível salvar os itens da venda.");
      }

      // 4. Atualiza os dados do cliente se fornecidos e associados
      const clienteId = venda.cliente_id || venda.cliente?.id || venda.clientes?.id;
      if (clienteId && (clienteForm.nome || clienteForm.telefone || clienteForm.cpf_cnpj)) {
        await supabase
          .from("clientes")
          .update({
            nome: clienteForm.nome,
            cpf_cnpj: clienteForm.cpf_cnpj,
            telefone: clienteForm.telefone,
          })
          .eq("id", clienteId);
      }

      // 5. Monta o objeto da venda atualizado para repassar para o componente pai
      const updatedVendaObj = {
        ...venda,
        ...updatePayload,
        cliente: {
          ...(venda.cliente || venda.clientes || {}),
          ...clienteForm,
        },
        clientes: {
          ...(venda.cliente || venda.clientes || {}),
          ...clienteForm,
        },
      };

      setItens(editItens);
      if (onVendaUpdated) {
        onVendaUpdated(updatedVendaObj, editItens);
      }

      setIsEditing(false);
      setIsAddingProduct(false);
      alert("Pedido atualizado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar alterações no pedido:", err);
      alert("Erro ao salvar alterações no pedido: " + (err.message || err));
    } finally {
      setSavingOrder(false);
    }
  };

  // Enviar pedido para o dono da loja
  const handleEnviarPedido = async () => {
    if (!venda) return;
    try {
      setSendingToOwner(true);
      await supabase.from("notificacoes").insert([
        {
          tipo: "venda",
          titulo: `Pedido reenviado pelo parceiro: ${vendedor?.nome || "Vendedor"}`,
          mensagem: `O parceiro reenviou o pedido #${getOrderNumber(venda)} para aprovação.`,
        },
      ]);
      alert("Pedido enviado para o dono com sucesso!");
      onOpenChange(false);
    } catch (err: any) {
      alert("Erro ao enviar pedido: " + err.message);
    } finally {
      setSendingToOwner(false);
    }
  };

  // Excluir pedido
  const handleDelete = async () => {
    if (!venda) return;
    const isDav = isOrderDav(venda);
    const label = isDav ? "orçamento" : "pedido";
    if (!confirm(`Tem certeza que deseja excluir este ${label}? Essa ação não pode ser desfeita.`)) {
      return;
    }

    setDeletingOrder(true);
    try {
      await supabase.from("vendas_itens").delete().eq("venda_id", venda.id);
      await supabase.from("dav_items").delete().eq("dav_id", venda.id);
      const { error } = await supabase.from("vendas").delete().eq("id", venda.id);
      if (error) throw error;

      if (onVendaDeleted) {
        onVendaDeleted(venda.id);
      }
      onOpenChange(false);
      alert(`${isDav ? "Orçamento" : "Pedido"} excluído com sucesso!`);
    } catch (err: any) {
      alert(`Erro ao excluir ${label}: ` + err.message);
    } finally {
      setDeletingOrder(false);
    }
  };

  // Cancelar orçamento
  const handleCancelDav = async () => {
    if (!venda) return;
    if (!confirm("Tem certeza que deseja cancelar este orçamento?")) return;

    try {
      const { error } = await supabase
        .from("vendas")
        .update({ status: "Cancelado", status_aprovacao: "Cancelado" })
        .eq("id", venda.id);
      if (error) throw error;

      const updated = { ...venda, status: "Cancelado", status_aprovacao: "Cancelado" };
      if (onVendaUpdated) {
        onVendaUpdated(updated, itens);
      }
      alert("Orçamento marcado como cancelado.");
      onOpenChange(false);
    } catch (err: any) {
      alert("Erro ao cancelar orçamento: " + err.message);
    }
  };

  // Compartilhamento via WhatsApp e PDF
  const handleShare = async () => {
    if (!venda) return;
    setIsSharing(true);
    try {
      await shareOrderWhatsApp(venda, itens);
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!venda) return;
    setDownloadingPdf(true);
    try {
      await downloadOrderPdf(venda, itens);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "aprovado":
      case "aprovada":
      case "aceito":
      case "pago":
      case "entregue":
      case "faturado":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "pendente":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "rejeitado":
      case "rejeitada":
      case "cancelado":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  if (!venda) return null;

  const isDav = isOrderDav(venda);
  const cliente = venda.cliente || venda.clientes || {};
  const orderNum = getOrderNumber(venda);

  // Filtro de produtos para adicionar
  const filteredCatalog = catalogProducts.filter((p) => {
    if (!searchProductQuery) return true;
    const term = searchProductQuery.toLowerCase();
    const nome = (p.nome || "").toLowerCase();
    const codigo = (p.codigo || "").toLowerCase();
    return nome.includes(term) || codigo.includes(term);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl">
        {/* Cabeçalho Fixo do Modal */}
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 shrink-0 pr-12 text-left bg-white">
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle className="text-lg font-bold text-slate-900">
              {isEditing ? (
                <span className="flex items-center gap-2 text-brand">
                  <Pencil className="w-5 h-5 text-brand" /> Editar {isDav ? "Orçamento" : "Pedido"} #{orderNum}
                </span>
              ) : (
                <span>
                  {isDav ? "Ficha do Orçamento" : "Ficha do Pedido"} #{orderNum}
                </span>
              )}
            </DialogTitle>

            {isEditing ? (
              <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold">
                Modo Edição
              </Badge>
            ) : (
              venda.status_aprovacao && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusColor(
                    venda.status_aprovacao,
                  )}`}
                >
                  {venda.status_aprovacao}
                </span>
              )
            )}
          </div>

          <DialogDescription asChild>
            <div className="mt-1 text-xs text-muted-foreground">
              Realizado em{" "}
              {venda.created_at &&
                new Date(venda.created_at).toLocaleDateString("pt-BR")}{" "}
              às{" "}
              {venda.created_at &&
                new Date(venda.created_at).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Corpo com Scroll do Modal */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-4">
          {/* Seção de Dados do Cliente */}
          <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Dados do Cliente
              </span>
              {!isEditing && (
                <button
                  type="button"
                  onClick={handleStartEditing}
                  className="text-xs font-semibold text-brand hover:underline flex items-center gap-1"
                >
                  <Pencil className="w-3 h-3" /> Editar Dados
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="grid gap-2.5 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">
                    Nome Completo
                  </label>
                  <Input
                    value={clienteForm.nome}
                    onChange={(e) =>
                      setClienteForm((p) => ({ ...p, nome: e.target.value }))
                    }
                    placeholder="Nome do cliente"
                    className="h-9 bg-white text-xs font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">
                    WhatsApp / Telefone
                  </label>
                  <Input
                    value={clienteForm.telefone}
                    onChange={(e) =>
                      setClienteForm((p) => ({ ...p, telefone: e.target.value }))
                    }
                    placeholder="(00) 00000-0000"
                    className="h-9 bg-white text-xs font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">
                    CPF / CNPJ
                  </label>
                  <Input
                    value={clienteForm.cpf_cnpj}
                    onChange={(e) =>
                      setClienteForm((p) => ({ ...p, cpf_cnpj: e.target.value }))
                    }
                    placeholder="Documento"
                    className="h-9 bg-white text-xs font-medium"
                  />
                </div>
              </div>
            ) : (
              <div>
                <p className="font-bold text-slate-800 text-sm">
                  {cliente.nome || "Cliente não informado"}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
                  {cliente.telefone && <span>📞 {cliente.telefone}</span>}
                  {cliente.cpf_cnpj && <span>📄 {cliente.cpf_cnpj}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Banner de instrução de edição */}
          {isEditing && (
            <div className="bg-amber-50/80 border border-amber-200/80 p-3 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Edição do Pedido Habilitada</p>
                <p className="text-amber-800/90 mt-0.5 leading-relaxed">
                  Você pode alterar as quantidades, editar os valores unitários
                  para dar desconto ou aumentar, remover produtos e adicionar novos
                  itens do catálogo.
                </p>
              </div>
            </div>
          )}

          {/* Lista de Produtos / Itens */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" /> Produtos do Pedido
                {isEditing ? ` (${editItens.length})` : ` (${itens.length})`}
              </span>

              {isEditing && !isAddingProduct && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddingProduct(true)}
                  className="h-7 text-xs font-semibold gap-1 border-brand/30 text-brand hover:bg-brand/10 rounded-lg"
                >
                  <Plus className="w-3 h-3" /> Adicionar Produto
                </Button>
              )}
            </div>

            {loadingItens ? (
              <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-brand" />
                <span className="text-xs">Carregando itens do pedido...</span>
              </div>
            ) : isEditing ? (
              /* ================== MODO EDIÇÃO ================== */
              <div className="space-y-3">
                {editItens.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                    <p className="text-sm font-semibold text-slate-600">
                      Nenhum produto no pedido
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Clique no botão abaixo para adicionar produtos do catálogo.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsAddingProduct(true)}
                      className="mt-2 text-xs font-bold bg-brand hover:bg-brand/90 text-white rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Produto
                    </Button>
                  </div>
                ) : (
                  editItens.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="bg-slate-50/70 p-3 sm:p-3.5 rounded-xl border border-slate-200 space-y-3 transition-all hover:border-slate-300"
                    >
                      {/* Topo do item: Foto + Nome + Botão Excluir */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden text-xl shadow-xs">
                            {item.produto?.imagem ? (
                              <img
                                src={item.produto.imagem}
                                alt={item.produto?.nome}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{item.produto?.emoji || "📦"}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-slate-800 truncate">
                              {item.produto?.nome || item.produto_nome || "Produto"}
                            </p>
                            {item.produto?.codigo && (
                              <p className="text-[11px] text-muted-foreground font-mono">
                                Cód: {item.produto.codigo}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Botão de Remover Produto */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                          title="Remover produto do pedido"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Controles: Quantidade, Valor Unitário e Subtotal */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200/60 items-center">
                        {/* Quantidade */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-slate-500 w-8">
                            Qtd:
                          </span>
                          <div className="flex items-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-7 rounded-r-none border-slate-200 text-slate-700 hover:bg-slate-100"
                              onClick={() => handleQuantityChange(idx, -1)}
                              disabled={item.quantidade <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={item.quantidade}
                              onChange={(e) =>
                                handleDirectQtyChange(idx, e.target.value)
                              }
                              className="h-8 w-12 text-center rounded-none font-bold text-xs bg-white border-x-0 border-slate-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none px-0"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-7 rounded-l-none border-slate-200 text-slate-700 hover:bg-slate-100"
                              onClick={() => handleQuantityChange(idx, 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Valor Unitário (Permite dar desconto ou aumentar) */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                            Un.:
                          </span>
                          <div className="relative flex-1">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                              R$
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.valor_unitario}
                              onChange={(e) =>
                                handleUpdatePrice(idx, e.target.value)
                              }
                              className="h-8 pl-6 pr-1.5 font-bold text-xs bg-white border-slate-200 text-slate-800 text-right"
                              title="Altere o valor unitário para aplicar desconto ou reajuste"
                            />
                          </div>
                        </div>

                        {/* Subtotal do Item */}
                        <div className="flex items-center justify-between sm:justify-end gap-1.5">
                          <span className="text-[11px] text-slate-400 font-semibold sm:hidden">
                            Total Item:
                          </span>
                          <span className="font-black text-sm text-brand">
                            R${" "}
                            {Number(item.subtotal || 0)
                              .toFixed(2)
                              .replace(".", ",")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Bloco de Adicionar Produto */}
                {isAddingProduct && (
                  <div className="p-3.5 bg-brand/5 border border-brand/20 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-brand flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> Adicionar Produto ao Pedido
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsAddingProduct(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome ou código..."
                        value={searchProductQuery}
                        onChange={(e) => setSearchProductQuery(e.target.value)}
                        className="pl-8 h-8 text-xs bg-white rounded-lg"
                        autoFocus
                      />
                    </div>

                    {loadingProducts ? (
                      <div className="text-center py-4 text-muted-foreground text-xs flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-brand" />
                        Carregando catálogo...
                      </div>
                    ) : filteredCatalog.length === 0 ? (
                      <div className="text-center py-4 text-xs text-muted-foreground">
                        Nenhum produto encontrado no catálogo.
                      </div>
                    ) : (
                      <div className="max-h-[180px] overflow-y-auto space-y-1.5 divide-y divide-slate-100 pr-1">
                        {filteredCatalog.slice(0, 15).map((prod) => (
                          <div
                            key={prod.id}
                            className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors pt-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-lg shrink-0">
                                {prod.emoji || "📦"}
                              </span>
                              <div className="min-w-0">
                                <p className="font-semibold text-xs text-slate-800 truncate">
                                  {prod.nome}
                                </p>
                                <p className="text-[11px] text-slate-500 font-medium">
                                  R${" "}
                                  {Number(prod.valor ?? prod.preco_venda ?? 0)
                                    .toFixed(2)
                                    .replace(".", ",")}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              className="h-7 px-2.5 text-xs font-bold bg-brand hover:bg-brand/90 text-white rounded-lg shrink-0 gap-1"
                              onClick={() => handleAddProductToOrder(prod)}
                            >
                              <Plus className="w-3 h-3" /> Incluir
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* ================== MODO VISUALIZAÇÃO ================== */
              <div className="space-y-2">
                <div className="max-h-[260px] overflow-y-auto divide-y border border-slate-200 rounded-xl bg-white shadow-xs">
                  {itens.length === 0 ? (
                    <div className="p-5 text-center text-xs text-muted-foreground">
                      Nenhum item encontrado neste pedido.
                    </div>
                  ) : (
                    itens.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-slate-50/40 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden text-xl shadow-xs">
                            {(item.produto?.imagem || item.produtos?.imagem || item.imagem) ? (
                              <img
                                src={item.produto?.imagem || item.produtos?.imagem || item.imagem}
                                alt={item.produto?.nome || item.produtos?.nome || item.produto_nome}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{item.produto?.emoji || item.produtos?.emoji || "📦"}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                              {item.produto?.nome || item.produtos?.nome || item.produto_nome || "Produto"}
                            </p>
                            {Boolean(item.produto?.codigo || item.produtos?.codigo || item.codigo) && (
                              <p className="text-[10px] text-muted-foreground font-mono">
                                Cód: {item.produto?.codigo || item.produtos?.codigo || item.codigo}
                              </p>
                            )}
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {item.quantidade}x R${" "}
                              {Number(item.valor_unitario)
                                .toFixed(2)
                                .replace(".", ",")}
                            </p>
                          </div>
                        </div>
                        <p className="font-black text-sm text-brand shrink-0">
                          R${" "}
                          {Number(item.subtotal || 0)
                            .toFixed(2)
                            .replace(".", ",")}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Resumo Financeiro */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-600">
              <span>Subtotal dos Produtos:</span>
              <span className="font-semibold">
                R${" "}
                {Number(isEditing ? editSubtotal : (venda.subtotal || venda.valor_total || 0))
                  .toFixed(2)
                  .replace(".", ",")}
              </span>
            </div>

            {Number(venda.desconto_valor) > 0 && (
              <div className="flex justify-between items-center text-xs text-rose-600 font-medium">
                <span>
                  Descontos (-){venda.desconto_percentual ? ` (${venda.desconto_percentual}%)` : ""}
                </span>
                <span>
                  R$ {Number(venda.desconto_valor).toFixed(2).replace(".", ",")}
                </span>
              </div>
            )}

            <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
              <div>
                <span className="text-xs uppercase font-bold text-slate-700">
                  Total do {isDav ? "Orçamento" : "Pedido"}:
                </span>
                {vendedor?.valor_comissao && Number(vendedor.valor_comissao) > 0 && (
                  <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                    {vendedor.tipo_comissao === "porcentagem"
                      ? `Comissão estimada (${vendedor.valor_comissao}%): R$ ${(
                          (isEditing ? editTotal : Number(venda.valor_total || 0)) *
                          (Number(vendedor.valor_comissao) / 100)
                        )
                          .toFixed(2)
                          .replace(".", ",")}`
                      : `Comissão fixa: R$ ${Number(vendedor.valor_comissao).toFixed(2).replace(".", ",")}`}
                  </p>
                )}
              </div>
              <span className="text-lg font-black font-display text-slate-900">
                R${" "}
                {Number(isEditing ? editTotal : (venda.valor_total || 0))
                  .toFixed(2)
                  .replace(".", ",")}
              </span>
            </div>
          </div>
        </div>

        {/* Rodapé Fixo com Ações */}
        <div className="shrink-0 p-4 border-t border-slate-100 bg-slate-50/90 backdrop-blur-xs flex flex-col gap-2">
          {isEditing ? (
            /* Ações do Modo Edição */
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11 border-slate-300 font-semibold text-slate-700 rounded-xl"
                onClick={handleCancelEditing}
                disabled={savingOrder}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="flex-1 h-11 bg-brand hover:bg-brand/90 font-bold text-white rounded-xl shadow-md gap-1.5"
                onClick={handleSaveOrder}
                disabled={savingOrder}
              >
                {savingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          ) : (
            /* Ações do Modo Visualização */
            <div className="space-y-2">
              {/* Botão de Destaque: EDITAR PEDIDO */}
              <Button
                type="button"
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"
                onClick={handleStartEditing}
              >
                <Pencil className="w-4 h-4" />
                <span>Editar Pedido (Produtos, Valores e Quantidades)</span>
              </Button>

              {/* Botão WhatsApp */}
              <Button
                type="button"
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/15 flex items-center justify-center gap-2 text-xs"
                onClick={handleShare}
                disabled={isSharing}
              >
                {isSharing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <WhatsAppIcon className="w-4 h-4 shrink-0" />
                )}
                <span>Enviar PDF no WhatsApp</span>
              </Button>

              {/* PDF e Clonar */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1 px-1"
                  onClick={() => openOrderPdf(venda.id)}
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">Ver PDF</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={downloadingPdf}
                  className="h-9 border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1 px-1 disabled:opacity-50"
                  onClick={handleDownloadPdf}
                >
                  {downloadingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 text-slate-500 shrink-0 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                  <span className="truncate">{downloadingPdf ? "Baixando..." : "Baixar PDF"}</span>
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  className="h-9 font-bold border border-slate-200 rounded-xl flex items-center justify-center gap-1 text-xs text-slate-700 px-1"
                  onClick={() => {
                    const itemsMagic = itens
                      .map((i) => `${i.produto_id || i.produto?.id}:${i.quantidade}`)
                      .join(",");
                    window.location.href = `/parceiro/pdv?c=${itemsMagic}`;
                  }}
                  title="Clonar este pedido no PDV"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">Clonar PDV</span>
                </Button>
              </div>

              {/* Enviar ao dono (quando Pendente) */}
              {venda.status_aprovacao === "Pendente" && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-9 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                  onClick={handleEnviarPedido}
                  disabled={sendingToOwner}
                >
                  {sendingToOwner ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>🚀 Enviar pedido para o dono</span>
                  )}
                </Button>
              )}

              {/* Cancelamento e Exclusão */}
              <div className="flex gap-2 pt-1 border-t border-slate-100">
                {isDav ? (
                  <>
                    {venda.status !== "Cancelado" && (
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-8 text-[11px] font-bold border-amber-300 text-amber-800 hover:bg-amber-50 rounded-lg gap-1"
                        onClick={handleCancelDav}
                      >
                        <Ban className="w-3 h-3 text-amber-600" />
                        Cancelar Orçamento
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1 h-8 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg font-semibold gap-1"
                      onClick={handleDelete}
                      disabled={deletingOrder}
                    >
                      <Trash2 className="w-3 h-3" />
                      Excluir
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full h-8 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg font-semibold flex items-center justify-center gap-1"
                    onClick={handleDelete}
                    disabled={deletingOrder}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deletingOrder ? "Excluindo..." : "Excluir Pedido"}</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
