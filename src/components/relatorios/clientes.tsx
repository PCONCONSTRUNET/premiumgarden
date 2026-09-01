import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileSpreadsheet, LayoutGrid, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";

export function Clientes() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-display uppercase tracking-tight text-foreground/90">Clientes</h1>
        <div className="flex items-center gap-2">
          <Input placeholder="Pesquisar cliente..." className="h-8 w-52 text-xs" />
          <Button variant="outline" size="sm" className="h-8">
            <SlidersHorizontal className="h-3.5 w-3.5 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      <div className="space-y-4">
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

        <div className="border rounded-md bg-white">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-bold text-foreground">Razão Social ▾</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Nome Fantasia</TableHead>
                <TableHead className="text-xs font-bold text-foreground">CNPJ / CPF</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Telefone</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Cidade</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Estado</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Segmento</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Situação</TableHead>
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

        <p className="text-xs text-muted-foreground text-right">Resultados 1 - 0 de 0</p>
      </div>
    </div>
  );
}
