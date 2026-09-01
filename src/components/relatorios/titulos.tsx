import { Card, CardContent } from "@/components/ui/card";
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

export function Titulos() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-display uppercase tracking-tight text-foreground/90">Títulos</h1>
        <Button variant="outline" size="sm" className="h-8">
          <SlidersHorizontal className="h-3.5 w-3.5 mr-2" />
          Filtros
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-none border-border/50 bg-background/50">
          <CardContent className="p-5 flex flex-col items-center justify-center">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2">Valor total em títulos</p>
            <p className="font-display text-2xl font-bold">R$ 0,00</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border/50 bg-background/50">
          <CardContent className="p-5 flex flex-col items-center justify-center">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2">Valor em títulos pagos</p>
            <p className="font-display text-2xl font-bold">R$ 0,00</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border/50 bg-background/50">
          <CardContent className="p-5 flex flex-col items-center justify-center">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2 text-center">Valor em títulos vencidos</p>
            <p className="font-display text-2xl font-bold">R$ 0,00</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border/50 bg-background/50">
          <CardContent className="p-5 flex flex-col items-center justify-center">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2 text-center">Valor em títulos a vencer</p>
            <p className="font-display text-2xl font-bold">R$ 0,00</p>
          </CardContent>
        </Card>
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
                <TableHead className="text-xs font-bold text-foreground">Razão Social</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Data de vencimento</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Valor do título</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Situação do título ▾</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Documento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground bg-slate-50/50">
                  Não há dados para exibir.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
