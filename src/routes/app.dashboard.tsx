import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Target,
  Users,
  MoreVertical,
  ArrowUpRight,
  BarChart2,
  Plus,
  Info,
} from "lucide-react";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [{ title: "Indicadores — PREMIUM GARDEN" }] }),
  component: Dashboard,
});

const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];
const ANOS = [2023, 2024, 2025, 2026];
const REPORT_SECTION_CLASS =
  "rounded-md border-2 border-primary/70 bg-card p-5 shadow-sm transition-shadow hover:shadow-md";

// ── Donut simples ────────────────────────────────────────────
function DonutCard({
  title,
  total,
  label,
  segments,
  detailLabel,
  detailTo,
}: {
  title: string;
  total: number;
  label: string;
  segments: { name: string; value: number; color: string }[];
  detailLabel: string;
  detailTo: string;
}) {
  const now = new Date();
  const period = `${MESES[now.getMonth()].toUpperCase().slice(0,3)} DE ${now.getFullYear()}`;

  return (
    <Card className="border border-slate-300 shadow-sm flex flex-col rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <Info className="h-3.5 w-3.5" />
          {title}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">{period}</span>
          <button className="text-muted-foreground hover:text-foreground">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-4 px-4 flex-1">
        <div className="relative flex items-center justify-center my-3">
          <PieChart width={140} height={140}>
            <Pie
              data={total === 0 ? [{ value: 1, color: "#e2e8f0" }] : segments}
              dataKey="value"
              innerRadius={48}
              outerRadius={68}
              paddingAngle={total === 0 ? 0 : 2}
              startAngle={90}
              endAngle={-270}
            >
              {(total === 0 ? [{ color: "#e2e8f0" }] : segments).map((s, i) => (
                <Cell key={i} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-foreground">{total}</span>
            <span className="text-[10px] text-muted-foreground text-center leading-tight max-w-[60px]">{label}</span>
          </div>
        </div>
        <ul className="w-full space-y-1 mb-4">
          {segments.map((s) => (
            <li key={s.name} className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                {s.name}
              </span>
              <span className="font-medium text-foreground">{s.value}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ── Dashboard principal ──────────────────────────────────────
function Dashboard() {
  const now = new Date();
  const [tab, setTab] = useState<"paineis" | "relatorios">("paineis");
  
  const [dateFilter, setDateFilter] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: new Date()
  });

  const [vendedores, setVendedores] = useState<any[]>([]);
  const [vendedor, setVendedor] = useState("todos");

  // KPIs
  const [vendidoMes, setVendidoMes] = useState(0);
  const [objetivoMes, setObjetivoMes] = useState(0);
  const [metaModalOpen, setMetaModalOpen] = useState(false);
  const [metaInput, setMetaInput] = useState("");
  const [evolucao, setEvolucao] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Clientes
  const [carteira, setCarteira] = useState({ ativos: 0, inativosRecentes: 0, inativosAntigos: 0, prospectos: 0 });
  const [positivados, setPositivados] = useState({ novos: 0, ativos: 0, inativosRecentes: 0, inativosAntigos: 0 });
  const [curvaABC, setCurvaABC] = useState({ a: 0, b: 0, c: 0 });

  const fromD = dateFilter?.from ? new Date(dateFilter.from) : new Date(now.getFullYear(), now.getMonth(), 1);
  const toD = dateFilter?.to ? new Date(dateFilter.to) : new Date();
  const diffDays = Math.max(1, Math.ceil(Math.abs(toD.getTime() - fromD.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  
  const metaProporcional = (objetivoMes / 30) * diffDays;
  const necessarioPorDia = metaProporcional > vendidoMes
    ? (metaProporcional - vendidoMes) / diffDays
    : 0;

  const fmt = (v: number) =>
    `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  useEffect(() => {
    supabase.from("vendedores").select("id, nome").then(({ data }) => {
      setVendedores(data || []);
    });
  }, []);

  useEffect(() => {
    async function load() {
      const fD = dateFilter?.from ? new Date(dateFilter.from) : new Date(now.getFullYear(), now.getMonth(), 1);
      const tD = dateFilter?.to ? new Date(dateFilter.to) : new Date();
      fD.setHours(0, 0, 0, 0);
      tD.setHours(23, 59, 59, 999);

      const inicio = fD.toISOString();
      const fim = tD.toISOString();

      let query = supabase
        .from("vendas")
        .select("valor_total, created_at, vendedor_id, cliente_id")
        .gte("created_at", inicio)
        .lte("created_at", fim)
        .neq("status", "Cancelada");

      if (vendedor !== "todos") query = query.eq("vendedor_id", vendedor);

      const { data: vendasMes, error: errVendas } = await query;
      if (errVendas) console.error("Erro ao buscar vendas:", errVendas);

      const totalMes = (vendasMes || []).reduce(
        (acc, v) => acc + Number(v.valor_total || 0), 0
      );
      setVendidoMes(totalMes);

      // Usar a meta do mês da data inicial do filtro
      const anoNum = fD.getFullYear();
      const mesNum = fD.getMonth() + 1;
      const metaSalva = Number(localStorage.getItem(`meta_${anoNum}_${mesNum}`)) || 0;
      setObjetivoMes(metaSalva);

      // Evolução diária do intervalo
      const diffD = Math.max(1, Math.ceil(Math.abs(tD.getTime() - fD.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      const metaProgressoFinal = (metaSalva / 30) * diffD; // Proporcional ao intervalo

      const porDia: Record<string, number> = {};
      (vendasMes || []).forEach((v) => {
        const d = new Date(v.created_at);
        const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        porDia[k] = (porDia[k] || 0) + Number(v.valor_total || v.total || 0);
      });
      
      const evolData = [];
      let somaAcumulada = 0;
      for (let i = 0; i < diffD; i++) {
        const curr = new Date(fD);
        curr.setDate(curr.getDate() + i);
        const k = `${curr.getFullYear()}-${curr.getMonth()}-${curr.getDate()}`;
        const val = porDia[k] || 0;
        somaAcumulada += val;
        
        evolData.push({
          diaStr: `${curr.getDate().toString().padStart(2, '0')}/${(curr.getMonth()+1).toString().padStart(2, '0')}`,
          vendas: somaAcumulada,
          objetivo: metaProgressoFinal > 0 ? (metaProgressoFinal / diffD) * (i + 1) : 0,
        });
      }
      setEvolucao(evolData);

      // Clientes
      const { data: clientes } = await supabase
        .from("clientes")
        .select("id, status, created_at");

      const { data: vendasClientes } = await supabase
        .from("vendas")
        .select("cliente_id, created_at")
        .gte("created_at", inicio)
        .lt("created_at", fim)
        .neq("status", "Cancelada");

      const clientesComVendaMes = new Set((vendasClientes || []).map((v) => v.cliente_id));

      const ativos = (clientes || []).filter((c) => c.status === "Ativo" || !c.status).length;
      const inativosRecentes = (clientes || []).filter((c) => c.status === "Inativo Recente").length;
      const inativosAntigos = (clientes || []).filter((c) => c.status === "Inativo").length;
      const prospectos = (clientes || []).filter((c) => c.status === "Prospecto").length;
      setCarteira({ ativos, inativosRecentes, inativosAntigos, prospectos });

      // Positivados no mês (clientes que compraram)
      const positivadosIds = clientesComVendaMes.size;
      setPositivados({
        novos: 0,
        ativos: positivadosIds,
        inativosRecentes: 0,
        inativosAntigos: 0,
      });

      // Curva ABC simplificada por receita
      const clienteReceita: Record<string, number> = {};
      (vendasClientes || []).forEach((v) => {
        // Só conta presença
        if (v.cliente_id) clienteReceita[v.cliente_id] = (clienteReceita[v.cliente_id] || 0) + 1;
      });
      const sorted = Object.values(clienteReceita).sort((a, b) => b - a);
      const total = sorted.length;
      const curA = Math.ceil(total * 0.2);
      const curB = Math.ceil(total * 0.3);
      setCurvaABC({ a: curA, b: curB, c: Math.max(0, total - curA - curB) });
    }
    load();
  }, [dateFilter, vendedor]);

  const setPresetToday = () => setDateFilter({ from: new Date(), to: new Date() });
  const setPresetWeek = () => {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay());
    setDateFilter({ from: start, to: new Date() });
  };
  const setPresetMonth = () => {
    setDateFilter({ from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date() });
  };

  const renderDatePicker = () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={`justify-start text-left font-normal border-brand/30 hover:bg-brand/5 ${!dateFilter?.from ? "text-muted-foreground" : ""}`}>
          <CalendarIcon className="mr-2 h-4 w-4 text-brand" />
          {dateFilter?.from ? (
            dateFilter.to ? (
              `${dateFilter.from.toLocaleDateString("pt-BR")} - ${dateFilter.to.toLocaleDateString("pt-BR")}`
            ) : (
              dateFilter.from.toLocaleDateString("pt-BR")
            )
          ) : (
            <span>Período...</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col gap-1 p-2 bg-slate-50 border-b">
          <p className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1">Atalhos</p>
          <div className="grid grid-cols-3 gap-1">
            <Button size="sm" variant="outline" onClick={setPresetToday}>Hoje</Button>
            <Button size="sm" variant="outline" onClick={setPresetWeek}>Semana</Button>
            <Button size="sm" variant="outline" onClick={setPresetMonth}>Mês</Button>
          </div>
        </div>
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

  const totalCarteira = carteira.ativos + carteira.inativosRecentes + carteira.inativosAntigos + carteira.prospectos;
  const totalPositivados = positivados.novos + positivados.ativos + positivados.inativosRecentes + positivados.inativosAntigos;
  const totalCurva = curvaABC.a + curvaABC.b + curvaABC.c;

  return (
    <div className="space-y-0">
      {/* Tabs */}
      <div className="flex items-center border-b border-border mb-6">
        {(["paineis", "relatorios"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === t
                ? "border-brand text-brand"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "paineis" ? <BarChart2 className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
            {t === "paineis" ? "PAINÉIS" : "RELATÓRIOS"}
          </button>
        ))}
      </div>

      {tab === "paineis" && (
        <>
          {/* Cabeçalho painel */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-xl font-bold flex items-center gap-1">
              Painel PREMIUM GARDEN
            </h1>
            <Link to="/app/vendas">
              <Button className="bg-gradient-brand text-primary-foreground text-xs h-8 px-3">
                <Plus className="h-3.5 w-3.5 mr-1" /> Novo Pedido
              </Button>
            </Link>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-muted/40 rounded-xl border border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filtro:</span>
            {renderDatePicker()}
            
            <Select value={vendedor} onValueChange={setVendedor}>
              <SelectTrigger className="h-9 w-52 text-sm">
                <SelectValue placeholder="Todos os vendedores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os vendedores</SelectItem>
                {vendedores.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Evolução de Venda + KPIs */}
          <Card className="border border-slate-300 shadow-sm mb-6 rounded-xl">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                <Info className="h-4 w-4" />
                Evolução de Venda
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {dateFilter.from ? dateFilter.from.toLocaleDateString("pt-BR") : ""} a {dateFilter.to ? dateFilter.to.toLocaleDateString("pt-BR") : ""}
                </Badge>
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
            <CardContent className="p-0">
              <div className="flex flex-col lg:flex-row">
                {/* Gráfico */}
                <div className="flex-1 px-4 pb-4">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={evolucao} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="diaStr"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => v === 0 ? "0" : `${(v / 1000).toFixed(0)}k`}
                        width={36}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
                        formatter={(v: any) => [`R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, ""]}
                        labelFormatter={(l) => `Dia ${l}`}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(v) => v === "vendas" ? "Vendas no mês" : "Objetivo"}
                        wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="vendas"
                        stroke="#22c55e"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="objetivo"
                        stroke="#94a3b8"
                        strokeWidth={1.5}
                        strokeDasharray="5 4"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* KPIs lateral */}
                <div className="lg:w-56 border-t lg:border-t-0 lg:border-l border-border flex flex-col divide-y divide-border">
                  <div className="p-4 flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Vendido (Período)</span>
                    <span className="text-xl font-bold text-foreground">{fmt(vendidoMes)}</span>
                    <Button size="sm" variant="outline" className="mt-1 h-7 text-xs self-start border-brand/30 text-brand hover:bg-brand/5">
                      <ArrowUpRight className="h-3.5 w-3.5 mr-1" /> Comparar
                    </Button>
                  </div>
                  <div className="p-4 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Objetivo do mês</span>
                      <button 
                        onClick={() => {
                          setMetaInput(objetivoMes > 0 ? objetivoMes.toString() : "");
                          setMetaModalOpen(true);
                        }}
                        className="text-[10px] text-brand hover:underline"
                      >
                        Definir metas
                      </button>
                    </div>
                    <span className="text-xl font-bold text-foreground">{fmt(objetivoMes)}</span>
                    <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-brand transition-all"
                        style={{ width: `${objetivoMes > 0 ? Math.min(100, (vendidoMes / objetivoMes) * 100) : 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {metaProporcional > 0 ? `${((vendidoMes / metaProporcional) * 100).toFixed(0)}% da meta prorrateada` : "%"}
                    </span>
                  </div>
                  <div className="p-4 flex flex-col gap-0.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Ritmo Necessário</span>
                    <span className="text-base font-bold text-foreground">
                      {necessarioPorDia > 0 ? fmt(necessarioPorDia) : "—"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">R$ por dia útil</span>
                    <span className="text-[10px] text-muted-foreground mt-1">
                      {objetivoMes === 0 ? "Nenhuma meta definida" : ""}
                    </span>
                  </div>
                  <div className="p-4">
                    <Link to="/app/vendedores">
                      <Button variant="outline" size="sm" className="w-full text-xs h-8">
                        <Users className="h-3.5 w-3.5 mr-1.5" />
                        Detalhar por vendedor
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3 Donuts */}
          <div className="grid gap-4 md:grid-cols-3">
            <DonutCard
              title="Carteira de Clientes"
              total={totalCarteira}
              label="Clientes"
              segments={[
                { name: "Ativos", value: carteira.ativos, color: "#22c55e" },
                { name: "Inativos recentes", value: carteira.inativosRecentes, color: "#f59e0b" },
                { name: "Inativos antigos", value: carteira.inativosAntigos, color: "#ef4444" },
                { name: "Prospectos", value: carteira.prospectos, color: "#a78bfa" },
              ]}
              detailLabel="Detalhar carteira"
              detailTo="/app/clientes"
            />
            <DonutCard
              title="Positivação"
              total={totalPositivados}
              label="Clientes positivados"
              segments={[
                { name: "Novos", value: positivados.novos, color: "#22c55e" },
                { name: "Ativos", value: positivados.ativos, color: "#3b82f6" },
                { name: "Inativos recentes", value: positivados.inativosRecentes, color: "#f59e0b" },
                { name: "Inativos antigos", value: positivados.inativosAntigos, color: "#ef4444" },
              ]}
              detailLabel="Detalhar positivação"
              detailTo="/app/clientes"
            />
            <DonutCard
              title="Curva ABC de Clientes"
              total={totalCurva}
              label="Clientes"
              segments={[
                { name: "Clientes na Curva A", value: curvaABC.a, color: "#22c55e" },
                { name: "Clientes na Curva B", value: curvaABC.b, color: "#f59e0b" },
                { name: "Clientes na Curva C", value: curvaABC.c, color: "#94a3b8" },
              ]}
              detailLabel="Detalhar curva ABC"
              detailTo="/app/clientes"
            />
          </div>


        </>
      )}

      {tab === "relatorios" && (
        <div className="py-6 px-2">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* VENDAS */}
            <div className={REPORT_SECTION_CLASS}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b-2 border-primary/40 pb-2">Vendas</h3>
              <ul className="space-y-3">
                <li><Link to="/app/relatorios" search={{ rel: 'resumo-vendas' }} className="text-sm text-brand hover:underline flex items-center gap-2">Resumo de vendas <Badge variant="outline" className="text-[9px] h-4 px-1 border-green-500 text-green-600 font-bold">NOVO</Badge></Link></li>
                <li><Link to="/app/relatorios" search={{ rel: 'vendas-detalhadas' }} className="text-sm text-brand hover:underline flex items-center gap-2">Vendas detalhadas <Badge variant="outline" className="text-[9px] h-4 px-1 border-green-500 text-green-600 font-bold">NOVO</Badge></Link></li>
              </ul>
            </div>

            {/* FATURAMENTO E TÍTULOS */}
            <div className={REPORT_SECTION_CLASS}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b-2 border-primary/40 pb-2">Faturamento e Títulos</h3>
              <ul className="space-y-3">
                <li><Link to="/app/relatorios" search={{ rel: 'pedidos-faturados' }} className="text-sm text-brand hover:underline">Pedidos faturados</Link></li>
                <li><Link to="/app/relatorios" search={{ rel: 'faturamento' }} className="text-sm text-brand hover:underline">Faturamento</Link></li>
                <li><Link to="/app/relatorios" search={{ rel: 'titulos' }} className="text-sm text-brand hover:underline">Títulos</Link></li>
              </ul>
            </div>

            {/* CLIENTES */}
            <div className={REPORT_SECTION_CLASS}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b-2 border-primary/40 pb-2">Clientes</h3>
              <ul className="space-y-3">
                <li><Link to="/app/relatorios" search={{ rel: 'clientes' }} className="text-sm text-brand hover:underline">Clientes</Link></li>
                <li><Link to="/app/relatorios" search={{ rel: 'situacao-carteira' }} className="text-sm text-brand hover:underline">Situação da carteira de clientes</Link></li>
                <li><Link to="/app/relatorios" search={{ rel: 'situacao-carteira-vendedor' }} className="text-sm text-brand hover:underline flex items-center gap-2">Situação da carteira de clientes por vendedor <Badge variant="outline" className="text-[9px] h-4 px-1 border-green-500 text-green-600 font-bold">NOVO</Badge></Link></li>
              </ul>
            </div>

            {/* COMISSÕES */}
            <div className={REPORT_SECTION_CLASS}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b-2 border-primary/40 pb-2">Comissões</h3>
              <ul className="space-y-3">
                <li><Link to="/app/relatorios" search={{ rel: 'comissoes' }} className="text-sm text-brand hover:underline">Relatório de comissões</Link></li>
                <li><Link to="/app/relatorios" search={{ rel: 'comissoes-por-pedido' }} className="text-sm text-brand hover:underline">Comissões por pedido</Link></li>
              </ul>
            </div>

            {/* PRODUTOS */}
            <div className={REPORT_SECTION_CLASS}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b-2 border-primary/40 pb-2">Produtos</h3>
              <ul className="space-y-3">
                <li><Link to="/app/relatorios" search={{ rel: 'produtos-mais-vendidos' }} className="text-sm text-brand hover:underline">Produtos mais vendidos</Link></li>
                <li><Link to="/app/relatorios" search={{ rel: 'positivacao-produtos' }} className="text-sm text-brand hover:underline">Positivação de produtos por cliente</Link></li>
                <li><Link to="/app/relatorios" search={{ rel: 'produtos-por-pedido' }} className="text-sm text-brand hover:underline">Produtos por pedido</Link></li>
                <li><Link to="/app/relatorios" search={{ rel: 'estoque' }} className="text-sm text-brand hover:underline">Estoque</Link></li>
              </ul>
            </div>

            {/* OUTROS */}
            <div className={REPORT_SECTION_CLASS}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b-2 border-primary/40 pb-2">Outros</h3>
              <ul className="space-y-3">
                <li><Link to="/app/relatorios" search={{ rel: 'emails-enviados' }} className="text-sm text-brand hover:underline">E-mails enviados</Link></li>
              </ul>
            </div>

            {/* VERSÕES ANTERIORES */}
            <div className={REPORT_SECTION_CLASS}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b-2 border-primary/40 pb-2">Versões Anteriores</h3>
              <ul className="space-y-3">
                <li><Link to="/app/relatorios" search={{ rel: 'vendas-antigo' }} className="text-sm text-brand hover:underline flex items-center gap-2">Vendas <Badge variant="outline" className="text-[9px] h-4 px-1 border-muted-foreground text-muted-foreground font-bold">ANTIGO</Badge></Link></li>
              </ul>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Definir Metas */}
      {mounted && (
        <Dialog open={metaModalOpen} onOpenChange={setMetaModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Definir Objetivo do Mês</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="meta">Valor da Meta (R$)</Label>
                <Input
                  id="meta"
                  type="number"
                  placeholder="Ex: 50000"
                  value={metaInput}
                  onChange={(e) => setMetaInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  A meta definida será válida para o mês de {MESES[fromD.getMonth()]} de {fromD.getFullYear()}.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMetaModalOpen(false)}>Cancelar</Button>
              <Button onClick={() => {
                const valor = Number(metaInput);
                const aNum = fromD.getFullYear();
                const mNum = fromD.getMonth() + 1;
                localStorage.setItem(`meta_${aNum}_${mNum}`, String(valor));
                setObjetivoMes(valor);
                setMetaModalOpen(false);
              }}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
