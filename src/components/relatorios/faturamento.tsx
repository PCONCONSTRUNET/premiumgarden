import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileSpreadsheet, LayoutGrid } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Faturamento() {
  const [periodo, setPeriodo] = useState("este_mes");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-xl font-bold font-display uppercase tracking-tight text-foreground/90">
        Relatório de Faturamento
      </h1>

      <div className="flex flex-wrap items-center gap-2">
        <Button 
          variant={periodo === "este_mes" ? "default" : "outline"}
          onClick={() => setPeriodo("este_mes")}
          className={cn("h-8 text-xs font-semibold", periodo === "este_mes" && "bg-brand text-white hover:bg-brand/90")}
        >
          Este mês
        </Button>
        <Button 
          variant={periodo === "mes_passado" ? "default" : "outline"}
          onClick={() => setPeriodo("mes_passado")}
          className={cn("h-8 text-xs font-semibold", periodo === "mes_passado" && "bg-brand text-white hover:bg-brand/90")}
        >
          Mês passado
        </Button>
        <Button 
          variant={periodo === "ultimos_3_meses" ? "default" : "outline"}
          onClick={() => setPeriodo("ultimos_3_meses")}
          className={cn("h-8 text-xs font-semibold", periodo === "ultimos_3_meses" && "bg-brand text-white hover:bg-brand/90")}
        >
          Últimos 3 meses
        </Button>
        <Button 
          variant={periodo === "ultimos_6_meses" ? "default" : "outline"}
          onClick={() => setPeriodo("ultimos_6_meses")}
          className={cn("h-8 text-xs font-semibold", periodo === "ultimos_6_meses" && "bg-brand text-white hover:bg-brand/90")}
        >
          Últimos 6 meses
        </Button>
        <Button 
          variant={periodo === "outro" ? "default" : "outline"}
          onClick={() => setPeriodo("outro")}
          className={cn("h-8 text-xs font-semibold", periodo === "outro" && "bg-brand text-white hover:bg-brand/90")}
        >
          Outro período
        </Button>
      </div>

      <div className="flex gap-4">
        <Select defaultValue="venda">
          <SelectTrigger className="w-[200px] h-9 text-xs">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="venda">Venda</SelectItem>
            <SelectItem value="bonificacao">Bonificação</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="todas">
          <SelectTrigger className="w-[200px] h-9 text-xs">
            <SelectValue placeholder="Representadas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as representadas</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="lucas">
          <SelectTrigger className="w-[200px] h-9 text-xs">
            <SelectValue placeholder="Vendedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lucas">Lucas Pereira de Souza</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4 pt-4 border-t border-border/50">
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

        <div className="border rounded-md bg-slate-50/50 py-12 flex items-center justify-center">
          <p className="text-sm text-muted-foreground font-medium">Nenhuma informação encontrada.</p>
        </div>
      </div>
    </div>
  );
}
