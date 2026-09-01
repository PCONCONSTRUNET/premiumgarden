import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileSpreadsheet, LayoutGrid } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProdutosMaisVendidos() {
  const [chartType, setChartType] = useState<"proporcao" | "barras" | "area">("proporcao");

  const chartOptions = [
    { key: "proporcao" as const, label: "Proporção nas vendas", icon: "■" },
    { key: "barras" as const, label: "Evolução em barras", icon: "▐" },
    { key: "area" as const, label: "Evolução em área", icon: "△" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-display uppercase tracking-tight text-foreground/90">
          Produtos mais vendidos
        </h1>
      </div>

      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-md w-fit">
        {chartOptions.map((opt) => (
          <Button
            key={opt.key}
            variant="ghost"
            size="sm"
            onClick={() => setChartType(opt.key)}
            className={cn(
              "h-8 text-xs font-semibold gap-1.5 px-3",
              chartType === opt.key
                ? "bg-brand text-white hover:bg-brand/90 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-white"
            )}
          >
            <span>{opt.icon}</span>
            {opt.label}
          </Button>
        ))}
      </div>

      <div className="text-sm text-muted-foreground flex items-center gap-1">
        Proporção da{" "}
        <button className="text-brand underline">quantidade total vendida</button>
        {" "}no período de{" "}
        <button className="text-brand underline">01/09/2026 a 01/09/2026</button>
      </div>

      <div className="border rounded-md bg-white py-16 flex flex-col items-center justify-center gap-4">
        <div className="w-48 h-3 rounded-full bg-gradient-to-r from-green-400 via-yellow-300 to-red-400 opacity-70" />
        <p className="text-sm text-muted-foreground font-medium">Não há dados neste período.</p>
      </div>

      <div className="border rounded-md bg-slate-50/50 py-3 px-4 text-center text-xs text-muted-foreground">
        Todos produtos selecionados ⓘ
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Categorias e Produtos</h3>
        <div className="flex justify-end items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs font-semibold">
            <LayoutGrid className="mr-2 h-3.5 w-3.5" />
            Mais colunas
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs font-semibold">
            <FileSpreadsheet className="mr-2 h-3.5 w-3.5" />
            Excel
          </Button>
        </div>

        <div className="border rounded-md bg-white overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-bold text-foreground min-w-[180px]">Categorias e Produtos</TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">Quantidade vendida ▾</TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">Valor vendido</TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">Ticket médio</TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">Participação (qtd. vendida)</TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">Participação (valor vendido)</TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">Participação (ticket m.)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground bg-slate-50/50">
                  Não há dados para exibir.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground text-left">Resultados 1 - 0 de 0</p>
      </div>
    </div>
  );
}
