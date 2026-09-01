import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProdutosPorPedido() {
  const [periodo, setPeriodo] = useState("este_mes");
  const [precos, setPrecos] = useState("exibir");

  const periodoOptions = [
    { key: "ultimos_6_meses", label: "Últimos 6 meses" },
    { key: "ultimos_3_meses", label: "Últimos 3 meses" },
    { key: "este_mes", label: "Este mês" },
    { key: "outro", label: "Outro período" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-xl font-bold font-display uppercase tracking-tight text-foreground/90">
        Produtos por pedido
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Select defaultValue="lucas">
            <SelectTrigger className="bg-white border-input h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lucas">Lucas Pereira de Souza</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="todas_categorias">
            <SelectTrigger className="bg-white border-input h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas_categorias">Todas as categorias</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="todos_tipos">
            <SelectTrigger className="bg-white border-input h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos_tipos">Todos os tipos de pedido</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="todos_status">
            <SelectTrigger className="bg-white border-input h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos_status">Todos os status de pedidos</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="concluidos">
            <SelectTrigger className="bg-white border-input h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="concluidos">Pedidos concluídos</SelectItem>
              <SelectItem value="todos">Todos os pedidos</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="todos_segmentos">
            <SelectTrigger className="bg-white border-input h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos_segmentos">Todos os segmentos de clientes</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Filtrar cliente" className="h-10 text-sm" />
          <Input placeholder="Filtrar produto" className="h-10 text-sm" />
        </div>

        <div className="space-y-4">
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

          <RadioGroup value={precos} onValueChange={setPrecos} className="space-y-2 pt-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="exibir" id="exibir" />
              <Label htmlFor="exibir" className="text-sm font-normal cursor-pointer">Exibir preços dos produtos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="esconder" id="esconder" />
              <Label htmlFor="esconder" className="text-sm font-normal cursor-pointer">Esconder preços dos produtos</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="border rounded-md bg-slate-50/50 py-12 flex items-center justify-center">
        <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
          <span className="text-base">ⓘ</span> Nenhuma informação encontrada.
        </p>
      </div>
    </div>
  );
}
