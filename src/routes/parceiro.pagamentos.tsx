import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabaseParceiro as supabase } from "@/lib/supabase";
import {
  Wallet,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Banknote,
  ChevronDown,
  ChevronUp,
  CreditCard,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/parceiro/pagamentos")({
  head: () => ({ meta: [{ title: "Pagamentos — GARDEN PRIME" }] }),
  component: ParceiroPagamentos,
});

function ParceiroPagamentos() {
  const navigate = useNavigate();
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [itensMap, setItensMap] = useState<Record<string, any[]>>({});
  const [loadingItens, setLoadingItens] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate({ to: "/parceiro/login" });
        return;
      }

      const { data: vData } = await supabase
        .from("vendedores")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (!vData) {
        setLoading(false);
        return;
      }

      const { data: vendasData } = await supabase
        .from("vendas")
        .select("*, cliente:clientes(nome, telefone)")
        .eq("vendedor_id", vData.id)
        .neq("tipo", "DAV")
        .order("created_at", { ascending: false });

      if (vendasData) setVendas(vendasData);
      setLoading(false);
    };
    init();
  }, []);

  const toggleExpand = async (vendaId: string) => {
    if (expandedId === vendaId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(vendaId);
    if (itensMap[vendaId]) return;

    setLoadingItens(vendaId);
    const { data } = await supabase
      .from("vendas_itens")
      .select("*, produto:produtos(nome, emoji)")
      .eq("venda_id", vendaId);
    if (data) setItensMap((prev) => ({ ...prev, [vendaId]: data }));
    setLoadingItens(null);
  };

  // Cálculos de totais
  const totalAReceber = vendas
    .filter((v) => v.status_aprovacao === "Aprovada" && v.status_pagamento_comissao !== "Paga")
    .reduce((acc, v) => acc + (Number(v.valor_comissao) || 0), 0);

  const totalRecebido = vendas
    .filter((v) => v.status_pagamento_comissao === "Paga")
    .reduce((acc, v) => acc + (Number(v.valor_comissao) || 0), 0);

  const totalVendas = vendas
    .filter((v) => v.status_aprovacao === "Aprovada")
    .reduce((acc, v) => acc + (Number(v.valor_total) || 0), 0);

  const qtdAprovadas = vendas.filter((v) => v.status_aprovacao === "Aprovada").length;
  const qtdPendentes = vendas.filter((v) => v.status_aprovacao === "Pendente").length;
  const qtdRejeitadas = vendas.filter((v) => v.status_aprovacao === "Rejeitada").length;

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const fmtData = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Título */}
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-800 flex items-center gap-2">
          <Wallet className="h-6 w-6 text-brand" />
          Pagamentos
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Suas vendas, comissões e histórico financeiro.
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3">
        {/* A Receber */}
        <Card className="border-0 shadow-sm ring-1 ring-amber-400/30 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-700 mb-1">
              <Banknote className="h-4 w-4" />
              <span className="text-xs font-semibold">A Receber</span>
            </div>
            <p className="text-2xl font-extrabold font-display text-amber-600">
              {fmt(totalAReceber)}
            </p>
            <p className="text-[10px] text-amber-500 mt-0.5">comissões pendentes</p>
          </CardContent>
        </Card>

        {/* Já Recebido */}
        <Card className="border-0 shadow-sm ring-1 ring-emerald-400/30 bg-gradient-to-br from-emerald-50 to-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-700 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-semibold">Recebido</span>
            </div>
            <p className="text-2xl font-extrabold font-display text-emerald-600">
              {fmt(totalRecebido)}
            </p>
            <p className="text-[10px] text-emerald-500 mt-0.5">comissões pagas</p>
          </CardContent>
        </Card>

        {/* Volume de Vendas */}
        <Card className="border-0 shadow-sm ring-1 ring-brand/20 bg-gradient-to-br from-brand/5 to-brand/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-brand mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-semibold">Volume Vendido</span>
            </div>
            <p className="text-2xl font-extrabold font-display text-brand">{fmt(totalVendas)}</p>
            <p className="text-[10px] text-brand/60 mt-0.5">em vendas aprovadas</p>
          </CardContent>
        </Card>

        {/* Contadores */}
        <Card className="border-0 shadow-sm ring-1 ring-slate-900/5">
          <CardContent className="p-4 grid grid-cols-3 gap-1 text-center">
            <div>
              <p className="text-lg font-extrabold text-emerald-600">{qtdAprovadas}</p>
              <p className="text-[9px] text-muted-foreground font-medium leading-tight">
                Aprova-
                <br />
                das
              </p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-amber-500">{qtdPendentes}</p>
              <p className="text-[9px] text-muted-foreground font-medium leading-tight">
                Penden-
                <br />
                tes
              </p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-destructive">{qtdRejeitadas}</p>
              <p className="text-[9px] text-muted-foreground font-medium leading-tight">
                Rejei-
                <br />
                tadas
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Vendas */}
      <div>
        <h2 className="font-semibold text-base text-slate-800 mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-brand" />
          Histórico de Vendas
        </h2>

        {vendas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl ring-1 ring-slate-900/5 shadow-sm">
            <div className="text-4xl mb-3">📭</div>
            <p className="font-semibold text-slate-700">Nenhuma venda ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Suas vendas aparecerão aqui assim que você registrar.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {vendas.map((v) => {
              const isExpanded = expandedId === v.id;
              const statusAprov = v.status_aprovacao;
              const comissaoPaga = v.status_pagamento_comissao === "Paga";

              return (
                <div
                  key={v.id}
                  className="bg-white rounded-2xl ring-1 ring-slate-900/5 shadow-sm overflow-hidden"
                >
                  {/* Row principal */}
                  <button
                    className="w-full flex items-center justify-between p-4 text-left gap-3 active:bg-slate-50 transition-colors"
                    onClick={() => toggleExpand(v.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Status badge */}
                        {statusAprov === "Aprovada" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" /> Aprovada
                          </span>
                        ) : statusAprov === "Rejeitada" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                            <XCircle className="h-3 w-3" /> Rejeitada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                            <Clock className="h-3 w-3" /> Pendente
                          </span>
                        )}

                        {/* Comissão paga */}
                        {comissaoPaga && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                            💰 Comissão Paga
                          </span>
                        )}
                      </div>

                      <p className="font-semibold text-slate-800 mt-1 truncate">
                        {v.cliente?.nome || "Cliente não informado"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground">{fmtData(v.created_at)}</p>
                        {v.condicao_pagamento && (
                          <p className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {v.condicao_pagamento}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-slate-800">{fmt(Number(v.valor_total))}</p>
                      {Number(v.valor_comissao) > 0 && (
                        <p
                          className={`text-xs font-semibold mt-0.5 ${comissaoPaga ? "text-emerald-600" : "text-amber-600"}`}
                        >
                          + {fmt(Number(v.valor_comissao))}
                        </p>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground ml-auto mt-1" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto mt-1" />
                      )}
                    </div>
                  </button>

                  {/* Itens expandidos */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/70">
                      {loadingItens === v.id ? (
                        <div className="py-4 text-center text-xs text-muted-foreground">
                          Carregando itens...
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {(itensMap[v.id] || []).map((item: any) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between px-4 py-2.5"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{item.produto?.emoji || "📦"}</span>
                                <div>
                                  <p className="text-xs font-semibold text-slate-800">
                                    {item.produto?.nome || "Produto Excluído"}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {item.quantidade}x {fmt(Number(item.valor_unitario))}
                                  </p>
                                </div>
                              </div>
                              <p className="text-xs font-bold text-brand">
                                {fmt(Number(item.subtotal))}
                              </p>
                            </div>
                          ))}

                          {/* Totais do pedido */}
                          <div className="flex justify-between items-center px-4 py-3 bg-white">
                            <span className="text-xs font-semibold text-slate-600">
                              Total do Pedido
                            </span>
                            <span className="text-sm font-extrabold text-slate-900">
                              {fmt(Number(v.valor_total))}
                            </span>
                          </div>
                          {Number(v.valor_comissao) > 0 && (
                            <div
                              className={`flex justify-between items-center px-4 py-2 ${comissaoPaga ? "bg-emerald-50" : "bg-amber-50"}`}
                            >
                              <span
                                className={`text-xs font-semibold ${comissaoPaga ? "text-emerald-700" : "text-amber-700"}`}
                              >
                                {comissaoPaga ? "✅ Comissão Recebida" : "⏳ Comissão a Receber"}
                              </span>
                              <span
                                className={`text-sm font-extrabold ${comissaoPaga ? "text-emerald-700" : "text-amber-700"}`}
                              >
                                {fmt(Number(v.valor_comissao))}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
