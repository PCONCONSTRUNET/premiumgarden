import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const periodoOptions = [
  { key: "mes_atual", label: "Mês atual" },
  { key: "mes_passado", label: "Mês passado" },
  { key: "jul_ate_nov", label: "Jul. até Nov." },
  { key: "outro", label: "Outro período" },
];

const mockLineData = [
  { mes: "Jul", total: 0 },
  { mes: "Ago", total: 0 },
  { mes: "Set", total: 0 },
  { mes: "Out", total: 0 },
  { mes: "Nov", total: 0 },
];

export function RelatorioComissoes() {
  const [periodo, setPeriodo] = useState("jul_ate_nov");
  const [previsao, setPrevisao] = useState(true);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-xl font-bold font-display uppercase tracking-tight text-foreground/90">
        § Comissões
      </h1>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Select defaultValue="todas">
            <SelectTrigger className="w-[260px] h-9 text-sm border-2 border-brand">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Comissões baixadas e não baixadas</SelectItem>
              <SelectItem value="baixadas">Comissões baixadas</SelectItem>
              <SelectItem value="nao_baixadas">Comissões não baixadas</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Checkbox
              id="previsao"
              checked={previsao}
              onCheckedChange={(v) => setPrevisao(!!v)}
            />
            <Label htmlFor="previsao" className="text-sm cursor-pointer">
              Mostrar <span className="text-brand font-semibold">previsão</span> de faturamento
            </Label>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-semibold">Data da comissão:</span>
          <div className="flex gap-1">
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
        </div>
      </div>

      <div className="border rounded-md bg-white p-4">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={mockLineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `R$ ${Number(v).toFixed(2)}`} />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 4, fill: "#6366f1" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-center text-xs text-muted-foreground mt-3">Nenhuma informação encontrada.</p>
      </div>

      {/* Vendedor card */}
      <div className="border rounded-md bg-white p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-brand/10 text-brand font-bold">LP</AvatarFallback>
            </Avatar>
            <p className="font-semibold text-sm">Lucas Pereira</p>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
            Detalhar ↗
          </Button>
        </div>

        <div className="h-16">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockLineData}>
              <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
