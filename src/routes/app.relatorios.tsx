import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  Download,
  Users,
  Package,
  DollarSign,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/app/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — VIVAVERDE ERP" }] }),
  component: Relatorios,
});

function Relatorios() {
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState("6m");

  useEffect(() => {
    async function fetchVendas() {
      const { data } = await supabase
        .from("vendas")
        .select("*, clientes(nome)")
        .in("tipo", ["VENDA", "PDV"])
        .or("status_aprovacao.neq.Pendente,status_aprovacao.is.null");
      if (data) setVendas(data);
      setLoading(false);
    }
    fetchVendas();
  }, []);

  const totalFaturamento = vendas.reduce((acc, v) => acc + Number(v.valor_total), 0);
  const totalPedidos = vendas.length;
  const ticketMedio = totalPedidos > 0 ? totalFaturamento / totalPedidos : 0;

  const getChartData = () => {
    if (vendas.length === 0) return [];

    const sorted = [...vendas].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    if (periodo === "7d" || periodo === "30d") {
      const days = periodo === "7d" ? 7 : 30;
      const dataMap = new Map();
      const now = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        dataMap.set(dateStr, { v: 0, c: 0 });
      }

      sorted.forEach((v) => {
        const d = new Date(v.created_at);
        const dateStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        if (dataMap.has(dateStr)) {
          const curr = dataMap.get(dateStr);
          dataMap.set(dateStr, { v: curr.v + Number(v.valor_total), c: curr.c + 1 });
        }
      });

      return Array.from(dataMap.entries()).map(([m, data]) => ({ m, v: data.v, c: data.c }));
    } else {
      const months = periodo === "6m" ? 6 : 12;
      const dataMap = new Map();
      const now = new Date();
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
        // capitalize first letter
        const formattedMonth = monthStr.charAt(0).toUpperCase() + monthStr.slice(1);
        dataMap.set(formattedMonth, { v: 0, c: 0 });
      }

      sorted.forEach((v) => {
        const d = new Date(v.created_at);
        const monthStr = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
        const formattedMonth = monthStr.charAt(0).toUpperCase() + monthStr.slice(1);
        if (dataMap.has(formattedMonth)) {
          const curr = dataMap.get(formattedMonth);
          dataMap.set(formattedMonth, { v: curr.v + Number(v.valor_total), c: curr.c + 1 });
        }
      });

      return Array.from(dataMap.entries()).map(([m, data]) => ({ m, v: data.v, c: data.c }));
    }
  };

  const chartData = getChartData();

  const getChartDescription = () => {
    switch (periodo) {
      case "7d":
        return "Últimos 7 dias";
      case "30d":
        return "Últimos 30 dias";
      case "1y":
        return "Acumulado do ano";
      case "6m":
      default:
        return "Último semestre";
    }
  };

  const reports = [
    { i: DollarSign, t: "Relatório de Vendas", d: "Faturamento, ticket médio, comissões" },
    { i: BarChart3, t: "Relatório Financeiro", d: "DRE, fluxo de caixa, inadimplência" },
    { i: Package, t: "Relatório de Estoque", d: "Posição, giro, curva ABC" },
    { i: Users, t: "Relatório de Clientes", d: "Ativação, recompra, ranking" },
    { i: FileSpreadsheet, t: "Relatório de Produtos", d: "Mais vendidos, rentabilidade" },
    { i: FileText, t: "Relatório Fiscal", d: "Apuração ICMS, PIS, COFINS" },
  ];

  const handleVisualizar = (titulo: string) => {
    setSelectedReport(titulo);
  };

  const handlePDF = (titulo: string) => {
    toast.success(`PDF Gerado!`, {
      description: `O ${titulo} está pronto para impressão/salvamento.`,
    });
    setTimeout(() => {
      window.print();
    }, 800);
  };

  return (
    <>
      <PageHeader
        title="Relatórios"
        subtitle="Visões executivas e operacionais em tempo real"
        actions={
          <div className="w-[180px]">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="6m">Últimos 6 meses</SelectItem>
                <SelectItem value="1y">Este ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">
              Faturamento (Hoje)
            </p>
            <p className="mt-2 font-display text-3xl font-bold text-success">
              R$ {totalFaturamento.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">
              Total de Pedidos
            </p>
            <p className="mt-2 font-display text-3xl font-bold text-primary">{totalPedidos}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">
              Ticket Médio
            </p>
            <p className="mt-2 font-display text-3xl font-bold text-info">
              R$ {ticketMedio.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Faturamento</CardTitle>
            <CardDescription>{getChartDescription()}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
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
                  tickFormatter={(v) => `R$${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v}`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12 }}
                  formatter={(value: any) => [
                    `R$ ${Number(value).toFixed(2).replace(".", ",")}`,
                    "Faturamento",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="#166534"
                  strokeWidth={3}
                  dot={{ fill: "#166534", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Volume de Pedidos</CardTitle>
            <CardDescription>Tendência de crescimento</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="m"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={false}
                  contentStyle={{ borderRadius: 12 }}
                  formatter={(value: any) => [`${value} pedidos`, "Volume"]}
                />
                <Bar dataKey="c" fill="#22C55E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <Card
            key={r.t}
            className="shadow-card hover:shadow-elevated transition-shadow cursor-pointer group"
          >
            <CardContent className="p-6">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-brand text-primary-foreground group-hover:scale-110 transition-transform">
                <r.i className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{r.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{r.d}</p>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => handleVisualizar(r.t)} variant="outline" size="sm">
                  Visualizar
                </Button>
                <Button onClick={() => handlePDF(r.t)} variant="ghost" size="sm">
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedReport}</DialogTitle>
            <DialogDescription>
              Demonstrativo detalhado gerado em tempo real com dados consolidados.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Operação</TableHead>
                  <TableHead>Cliente/Info</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : vendas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      Nenhuma venda registrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  vendas.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>{new Date(v.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">
                        {v.tipo} #{v.numero_venda || v.id.substring(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell>{v.clientes?.nome || "Consumidor Final"}</TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {Number(v.valor_total).toFixed(2).replace(".", ",")}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${v.status === "Pago" || v.status === "Faturado" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}
                        >
                          {v.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => handlePDF(selectedReport || "")}>
              <Download className="mr-2 h-4 w-4" /> Baixar PDF Completo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
