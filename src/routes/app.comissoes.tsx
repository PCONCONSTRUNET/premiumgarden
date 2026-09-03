import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
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
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Search, DollarSign, Clock, CheckCircle, TrendingUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export const Route = createFileRoute("/app/comissoes")({
  head: () => ({ meta: [{ title: "Comissões — PREMIUM GARDEN" }] }),
  component: Comissoes,
});

function Comissoes() {
  const [comissoes, setComissoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroTempo, setFiltroTempo] = useState("mensal");

  useEffect(() => {
    async function fetchComissoes() {
      try {
        const { data, error } = await supabase
          .from("vendas")
          .select(`
            id,
            numero,
            valor_total,
            valor_comissao,
            status_pagamento_comissao,
            created_at,
            vendedores (
              nome,
              tipo_comissao,
              valor_comissao
            ),
            clientes (
              nome
            )
          `)
          .gt("valor_comissao", 0)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setComissoes(data || []);
      } catch (err) {
        console.error("Erro ao carregar comissões:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchComissoes();
  }, []);

  const getOrderNumber = (c: any) => c.numero || c.id.substring(0, 8).toUpperCase();

  const handlePagarComissao = async (c: any) => {
    if (!window.confirm("Confirmar pagamento da comissão? Isso irá gerar uma despesa paga no financeiro.")) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      
      const { error: errorVenda } = await supabase
        .from("vendas")
        .update({ status_pagamento_comissao: "Paga" })
        .eq("id", c.id);
      if (errorVenda) throw errorVenda;

      const { error: errorConta, data: contaInserida } = await supabase
        .from("contas_pagar")
        .insert([{
          descricao: `Comissão - ${c.vendedores?.nome || "Vendedor"} - Pedido #${getOrderNumber(c)}`,
          valor: c.valor_comissao,
          vencimento: today,
          status: "Pago",
          data_pagamento: today
        }])
        .select();
      if (errorConta) throw errorConta;

      toast.success("Comissão paga e registrada no financeiro!");
      setComissoes((prev) => prev.map((v) => v.id === c.id ? { ...v, status_pagamento_comissao: "Paga", _financeiro_ok: true } : v));
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao registrar pagamento: " + err.message);
    }
  };

  // Para comissões já pagas mas sem lançamento no financeiro
  const handleLançarNoFinanceiro = async (c: any) => {
    if (!window.confirm("Lançar esta comissão como despesa paga no financeiro?")) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const { error } = await supabase
        .from("contas_pagar")
        .insert([{
          descricao: `Comissão - ${c.vendedores?.nome || "Vendedor"} - Pedido #${getOrderNumber(c)}`,
          valor: c.valor_comissao,
          vencimento: today,
          status: "Pago",
          data_pagamento: today
        }]);
      if (error) throw error;
      toast.success("Comissão lançada no financeiro com sucesso!");
      setComissoes((prev) => prev.map((v) => v.id === c.id ? { ...v, _financeiro_ok: true } : v));
    } catch (err: any) {
      console.error(err);
      toast.error("Erro: " + err.message);
    }
  };

  const filteredComissoes = useMemo(() => {
    return comissoes.filter((c) => {
      const matchBusca =
        !busca ||
        c.vendedores?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        getOrderNumber(c).toLowerCase().includes(busca.toLowerCase());

      const dataVenda = new Date(c.created_at);
      const hoje = new Date();
      let matchTempo = true;

      if (filtroTempo === "hoje") {
        matchTempo = dataVenda.toDateString() === hoje.toDateString();
      } else if (filtroTempo === "semanal") {
        const umaSemanaAtras = new Date();
        umaSemanaAtras.setDate(hoje.getDate() - 7);
        matchTempo = dataVenda >= umaSemanaAtras;
      } else if (filtroTempo === "mensal") {
        const umMesAtras = new Date();
        umMesAtras.setMonth(hoje.getMonth() - 1);
        matchTempo = dataVenda >= umMesAtras;
      }

      return matchBusca && matchTempo;
    });
  }, [comissoes, busca, filtroTempo]);

  const totalPago = filteredComissoes
    .filter((c) => c.status_pagamento_comissao === "Paga")
    .reduce((acc, c) => acc + Number(c.valor_comissao), 0);

  const totalPendente = filteredComissoes
    .filter((c) => c.status_pagamento_comissao !== "Paga")
    .reduce((acc, c) => acc + Number(c.valor_comissao), 0);

  const totalGeral = totalPago + totalPendente;

  const chartData = useMemo(() => {
    // Agrupar por data (dia) para o gráfico
    const agrupado: Record<string, { data: string; Pendente: number; Paga: number }> = {};
    
    filteredComissoes.forEach((c) => {
      const dataStr = new Date(c.created_at).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' });
      if (!agrupado[dataStr]) {
        agrupado[dataStr] = { data: dataStr, Pendente: 0, Paga: 0 };
      }
      
      const val = Number(c.valor_comissao) || 0;
      if (c.status_pagamento_comissao === "Paga") {
        agrupado[dataStr].Paga += val;
      } else {
        agrupado[dataStr].Pendente += val;
      }
    });

    return Object.values(agrupado).sort((a, b) => {
      const [d1, m1] = a.data.split("/");
      const [d2, m2] = b.data.split("/");
      return new Date(2026, Number(m1)-1, Number(d1)).getTime() - new Date(2026, Number(m2)-1, Number(d2)).getTime();
    });
  }, [filteredComissoes]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader title="Comissões" />
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por parceiro ou pedido..."
              className="pl-9 bg-white"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <Select value={filtroTempo} onValueChange={setFiltroTempo}>
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="semanal">Últimos 7 dias</SelectItem>
              <SelectItem value="mensal">Últimos 30 dias</SelectItem>
              <SelectItem value="tudo">Todo o período</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-sm border-emerald-100 bg-emerald-50/30">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Comissões Pagas</p>
              <h3 className="text-2xl font-bold text-emerald-700">
                {totalPago.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-amber-100 bg-amber-50/30">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Comissões Pendentes</p>
              <h3 className="text-2xl font-bold text-amber-700">
                {totalPendente.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-blue-100 bg-blue-50/30">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Gerado</p>
              <h3 className="text-2xl font-bold text-blue-700">
                {totalGeral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico removido conforme solicitado */}

      {/* Histórico em Cards */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-slate-700" />
          <h2 className="text-lg font-semibold text-slate-800">Últimas Vendas</h2>
        </div>
        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando comissões...</div>
          ) : filteredComissoes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-white rounded-xl border border-slate-100 shadow-sm">
              Nenhuma comissão encontrada para estes filtros.
            </div>
          ) : (
            filteredComissoes.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm hover:shadow-md transition-shadow gap-4">
                <div>
                  <h3 className="font-semibold text-slate-700 uppercase text-sm mb-1">
                    {c.clientes?.nome || "CLIENTE NÃO INFORMADO"}
                  </h3>
                  <div className="font-bold text-lg text-slate-900">
                    {Number(c.valor_total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-xs text-slate-500">
                      {new Date(c.created_at).toLocaleDateString("pt-BR")}
                    </span>
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-sm uppercase tracking-tight">
                      Vendedor: {c.vendedores?.nome || "Não informado"}
                    </span>
                  </div>
                </div>
                <div className="sm:text-right flex flex-row justify-between sm:flex-col items-center sm:items-end w-full sm:w-auto gap-2">
                  <div className="flex gap-2 items-center flex-wrap justify-end">
                    {c.status_pagamento_comissao !== "Paga" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        onClick={() => handlePagarComissao(c)}
                      >
                        Pagar
                      </Button>
                    )}
                    {c.status_pagamento_comissao === "Paga" && !c._financeiro_ok && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                        onClick={() => handleLançarNoFinanceiro(c)}
                        title="Criar lançamento de despesa no financeiro para esta comissão"
                      >
                        Lançar no Financeiro
                      </Button>
                    )}
                    <Badge 
                      variant="outline" 
                      className={
                        c.status_pagamento_comissao === "Paga" 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100 font-medium" 
                          : "bg-amber-50 text-amber-600 border-amber-100 font-medium"
                      }
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {c.status_pagamento_comissao === "Paga" ? "Paga" : "Pendente"}
                    </Badge>
                  </div>
                  <div className="text-emerald-600 text-xs font-semibold mt-1 sm:mt-0">
                    + {Number(c.valor_comissao).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} comissão
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
