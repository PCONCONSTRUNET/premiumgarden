import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, CheckCircle2, Clock, XCircle, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { supabaseParceiro as supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/parceiro/pagamentos")({
  head: () => ({ meta: [{ title: "Financeiro — Portal do Parceiro" }] }),
  component: ParceiroPagamentos,
});

function ParceiroPagamentos() {
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [comissaoPercentual, setComissaoPercentual] = useState(0.1); // 10% padrão, se não tiver no banco

  const fetchFinanceiro = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      if (!session) return;

      const { data: vendedor } = await supabase
        .from("vendedores")
        .select("id, tipo_comissao, valor_comissao")
        .eq("user_id", session.user.id)
        .single();

      if (vendedor) {
        setComissaoPercentual(Number(vendedor.valor_comissao) || 0);
        
        const { data: vendasData } = await supabase
          .from("vendas")
          .select("*, clientes(nome)")
          .eq("vendedor_id", vendedor.id)
          .neq("tipo", "DAV")
          .order("created_at", { ascending: false });

        if (vendasData) setVendas(vendasData);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceiro();
  }, []);

  const vendasFiltradas = vendas.filter(v => 
    v.clientes?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    v.id.includes(busca)
  );

  const totalAprovadas = vendas.filter(v => v.status_aprovacao === "Aprovada").reduce((acc, v) => acc + Number(v.valor_total), 0);
  const totalPendentes = vendas.filter(v => v.status_aprovacao === "Pendente").reduce((acc, v) => acc + Number(v.valor_total), 0);
  
  const comissaoPendente = vendas
    .filter(v => v.status_aprovacao === "Aprovada" && v.status_pagamento_comissao !== "Paga")
    .reduce((acc, v) => acc + (Number(v.valor_comissao) || 0), 0);
    
  const comissaoPaga = vendas
    .filter(v => v.status_aprovacao === "Aprovada" && v.status_pagamento_comissao === "Paga")
    .reduce((acc, v) => acc + (Number(v.valor_comissao) || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-800">Financeiro</h1>
        <p className="text-sm text-muted-foreground">Acompanhe suas vendas e comissões.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="col-span-2 sm:col-span-2 bg-gradient-to-br from-brand/10 to-brand/5 border-0 ring-1 ring-brand/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-brand mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-bold uppercase">Volume Vendas (Aprovadas)</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900">
              R$ {totalAprovadas.toFixed(2).replace(".", ",")}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              + R$ {totalPendentes.toFixed(2).replace(".", ",")} em análise
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-100 to-amber-50 border-0 ring-1 ring-amber-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-700 mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-bold uppercase">A Receber</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-amber-900">
              R$ {comissaoPendente.toFixed(2).replace(".", ",")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-100 to-emerald-50 border-0 ring-1 ring-emerald-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-700 mb-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-bold uppercase">Pagas</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-900">
              R$ {comissaoPaga.toFixed(2).replace(".", ",")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar venda por cliente…"
          className="h-12 pl-10 rounded-xl bg-white shadow-sm border-0 ring-1 ring-slate-900/5"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold font-display text-slate-800">Histórico de Pedidos</h2>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Carregando dados...</p>
        ) : vendasFiltradas.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum pedido encontrado.</p>
        ) : (
          <div className="space-y-3">
            {vendasFiltradas.map((venda) => (
              <div key={venda.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">
                      {venda.clientes?.nome || "Cliente Desconhecido"}
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(venda.created_at).toLocaleDateString()} às {new Date(venda.created_at).toLocaleTimeString().slice(0, 5)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brand">R$ {Number(venda.valor_total).toFixed(2).replace(".", ",")}</p>
                    {venda.status_aprovacao === "Aprovada" && (
                      <p className="text-[10px] font-bold text-emerald-600 mt-0.5 flex items-center justify-end gap-1">
                        💰 R$ {(Number(venda.valor_comissao) || 0).toFixed(2).replace(".", ",")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                  <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                    {venda.condicao_pagamento || "À vista"}
                  </Badge>
                  
                  {venda.status_aprovacao === "Pendente" && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                      <Clock className="h-3 w-3" /> Pendente
                    </Badge>
                  )}
                  {venda.status_aprovacao === "Aprovada" && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Aprovada
                    </Badge>
                  )}
                  {venda.status_aprovacao === "Aprovada" && Number(venda.valor_comissao) > 0 && (
                    <Badge 
                      variant="outline" 
                      className={venda.status_pagamento_comissao === "Paga" 
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300 gap-1"
                        : "bg-amber-100 text-amber-800 border-amber-300 gap-1"
                      }
                    >
                      {venda.status_pagamento_comissao === "Paga" 
                        ? <><CheckCircle2 className="h-3 w-3" /> Comissão Paga</>
                        : <><Clock className="h-3 w-3" /> Comissão Pendente</>
                      }
                    </Badge>
                  )}
                  {venda.status_aprovacao === "Rejeitada" && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
                      <XCircle className="h-3 w-3" /> Rejeitada
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
