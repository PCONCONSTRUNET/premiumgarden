import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { FileSpreadsheet, SlidersHorizontal } from "lucide-react";

const mockData = [
  { vendedor: "Lucas P.", ativos: 0, inativos: 0, prospects: 0 },
];

export function SituacaoCarteiraPorVendedor() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display tracking-tight text-foreground/90">Situação da carteira de clientes por vendedor</h1>
          <p className="text-sm text-muted-foreground mt-1">Comparativo de carteira entre vendedores.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs font-semibold">
            <FileSpreadsheet className="mr-2 h-3.5 w-3.5" />
            Excel
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            <SlidersHorizontal className="h-3.5 w-3.5 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      <div className="border rounded-md p-4 bg-white h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="vendedor" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <Bar dataKey="ativos" name="Ativos" fill="#7c3aed" radius={[3, 3, 0, 0]} />
            <Bar dataKey="inativos" name="Inativos" fill="#e5e7eb" radius={[3, 3, 0, 0]} />
            <Bar dataKey="prospects" name="Prospects" fill="#a78bfa" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-bold text-foreground">Vendedor ▾</TableHead>
              <TableHead className="text-xs font-bold text-foreground text-right">Ativos</TableHead>
              <TableHead className="text-xs font-bold text-foreground text-right">Inativos</TableHead>
              <TableHead className="text-xs font-bold text-foreground text-right">Prospects</TableHead>
              <TableHead className="text-xs font-bold text-foreground text-right">Total</TableHead>
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
  );
}
