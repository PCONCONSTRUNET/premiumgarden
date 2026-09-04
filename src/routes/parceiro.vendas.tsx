import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabaseParceiro as supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  FileText,
  Search,
  ShoppingCart,
  CalendarDays,
  Clock,
  Eye,
  X,
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
  
  // Sheet state
  const [selectedVenda, setSelectedVenda] = useState<any>(null);
  const [openSheet, setOpenSheet] = useState(false);
  const [vendaItens, setVendaItens] = useState<any[]>([]);
  const [loadingItens, setLoadingItens] = useState(false);

  useEffect(() => {
    const fetchVendas = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Pegar vendedor_id
        const { data: vData } = await supabase
          .from("vendedores")
          .select("id")
          .eq("user_id", session.user.id)
          .single();

        if (vData) {
          const { data, error } = await supabase
            .from("vendas")
            .select("*, clientes(nome)")
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
    try {
      const { data, error } = await supabase
        .from("vendas_itens")
        .select("*, produtos(nome, codigo)")
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
                      <h4 className="font-bold text-slate-800">Pedido #{v.numero || "S/N"}</h4>
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

                <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Total da Venda</div>
                    <div className="font-bold text-lg text-slate-800">
                      {currency.format(v.valor_total || v.total || 0)}
                    </div>
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
              Detalhes do Pedido #{selectedVenda?.numero || "S/N"}
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
                <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">Itens do Pedido</h3>
                {loadingItens ? (
                  <div className="text-center p-4 text-slate-400">Carregando itens...</div>
                ) : (
                  <div className="space-y-3">
                    {vendaItens.map((i) => (
                      <div key={i.id} className="flex justify-between items-center bg-white border border-slate-100 p-3 rounded-lg shadow-sm">
                        <div className="flex-1">
                          <div className="text-xs text-slate-400 mb-0.5">Cód. {i.produtos?.codigo}</div>
                          <div className="font-semibold text-slate-800 text-sm leading-tight">
                            {i.produtos?.nome}
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
              </div>

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
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
