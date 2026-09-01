import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function PositivacaoProdutos() {
  const [chartType, setChartType] = useState<"barras" | "area">("barras");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display tracking-tight text-foreground/90">Positivação de produtos por cliente</h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe os produtos comprados por cada cliente.</p>
        </div>
        <Button variant="outline" size="sm" className="h-8">
          <SlidersHorizontal className="h-3.5 w-3.5 mr-2" />
          Filtros
        </Button>
      </div>

      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-md w-fit">
        {[
          { key: "barras" as const, label: "Evolução em barras", icon: "▐" },
          { key: "area" as const, label: "Evolução em área", icon: "△" },
        ].map((opt) => (
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

      <div className="border rounded-md bg-white py-16 flex flex-col items-center justify-center gap-4">
        <div className="w-48 h-3 rounded-full bg-gradient-to-r from-green-400 via-yellow-300 to-red-400 opacity-70" />
        <p className="text-sm text-muted-foreground font-medium">Não há dados neste período.</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-400"></span> Clientes que compraram
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-orange-400"></span> Clientes que não compraram
          </span>
        </div>
      </div>

      <div className="border rounded-md bg-slate-50/50 py-3 px-4 text-center text-xs text-muted-foreground">
        Todos produtos selecionados ⓘ
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Clientes</h3>
        <div className="border rounded-md bg-white overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-bold text-foreground min-w-[180px]">Razão social ▾</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Situação do cliente</TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">Qtd. produtos distintos</TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">Qtd. total comprada</TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">Valor total comprado</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Situação da compra</TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">Qtd. produtos distintos</TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">Qtd. total comprada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="text-center py-8 text-sm text-muted-foreground bg-slate-50/50">
                  Não há dados para exibir.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground text-left mt-2">Resultados 1 - 0 de 0</p>
      </div>
    </div>
  );
}
