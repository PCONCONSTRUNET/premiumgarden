import { toast } from "sonner";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Package,
  ShoppingCart,
  AlertTriangle,
  Users,
  Truck,
  TrendingUp,
  MoreHorizontal,
} from "lucide-react";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — SENALANDIA 2 ERP ERP" }] }),
  component: Dashboard,
});

// Gráficos serão dinamizados posteriormente. Por enquanto mostram arrays vazios após limpeza.

function KPI({ icon: Icon, label, value, delta, up = true, tone = "primary" }: any) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    info: "bg-info/10 text-info",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    terra: "bg-terra/10 text-terra",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <Card className="shadow-card">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={`grid h-10 w-10 place-items-center rounded-lg ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <Button size="icon" variant="ghost" className="h-7 w-7">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-2xl font-bold tracking-tight">{value}</p>
        {delta && (
          <p
            className={`mt-2 flex items-center gap-1 text-xs font-medium ${up ? "text-success" : "text-destructive"}`}
          >
            {up ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {delta} <span className="text-muted-foreground font-normal">vs mês anterior</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const [stats, setStats] = useState({
    faturamento: 0,
    pedidosHoje: 0,
    produtosEstoque: 0,
    clientesAtivos: 0,
    entregasPendentes: 0,
    recent: [] as any[],
    ticketMedio: 0,
    margemLiquida: 0,
    otif: 0,
    maisVendidos: [] as any[],
    mixCategorias: [] as any[],
    vendasVsCompras: [] as any[],
  });

  useEffect(() => {
    async function loadData() {
      const { data: vendasData } = await supabase
        .from("vendas")
        .select("*, vendas_itens(*, produto:produtos(nome, categoria)), clientes(nome)")
        .in("tipo", ["VENDA", "PDV", "Afiliado"])
        .or("status_aprovacao.neq.Pendente,status_aprovacao.is.null");
      
      const { count: produtosCount } = await supabase
        .from("produtos")
        .select("*", { count: "exact", head: true })
        .eq("status", "Ativo");
        
      const { count: clientesCount } = await supabase
        .from("clientes")
        .select("*", { count: "exact", head: true });
        
      const { data: receitasData } = await supabase
        .from("contas_receber")
        .select("valor, created_at")
        .eq("status", "Recebido");
        
      const { data: despesasData } = await supabase
        .from("contas_pagar")
        .select("valor, created_at")
        .eq("status", "Pago");

      let fat = 0;
      let pedHoje = 0;
      let entPend = 0;
      let vendasValidasMes = 0;
      let entreguesMes = 0;
      let validVendasCount = 0;
      
      const hojeStr = new Date().toISOString().split("T")[0];
      const inicioMesAtual = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

      const produtoQtds: Record<string, number> = {};
      const catValores: Record<string, number> = {};

      vendasData?.forEach((v) => {
        const isValida = v.status !== "Cancelada" && v.status !== "Rejeitada" && v.status_aprovacao !== "Rejeitada";
        const dataVenda = new Date(v.created_at);
        
        if (isValida) {
          fat += Number(v.valor_total || v.total || 0);
          validVendasCount++;
          
          if (dataVenda >= inicioMesAtual) {
            vendasValidasMes++;
            if (v.status === "Entregue" || v.status === "Pago" || v.status === "Faturado") {
                entreguesMes++;
            }
            
            v.vendas_itens?.forEach((i: any) => {
               const pName = i.produto?.nome || "Avulso";
               const pCat = i.produto?.categoria || "Outros";
               const q = Number(i.quantidade || 1);
               const subt = Number(i.subtotal || i.valor_unitario * q || 0);
               
               produtoQtds[pName] = (produtoQtds[pName] || 0) + q;
               catValores[pCat] = (catValores[pCat] || 0) + subt;
            });
          }
        }
        if (v.created_at?.startsWith(hojeStr)) pedHoje++;
        if (v.status === "PENDENTE" || v.status === "Pendente" || v.status === "EM_ROTA") entPend++;
      });
      
      const ticketMedio = validVendasCount > 0 ? fat / validVendasCount : 0;
      const otif = vendasValidasMes > 0 ? (entreguesMes / vendasValidasMes) * 100 : 0;

      const receitasMes = receitasData?.filter(r => new Date(r.created_at) >= inicioMesAtual).reduce((acc, curr) => acc + Number(curr.valor), 0) || 0;
      const despesasMes = despesasData?.filter(r => new Date(r.created_at) >= inicioMesAtual).reduce((acc, curr) => acc + Number(curr.valor), 0) || 0;
      const margemLiquida = receitasMes > 0 ? ((receitasMes - despesasMes) / receitasMes) * 100 : 0;
      
      const maisVendidos = Object.entries(produtoQtds)
        .map(([name, v]) => ({ name: name.substring(0, 15) + (name.length > 15 ? "..." : ""), v }))
        .sort((a, b) => b.v - a.v)
        .slice(0, 5);
        
      const COLORS = ["#22C55E", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899", "#64748B"];
      const mixCategorias = Object.entries(catValores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value], idx) => ({ name, value, fill: COLORS[idx % COLORS.length] }));

      const vendasVsCompras = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const mes = d.getMonth();
        const ano = d.getFullYear();
        const label = d.toLocaleString('pt-BR', { month: 'short' });
        
        const recMes = receitasData?.filter(r => {
            const dt = new Date(r.created_at);
            return dt.getMonth() === mes && dt.getFullYear() === ano;
        }).reduce((acc, curr) => acc + Number(curr.valor), 0) || 0;
        
        const despMes = despesasData?.filter(r => {
            const dt = new Date(r.created_at);
            return dt.getMonth() === mes && dt.getFullYear() === ano;
        }).reduce((acc, curr) => acc + Number(curr.valor), 0) || 0;
        
        vendasVsCompras.push({
            m: label,
            v: recMes,
            c: despMes
        });
      }
      
      const vendasRecentes = vendasData
          ?.filter(v => v.status !== "Cancelada" && v.status !== "Rejeitada")
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5) || [];

      setStats({
        faturamento: fat,
        pedidosHoje: pedHoje,
        produtosEstoque: produtosCount || 0,
        clientesAtivos: clientesCount || 0,
        entregasPendentes: entPend,
        recent: vendasRecentes,
        ticketMedio,
        margemLiquida,
        otif,
        maisVendidos,
        mixCategorias,
        vendasVsCompras
      });
    }
    loadData();
  }, []);

  return (
    <>
      <PageHeader
        title="Visão Geral"
        subtitle={`${new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())} — bom dia, Senalandia 👋`}
        actions={
          <>
            <Button
              variant="outline"
              onClick={async () => {
                const { data } = await supabase
                  .from("vendas")
                  .select("*, clientes(nome)")
                  .order("created_at", { ascending: false })
                  .limit(100);
                if (!data || data.length === 0) {
                  toast.info("Nenhuma venda encontrada para exportar.");
                  return;
                }
                const rows = [
                  ["ID", "Cliente", "Tipo", "Status", "Valor Total", "Data"],
                  ...data.map((v) => [
                    v.id.slice(0, 8).toUpperCase(),
                    v.clientes?.nome || "Consumidor Final",
                    v.tipo || "",
                    v.status || "",
                    `R$ ${Number(v.valor_total || 0).toFixed(2)}`,
                    new Date(v.created_at).toLocaleDateString("pt-BR"),
                  ]),
                ];
                const csv = rows.map((r) => r.map((c) => `"${c}"`).join(";")).join("\n");
                const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `relatorio_vendas_${new Date().toISOString().split("T")[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
            >
              Exportar CSV
            </Button>
            <Button asChild className="bg-gradient-brand text-primary-foreground">
              <Link to="/app/vendas">Novo Pedido</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KPI
          icon={DollarSign}
          label="Faturamento"
          value={`R$ ${stats.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          delta=""
          tone="primary"
        />
        <KPI
          icon={ShoppingCart}
          label="Pedidos do dia"
          value={stats.pedidosHoje.toString()}
          delta=""
          tone="info"
        />
        <KPI
          icon={Package}
          label="Produtos ativos"
          value={stats.produtosEstoque.toString()}
          delta=""
          tone="success"
        />
        <KPI icon={AlertTriangle} label="Produtos críticos" value="0" delta="" tone="warning" />
        <KPI
          icon={Users}
          label="Clientes ativos"
          value={stats.clientesAtivos.toString()}
          delta=""
          tone="terra"
        />
        <KPI
          icon={Truck}
          label="Entregas pendentes"
          value={stats.entregasPendentes.toString()}
          delta=""
          up={false}
          tone="destructive"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Vendas vs Compras</CardTitle>
              <CardDescription>Últimos 12 meses — em reais (R$)</CardDescription>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Vendas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-terra" />
                Compras
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={stats.vendasVsCompras}>
                <defs>
                  <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#166534" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#166534" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#92400E" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#92400E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="m"
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
                  tickFormatter={(v) => `${v / 1000}k`}
                />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="#166534"
                  strokeWidth={2.5}
                  fill="url(#gv)"
                />
                <Area
                  type="monotone"
                  dataKey="c"
                  stroke="#92400E"
                  strokeWidth={2}
                  fill="url(#gc)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Mix de Categorias</CardTitle>
            <CardDescription>Participação no faturamento</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stats.mixCategorias}
                  dataKey="value"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                ></Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <ul className="mt-2 space-y-1.5 text-sm text-center text-muted-foreground">
              {stats.mixCategorias.length === 0 ? (
                <li>Sem dados suficientes.</li>
              ) : (
                stats.mixCategorias.map((c: any) => (
                  <li key={c.name} className="flex items-center justify-between px-4">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.fill }} />
                      {c.name}
                    </span>
                    <span className="font-semibold">R$ {c.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Últimos pedidos</CardTitle>
              <CardDescription>5 mais recentes</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/vendas">Ver tudo</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {stats.recent.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Nenhum pedido recente.
                </div>
              ) : (
                stats.recent.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between px-6 py-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">#{r.id?.toString().slice(0, 5)}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {r.clientes?.nome || "Consumidor Final"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        R${" "}
                        {Number(r.valor_total || r.total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      <Badge variant="secondary" className="mt-0.5 text-[10px]">
                        {r.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Mais vendidos</CardTitle>
            <CardDescription>Top 5 do mês — em unidades</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={stats.maisVendidos} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={110}
                />
                <Tooltip contentStyle={{ borderRadius: 12 }} />
                <Bar dataKey="v" fill="#22C55E" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {[
          { title: "Margem líquida", value: `${stats.margemLiquida.toFixed(1)}%`, icon: TrendingUp, tone: "text-success" },
          { title: "Ticket médio", value: `R$ ${stats.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: DollarSign, tone: "text-primary" },
          { title: "OTIF (entregas no prazo)", value: `${stats.otif.toFixed(1)}%`, icon: Truck, tone: "text-info" },
        ].map((s) => (
          <Card key={s.title} className="shadow-card">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">{s.title}</p>
                <p className="mt-1 font-display text-2xl font-bold">{s.value}</p>
              </div>
              <s.icon className={`h-8 w-8 ${s.tone}`} />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
