import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Check, Plus, Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/contexts/ConfirmContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

export const Route = createFileRoute("/app/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — PREMIUM GARDEN" }] }),
  component: Financeiro,
});

function Financeiro() {
  const confirm = useConfirm();
  const [receitas, setReceitas] = useState<any[]>([]);
  const [despesas, setDespesas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [tipoLancamento, setTipoLancamento] = useState<"receita" | "despesa">("receita");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [statusLancamento, setStatusLancamento] = useState("Pendente");
  const [salvando, setSalvando] = useState(false);
  const [dateFilter, setDateFilter] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  const fetchFinanceiro = async () => {
    try {
      const { data: rec } = await supabase
        .from("contas_receber")
        .select("*, clientes(nome)")
        .order("created_at", { ascending: false });
      const { data: des } = await supabase
        .from("contas_pagar")
        .select("*")
        .order("created_at", { ascending: false });

      if (rec) setReceitas(rec);
      if (des) {
        // Filtrar comissões antigas que ficaram como "Pendente" para limpar a tela do usuário
        const despesasLimpas = des.filter(d => !(d.status === "Pendente" && d.descricao?.toLowerCase().includes("comissão parceiro")));
        setDespesas(despesasLimpas);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceiro();
  }, []);

  const [baixaModal, setBaixaModal] = useState<{
    open: boolean;
    lancamento: any;
    valor: string;
    loading: boolean;
  }>({ open: false, lancamento: null, valor: "", loading: false });

  const openBaixa = (r: any) => {
    setBaixaModal({
      open: true,
      lancamento: r,
      valor: String(r.valor),
      loading: false,
    });
  };

  const handleConfirmarBaixa = async () => {
    const { lancamento, valor } = baixaModal;
    const valorPago = Number(valor.replace(",", "."));
    const valorOriginal = Number(lancamento.valor);

    if (valorPago <= 0) return toast.error("O valor deve ser maior que zero.");
    if (valorPago > valorOriginal) return toast.error("O valor pago não pode ser maior que o valor do título.");

    setBaixaModal((prev) => ({ ...prev, loading: true }));
    try {
      const tabela = lancamento.tipo === "receber" ? "contas_receber" : "contas_pagar";
      const statusFinal = lancamento.tipo === "receber" ? "Recebido" : "Pago";
      const dataHoje = new Date().toISOString().split("T")[0];

      if (valorPago < valorOriginal) {
        // Pagamento parcial: subtrai do atual e cria um novo já baixado
        await supabase
          .from(tabela)
          .update({ valor: valorOriginal - valorPago })
          .eq("id", lancamento.id);

        const novoLancamento: any = {
          descricao: `${lancamento.descricao} (Parcial)`,
          valor: valorPago,
          vencimento: lancamento.vencimento,
          status: statusFinal,
          data_pagamento: dataHoje,
        };
        if (lancamento.venda_id) novoLancamento.venda_id = lancamento.venda_id;
        if (lancamento.cliente_id) novoLancamento.cliente_id = lancamento.cliente_id;

        await supabase.from(tabela).insert([novoLancamento]);
      } else {
        // Pagamento total
        await supabase
          .from(tabela)
          .update({
            status: statusFinal,
            data_pagamento: dataHoje,
          })
          .eq("id", lancamento.id);
      }

      toast.success("Baixa realizada com sucesso!");
      setBaixaModal({ open: false, lancamento: null, valor: "", loading: false });
      fetchFinanceiro();
    } catch (err) {
      toast.error("Erro ao dar baixa.");
      setBaixaModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleExcluir = async (id: string, tipo: "receber" | "pagar") => {
    if (
      !(await confirm({
        description: "Deseja excluir este lançamento permanentemente?",
        variant: "destructive",
      }))
    )
      return;
    try {
      const tabela = tipo === "receber" ? "contas_receber" : "contas_pagar";
      await supabase.from(tabela).delete().eq("id", id);
      fetchFinanceiro();
    } catch (err) {
      toast.error("Erro ao excluir lançamento.");
    }
  };

  const handleSalvarLancamento = async () => {
    if (!descricao || !valor || !vencimento) return toast.error("Preencha todos os campos.");
    setSalvando(true);
    try {
      const tabela = tipoLancamento === "receita" ? "contas_receber" : "contas_pagar";
      await supabase.from(tabela).insert([
        {
          descricao,
          valor: Number(valor.replace(",", ".")),
          vencimento,
          status: statusLancamento,
          data_pagamento:
            statusLancamento !== "Pendente" ? new Date().toISOString().split("T")[0] : null,
        },
      ]);
      setOpenModal(false);
      setDescricao("");
      setValor("");
      setVencimento("");
      setStatusLancamento("Pendente");
      fetchFinanceiro();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar lançamento.");
    } finally {
      setSalvando(false);
    }
  };

  const openLancamento = (tipo: "receita" | "despesa") => {
    setTipoLancamento(tipo);
    setStatusLancamento("Pendente");
    setOpenModal(true);
  };

  const lancamentosAll = [
    ...receitas.map((r) => ({ ...r, tipo: "receber", neg: false, c: "Receita" })),
    ...despesas.map((d) => ({ ...d, tipo: "pagar", neg: true, c: "Despesa" })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const lancamentos = lancamentosAll.filter((r) => {
    if (!dateFilter?.from || !dateFilter?.to) return true;
    const d = new Date(r.created_at).getTime();
    const to = new Date(dateFilter.to);
    to.setHours(23, 59, 59, 999);
    return d >= dateFilter.from.getTime() && d <= to.getTime();
  });

  const receitasFiltradas = receitas.filter((r) => {
    if (!dateFilter?.from || !dateFilter?.to) return true;
    const d = new Date(r.created_at).getTime();
    const to = new Date(dateFilter.to);
    to.setHours(23, 59, 59, 999);
    return d >= dateFilter.from.getTime() && d <= to.getTime();
  });

  const despesasFiltradas = despesas.filter((d) => {
    if (!dateFilter?.from || !dateFilter?.to) return true;
    const data = new Date(d.created_at).getTime();
    const to = new Date(dateFilter.to);
    to.setHours(23, 59, 59, 999);
    return data >= dateFilter.from.getTime() && data <= to.getTime();
  });

  // Calcular totais reais para os cards (somente os recebidos/pagos do período)
  const totalReceitas = receitasFiltradas
    .filter((r) => r.status === "Recebido" || r.status === "Pago")
    .reduce((acc, curr) => acc + Number(curr.valor), 0);
  const totalDespesas = despesasFiltradas
    .filter((d) => d.status === "Pago" || d.status === "Pago")
    .reduce((acc, curr) => acc + Number(curr.valor), 0);
  const lucro = totalReceitas - totalDespesas;
  // Caixa contínuo
  const totalAbsolutoReceitas = receitas
    .filter((r) => r.status === "Recebido" || r.status === "Pago")
    .reduce((acc, curr) => acc + Number(curr.valor), 0);
  const totalAbsolutoDespesas = despesas
    .filter((d) => d.status === "Pago")
    .reduce((acc, curr) => acc + Number(curr.valor), 0);
  const caixa = totalAbsolutoReceitas - totalAbsolutoDespesas;

  const pendenteReceber = receitasFiltradas
    .filter((r) => r.status === "Pendente")
    .reduce((acc, curr) => acc + Number(curr.valor), 0);
  const pendentePagar = despesasFiltradas
    .filter((d) => d.status === "Pendente")
    .reduce((acc, curr) => acc + Number(curr.valor), 0);

  // Calcular dados do gráfico dividindo o período selecionado em 4 segmentos
  const rangeDiff =
    dateFilter?.to && dateFilter?.from
      ? dateFilter.to.getTime() - dateFilter.from.getTime()
      : 30 * 24 * 60 * 60 * 1000;
  const segmentDuration = Math.max(rangeDiff / 4, 24 * 60 * 60 * 1000); // Mínimo 1 dia por segmento
  const baseTime = dateFilter?.to ? dateFilter.to.getTime() : Date.now();

  const flow = Array.from({ length: 4 }).map((_, i) => {
    const end = new Date(baseTime - (3 - i) * segmentDuration);
    const start = new Date(end.getTime() - segmentDuration);

    const recSeg = receitas.filter(
      (r) => new Date(r.created_at) >= start && new Date(r.created_at) < end,
    );
    const desSeg = despesas.filter(
      (d) => new Date(d.created_at) >= start && new Date(d.created_at) < end,
    );

    return {
      d: `Per. ${i + 1}`,
      e: recSeg.reduce((sum, r) => sum + Number(r.valor), 0),
      s: desSeg.reduce((sum, d) => sum + Number(d.valor), 0),
    };
  });

  const renderDatePicker = () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`justify-start text-left font-normal ${!dateFilter?.from ? "text-muted-foreground" : ""}`}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateFilter?.from ? (
            dateFilter.to ? (
              `${dateFilter.from.toLocaleDateString("pt-BR")} - ${dateFilter.to.toLocaleDateString("pt-BR")}`
            ) : (
              dateFilter.from.toLocaleDateString("pt-BR")
            )
          ) : (
            <span>Selecione um período</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={dateFilter?.from}
          selected={{ from: dateFilter?.from, to: dateFilter?.to }}
          onSelect={(range: any) => setDateFilter(range || { from: undefined, to: undefined })}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );

  return (
    <>
      <PageHeader
        title="Financeiro"
        subtitle="Caixa, fluxo, contas a pagar e a receber"
        actions={
          <div className="flex gap-2 items-center flex-wrap">
            {renderDatePicker()}
            <Button
              variant="outline"
              className="text-success border-success/30 hover:bg-success/10"
              onClick={() => openLancamento("receita")}
            >
              <TrendingUp className="mr-2 h-4 w-4" /> Nova Receita
            </Button>
            <Button
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => openLancamento("despesa")}
            >
              <TrendingDown className="mr-2 h-4 w-4" /> Nova Despesa
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          {
            l: "Caixa atual",
            v: `R$ ${caixa.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            c: "text-primary",
            bg: "bg-primary/10",
            i: Wallet,
          },
          {
            l: "Total Recebido (Mês)",
            v: `R$ ${totalReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            sub: `+ R$ ${pendenteReceber.toFixed(2)} previstos`,
            c: "text-success",
            bg: "bg-success/15",
            i: TrendingUp,
          },
          {
            l: "Total Pago (Mês)",
            v: `R$ ${totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            sub: `+ R$ ${pendentePagar.toFixed(2)} previstos`,
            c: "text-destructive",
            bg: "bg-destructive/10",
            i: TrendingDown,
          },
          {
            l: "Lucro Líquido",
            v: `R$ ${lucro.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            c: lucro >= 0 ? "text-info" : "text-destructive",
            bg: "bg-info/10",
            i: PiggyBank,
          },
        ].map((k) => (
          <Card key={k.l} className="shadow-card">
            <CardContent className="p-5">
              <div className={`grid h-10 w-10 place-items-center rounded-lg ${k.bg}`}>
                <k.i className={`h-5 w-5 ${k.c}`} />
              </div>
              <p className="mt-4 text-sm font-medium text-muted-foreground">{k.l}</p>
              <p className={`mt-1 font-display text-2xl font-bold ${k.c}`}>{k.v}</p>
              {k.sub && <p className="mt-1 text-xs text-muted-foreground">{k.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-800">Lançamentos</h2>
          </div>
          {renderDatePicker()}
        </div>
        <div className="flex flex-col gap-3 max-h-[650px] overflow-y-auto pr-2 pb-2 scrollbar-thin scrollbar-thumb-slate-300">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : lancamentos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-white rounded-xl border border-slate-100 shadow-sm">
              Nenhum lançamento encontrado.
            </div>
          ) : (
            lancamentos.map((r, i) => {
              let displayDescricao = r.descricao || "Lançamento Sem Nome";
              if (!r.neg && r.clientes?.nome) {
                displayDescricao = displayDescricao.replace(` - ${r.clientes.nome}`, "");
              }
              const hidePrefix = displayDescricao.toLowerCase().startsWith("pedido") || 
                                 displayDescricao.toLowerCase().startsWith("despesa") || 
                                 displayDescricao.toLowerCase().startsWith("nf:") ||
                                 displayDescricao.toLowerCase().startsWith("comissão");

              // Extrai nome do vendedor de entradas de comissão (ex: "Comissão - NOME - Pedido #...")
              let displayCliente = r.clientes?.nome;
              if (!displayCliente && r.neg && displayDescricao.toLowerCase().startsWith("comissão")) {
                const parts = displayDescricao.split(" - ");
                if (parts.length >= 2) {
                  displayCliente = parts[1]; // nome do vendedor
                }
              }

              return (
              <div key={i} className="bg-white rounded-2xl border border-slate-300 p-5 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm hover:shadow-md transition-shadow gap-4">
                <div className="flex-1">
                  <div className="font-semibold text-slate-800 text-sm mb-1">
                    <span className="text-slate-500 font-normal">{r.neg && displayDescricao.toLowerCase().startsWith("comissão") ? "Vendedor:" : "Cliente:"}</span>{" "}
                    {displayCliente || (r.neg ? "Despesa Geral" : "Não informado")}
                  </div>
                  <div className="font-medium text-slate-700 text-sm mb-2">
                    {!hidePrefix && (
                      <span className="text-slate-500 font-normal">{r.neg ? "Despesa: " : "Pedido: "}</span>
                    )}
                    {displayDescricao}
                  </div>
                  <div className="text-xs text-slate-500">
                    Emissão: {new Date(r.created_at).toLocaleDateString("pt-BR")} | Venc.: {new Date(r.vencimento).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div className="sm:text-right flex flex-col sm:items-end items-start w-full sm:w-auto gap-3">
                  <div className="flex items-center gap-3 justify-between w-full sm:w-auto sm:justify-end">
                    <div className={`font-bold text-lg ${r.neg ? "text-destructive" : "text-success"}`}>
                      {r.neg ? "-" : "+"} {Number(r.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`font-medium ${
                        r.status === "Recebido" || r.status === "Pago"
                          ? "border-success text-success bg-success/10"
                          : "border-warning text-warning bg-warning/10"
                      }`}
                    >
                      {r.status === "Recebido" || r.status === "Pago" ? (
                        <Check className="w-3 h-3 mr-1" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-warning mr-1.5" />
                      )}
                      {r.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {r.status === "Pendente" && (
                      <Button
                        onClick={() => openBaixa(r)}
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 text-primary border-primary/20 hover:bg-primary/10 hover:text-primary rounded-full"
                        title="Dar baixa"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      onClick={() => handleExcluir(r.id, r.tipo)}
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive rounded-full"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              );
            })
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Fluxo de caixa</CardTitle>
            <CardDescription>Últimas 4 semanas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={flow}>
                <defs>
                  <linearGradient id="fe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="d"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `R$ ${v / 1000}k`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12 }}
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                />
                <Area
                  type="monotone"
                  dataKey="e"
                  stroke="#22C55E"
                  strokeWidth={2.5}
                  fill="url(#fe)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Receitas × Despesas</CardTitle>
            <CardDescription>Evolução por semana</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={flow}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="d"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `R$ ${v / 1000}k`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12 }}
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                />
                <Bar dataKey="e" name="Receitas" fill="#22C55E" radius={[6, 6, 0, 0]} />
                <Bar dataKey="s" name="Despesas" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  tipoLancamento === "receita"
                    ? "bg-success/15 text-success"
                    : "bg-destructive/15 text-destructive"
                }`}
              >
                {tipoLancamento === "receita" ? (
                  <ArrowUpCircle className="w-6 h-6" />
                ) : (
                  <ArrowDownCircle className="w-6 h-6" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl font-display font-bold">
                  {tipoLancamento === "receita" ? "Nova Receita" : "Nova Despesa"}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {tipoLancamento === "receita"
                    ? "Adicione uma nova entrada ao seu caixa."
                    : "Registre uma nova saída ou gasto."}
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Descrição</Label>
              <Input
                placeholder="Ex: Conta de Luz, Aluguel..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="h-10 border-slate-300 focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Status</Label>
              <Select value={statusLancamento} onValueChange={setStatusLancamento}>
                <SelectTrigger className="h-10 border-slate-300 focus-visible:ring-primary">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">⏳ Pendente</SelectItem>
                  {tipoLancamento === "receita" ? (
                    <SelectItem value="Recebido">✅ Recebido (Pago ao sistema)</SelectItem>
                  ) : (
                    <SelectItem value="Pago">✅ Pago (Despesa quitada)</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Valor (R$)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-muted-foreground font-medium">R$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    className="h-10 pl-9 border-slate-300 focus-visible:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Vencimento</Label>
                <Input
                  type="date"
                  value={vencimento}
                  onChange={(e) => setVencimento(e.target.value)}
                  className="h-10 border-slate-300 focus-visible:ring-primary"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="border-t pt-4 mt-2">
            <Button variant="outline" onClick={() => setOpenModal(false)} className="h-10">
              Cancelar
            </Button>
            <Button
              onClick={handleSalvarLancamento}
              disabled={salvando}
              className={`h-10 ${
                tipoLancamento === "receita"
                  ? "bg-success hover:bg-success/90 text-white"
                  : "bg-destructive hover:bg-destructive/90 text-white"
              }`}
            >
              {salvando ? "Salvando..." : "Salvar Lançamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={baixaModal.open} onOpenChange={(val) => !val && setBaixaModal({ open: false, lancamento: null, valor: "", loading: false })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold">Dar Baixa</DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Informe o valor que está sendo pago/recebido. Se for menor que o total, um título parcial será gerado e o original continuará pendente com a diferença.
            </p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2 bg-slate-50 p-3 rounded-lg border">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Valor Total do Título</span>
              <p className="text-lg font-bold text-slate-800">
                R$ {Number(baixaModal.lancamento?.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Valor a Baixar (R$)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-muted-foreground font-medium">R$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={baixaModal.lancamento?.valor}
                  value={baixaModal.valor}
                  onChange={(e) => setBaixaModal({ ...baixaModal, valor: e.target.value })}
                  className="h-10 pl-9 border-slate-300 focus-visible:ring-primary"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="border-t pt-4 mt-2">
            <Button variant="outline" onClick={() => setBaixaModal({ open: false, lancamento: null, valor: "", loading: false })} className="h-10">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarBaixa}
              disabled={baixaModal.loading}
              className="h-10 bg-success hover:bg-success/90 text-white"
            >
              {baixaModal.loading ? "Processando..." : "Confirmar Baixa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
