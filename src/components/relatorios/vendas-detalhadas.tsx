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
import { FileSpreadsheet, Heart, Lightbulb, LayoutGrid, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

export function VendasDetalhadas() {
  const [showBanner, setShowBanner] = useState(true);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display tracking-tight text-foreground/90">Vendas detalhadas</h1>
          <p className="text-sm text-muted-foreground mt-1">Explore as vendas pedido a pedido.</p>
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
            Para uma visão geral com agrupamentos e comparação entre períodos, acesse o relatório Resumo de vendas.
          </p>
          <button 
            onClick={() => setShowBanner(false)}
            className="absolute right-3 top-3.5 text-purple-700 hover:text-purple-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="shadow-none border-border/50 bg-background/50">
          <CardContent className="p-5 flex flex-col items-center justify-center">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2">Pedidos</p>
            <p className="font-display text-2xl font-bold">0</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border/50 bg-background/50">
          <CardContent className="p-5 flex flex-col items-center justify-center">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2 text-center">Clientes atendidos</p>
            <p className="font-display text-2xl font-bold">0</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border/50 bg-background/50">
          <CardContent className="p-5 flex flex-col items-center justify-center">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2">Total dos pedidos</p>
            <p className="font-display text-2xl font-bold">R$ 0,00</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border/50 bg-background/50">
          <CardContent className="p-5 flex flex-col items-center justify-center">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2">Total em produtos</p>
            <p className="font-display text-2xl font-bold">R$ 0,00</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border/50 bg-background/50">
          <CardContent className="p-5 flex flex-col items-center justify-center">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2">Ticket médio</p>
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
                <TableHead className="text-xs font-bold text-foreground">Data de emissão ▾</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Pedido</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Razão Social</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Nome Fantasia</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Vendedor(a)</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Condição de pagamento</TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">Total do pedido</TableHead>
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
      </div>
    </div>
  );
}
