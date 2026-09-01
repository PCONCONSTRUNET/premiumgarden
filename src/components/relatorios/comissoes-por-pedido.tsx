import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

const periodoOptions = [
  { key: "este_mes", label: "Este mês" },
  { key: "mes_passado", label: "Mês passado" },
  { key: "ultimos_3_meses", label: "Últimos 3 meses" },
  { key: "ultimos_6_meses", label: "Últimos 6 meses" },
  { key: "outro", label: "Outro período" },
];

export function ComissoesPorPedido() {
  const [periodo, setPeriodo] = useState("ultimos_3_meses");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-xl font-bold font-display uppercase tracking-tight text-foreground/90">
        Relatório de Comissões por Pedido
      </h1>

      <div className="flex flex-wrap gap-2">
        {periodoOptions.map((opt) => (
          <Button
            key={opt.key}
            variant="outline"
            size="sm"
            onClick={() => setPeriodo(opt.key)}
            className={cn(
              "h-8 text-xs font-semibold",
              periodo === opt.key && "bg-brand text-white border-brand hover:bg-brand/90 hover:text-white"
            )}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <div className="border rounded-md bg-slate-50/50 py-12 flex items-center justify-center">
        <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
          <span className="text-base">ⓘ</span> Nenhuma informação encontrada.
        </p>
      </div>
    </div>
  );
}
