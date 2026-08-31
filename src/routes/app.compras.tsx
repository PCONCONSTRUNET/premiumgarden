import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useConfirm } from "@/contexts/ConfirmContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/app/compras")({
  head: () => ({ meta: [{ title: "Compras — VIVAVERDE ERP" }] }),
  component: Compras,
});

function Compras() {
  const confirm = useConfirm();
  const [compras, setCompras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States for Details Sheet
  const [selectedCompra, setSelectedCompra] = useState<any>(null);
  const [openSheet, setOpenSheet] = useState(false);
  const [compraItens, setCompraItens] = useState<any[]>([]);
  const [loadingItens, setLoadingItens] = useState(false);

  const fetchCompras = async () => {
    try {
      const { data, error } = await supabase
        .from("compras")
        .select(`*, fornecedores (empresa)`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCompras(data || []);
    } catch (err: any) {
      console.error(err);
      alert("Erro ao buscar compras.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompras();
  }, []);

  const handleDelete = async (id: string) => {
    if (
      !(await confirm({
        description: "Tem certeza que deseja excluir esta compra?",
        variant: "destructive",
      }))
    )
      return;
    try {
      const { error } = await supabase.from("compras").delete().eq("id", id);
      if (error) throw error;
      fetchCompras();
    } catch (err: any) {
      alert("Erro ao deletar: " + err.message);
    }
  };

  const getTone = (status: string) => {
    if (status === "Recebido") return "bg-success/15 text-success border-0";
    if (status === "Em trânsito") return "bg-info/15 text-info border-0";
    if (status === "Aprovado") return "bg-primary/10 text-primary border-0 font-semibold";
    return "bg-warning/15 text-warning border-0 font-semibold"; // Pendente
  };

  const handleOpenDetails = async (compra: any) => {
    setSelectedCompra(compra);
    setOpenSheet(true);
    setLoadingItens(true);
    try {
      const { data, error } = await supabase
        .from("compras_itens")
        .select("*, produtos(nome)")
        .eq("compra_id", compra.id);
      if (!error && data) setCompraItens(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingItens(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("compras").update({ status: newStatus }).eq("id", id);
      if (error) throw error;

      setSelectedCompra((prev: any) => ({ ...prev, status: newStatus }));
      setCompras((prev) => prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)));
    } catch (err: any) {
      alert("Erro ao atualizar status: " + err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Compras"
        subtitle="Pedidos de compra e recebimento de mercadorias"
        actions={
          <>
            <Button className="bg-gradient-brand text-primary-foreground" asChild>
              <Link to="/app/compra-nova">
                <Plus className="mr-2 h-4 w-4" />
                Nova Compra
              </Link>
            </Button>
          </>
        }
      />
      <Card className="shadow-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Carregando compras...
                </TableCell>
              </TableRow>
            ) : compras.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma compra registrada.
                </TableCell>
              </TableRow>
            ) : (
              compras.map((o) => (
                <TableRow
                  key={o.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleOpenDetails(o)}
                >
                  <TableCell className="font-mono text-xs">
                    {o.id.substring(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {o.fornecedores?.empresa ||
                      (o.fornecedor_id ? "Fornecedor Removido" : "Sem Fornecedor")}
                  </TableCell>
                  <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right font-semibold">
                    R$ {Number(o.valor_total).toFixed(2).replace(".", ",")}
                  </TableCell>
                  <TableCell>
                    <Badge className={getTone(o.status)}>{o.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(o.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent className="w-[400px] sm:w-[540px] sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes da Compra</SheetTitle>
            <SheetDescription>
              Compra Nº {selectedCompra?.id?.substring(0, 8).toUpperCase()}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider">
                  Fornecedor
                </span>
                <span className="font-medium">
                  {selectedCompra?.fornecedores?.empresa ||
                    (selectedCompra?.fornecedor_id ? "Fornecedor Removido" : "Sem Fornecedor")}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider">
                  Data
                </span>
                <span className="font-medium">
                  {selectedCompra ? new Date(selectedCompra.created_at).toLocaleDateString() : "-"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
                  Status
                </span>
                <Select
                  value={selectedCompra?.status || ""}
                  onValueChange={(val) => handleStatusChange(selectedCompra.id, val)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Aprovado">Aprovado</SelectItem>
                    <SelectItem value="Em trânsito">Em trânsito</SelectItem>
                    <SelectItem value="Recebido">Recebido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider">
                  Total
                </span>
                <span className="font-bold text-base">
                  R${" "}
                  {Number(selectedCompra?.valor_total || 0).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="font-semibold mb-4 flex items-center justify-between">
                <span>Produtos Comprados</span>
                <Badge variant="outline">{compraItens.length} itens</Badge>
              </h4>
              {loadingItens ? (
                <p className="text-sm text-muted-foreground">Carregando itens...</p>
              ) : compraItens.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum item encontrado.</p>
              ) : (
                <div className="space-y-3">
                  {compraItens.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-md border bg-card"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {item.quantidade}x {item.produtos?.nome || "Produto Desconhecido"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Custo unitário: R${" "}
                          {Number(item.valor_unitario).toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                      <span className="font-semibold text-sm">
                        R$ {Number(item.subtotal).toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
