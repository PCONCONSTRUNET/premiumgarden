import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const data = [
  { name: "Ativos", value: 0, color: "#7c3aed" },
  { name: "Inativos", value: 0, color: "#e5e7eb" },
  { name: "Prospects", value: 0, color: "#a78bfa" },
];

export function SituacaoCarteira() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display tracking-tight text-foreground/90">Situação da carteira de clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">Visualize a composição da sua carteira de clientes por status.</p>
        </div>
        <Button variant="outline" size="sm" className="h-8">
          <SlidersHorizontal className="h-3.5 w-3.5 mr-2" />
          Filtros
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select defaultValue="todos_segmentos">
          <SelectTrigger className="w-[200px] h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos_segmentos">Todos os segmentos</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="todos_estados">
          <SelectTrigger className="w-[200px] h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos_estados">Todos os estados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="border rounded-md p-4 bg-white h-72 flex items-center justify-center">
            <div className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    dataKey="value"
                    label={false}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} clientes`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {data.map((item) => (
            <Card key={item.name} className="shadow-none border-border/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{item.name}</p>
                  <p className="text-2xl font-display font-bold">0</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="shadow-none border-border/50">
        <CardContent className="p-5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Ciclo médio de compra</p>
          <p className="text-2xl font-display font-bold">0 dias</p>
        </CardContent>
      </Card>
    </div>
  );
}
