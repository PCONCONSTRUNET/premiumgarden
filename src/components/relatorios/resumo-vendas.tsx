import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileSpreadsheet, Heart, Lightbulb, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

export function ResumoVendas() {
  const [showBanner, setShowBanner] = useState(true);
  const [agrupamento, setAgrupamento] = useState("nenhum");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display tracking-tight text-foreground/90">Resumo de vendas</h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe os totais vendidos por período.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs font-semibold">
            <Heart className="h-3.5 w-3.5 mr-2" />
            Avalie este relatório
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs font-semibold">
            <SlidersHorizontal className="h-3.5 w-3.5 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {showBanner && (
        <div className="bg-purple-100/50 border border-purple-200 text-purple-900 rounded-md p-4 flex items-start gap-3 relative">
          <Lightbulb className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
          <p className="text-sm font-medium pr-6">
            Para uma visão detalhada pedido a pedido, acesse o relatório Vendas detalhadas.
          </p>
          <button 
            onClick={() => setShowBanner(false)}
            className="absolute right-3 top-3.5 text-purple-700 hover:text-purple-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="w-64">
            <Select value={agrupamento} onValueChange={setAgrupamento}>
              <SelectTrigger className="bg-white border-2 border-brand text-foreground focus:ring-0 font-semibold h-10">
                <SelectValue placeholder="Nenhum agrupamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhum" className="font-semibold text-brand focus:bg-brand focus:text-white">Nenhum agrupamento</SelectItem>
                <SelectItem value="vendedor">Agrupado por vendedor</SelectItem>
                <SelectItem value="cliente">Agrupado por cliente</SelectItem>
                <SelectItem value="estado">Agrupado por estado</SelectItem>
                <SelectItem value="regiao">Agrupado por região</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" className="h-9 text-xs font-semibold">
            <FileSpreadsheet className="mr-2 h-4 w-4 text-brand" />
            Excel
          </Button>
        </div>

        <div className="border rounded-md bg-slate-50/50 py-12 flex items-center justify-center">
          <p className="text-sm text-muted-foreground font-medium">Não há dados para exibir.</p>
        </div>
      </div>
    </div>
  );
}
