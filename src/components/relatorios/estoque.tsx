import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export function Estoque() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-xl font-bold font-display uppercase tracking-tight text-foreground/90">
        Relatório de Estoque
      </h1>

      <div className="flex items-center gap-3 flex-wrap">
        <Select defaultValue="todas">
          <SelectTrigger className="w-[200px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as Representadas</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>com estoque abaixo de</span>
          <Input type="number" className="w-24 h-9 text-sm" placeholder="0" />
        </div>

        <Button className="h-9 bg-brand text-white hover:bg-brand/90 font-semibold text-sm">
          Atualizar
        </Button>
      </div>

      <div className="border rounded-md bg-slate-50/50 py-12 flex items-center justify-center">
        <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
          <span className="text-base">ⓘ</span> Nenhuma informação encontrada.
        </p>
      </div>
    </div>
  );
}
