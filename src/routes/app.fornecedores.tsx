import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, X, Building2, Phone, MapPin, CreditCard, ShoppingCart, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useConfirm } from "@/contexts/ConfirmContext";

export const Route = createFileRoute("/app/fornecedores")({
  head: () => ({ meta: [{ title: "Fornecedores — VIVAVERDE ERP" }] }),
  component: Fornecedores,
});

function Fornecedores() {
  const confirm = useConfirm();
  const [fornecedores, setFornecedores] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<string, any> | null>(null);

  const fetchFornecedores = async () => {
    try {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setFornecedores(data || []);
    } catch (err: any) {
      console.error(err);
      alert("Erro ao buscar fornecedores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFornecedores();
  }, []);

  const handleDelete = async (id: string) => {
    if (
      !(await confirm({
        description: "Tem certeza que deseja excluir este fornecedor?",
        variant: "destructive",
      }))
    )
      return;
    try {
      const { error } = await supabase.from("fornecedores").delete().eq("id", id);
      if (error) throw error;
      if (selected?.id === id) setSelected(null);
      fetchFornecedores();
    } catch (err: any) {
      alert("Erro ao deletar: " + err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Fornecedores"
        subtitle={`${fornecedores.length} parceiros homologados`}
        actions={
          <Button asChild className="bg-gradient-brand text-primary-foreground">
            <Link to="/app/fornecedor-novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Fornecedor
            </Link>
          </Button>
        }
      />

      <div className="flex gap-4 items-start">
        {/* Tabela */}
        <Card className={`shadow-card overflow-x-auto transition-all duration-300 ${selected ? "flex-1" : "w-full"}`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Última Compra</TableHead>
                <TableHead className="text-right">Valor Movimentado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Carregando fornecedores...
                  </TableCell>
                </TableRow>
              ) : fornecedores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum fornecedor cadastrado ainda.
                  </TableCell>
                </TableRow>
              ) : (
                fornecedores.map((d: Record<string, any>) => (
                  <TableRow
                    key={d.id}
                    className={`cursor-pointer transition-colors ${selected?.id === d.id ? "bg-primary/10" : "hover:bg-muted/50"}`}
                    onClick={() => setSelected(selected?.id === d.id ? null : d)}
                  >
                    <TableCell className="font-semibold">{d.empresa}</TableCell>
                    <TableCell>{d.contato || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{d.cidade || "-"}</TableCell>
                    <TableCell>
                      {d.ultima_compra ? new Date(d.ultima_compra).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      R$ {Number(d.valor_total || 0).toFixed(2).replace(".", ",")}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(d.id)}
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

        {/* Painel lateral de detalhes */}
        {selected && (
          <Card className="shadow-card w-80 shrink-0 animate-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm leading-tight">{selected.empresa}</p>
                  <p className="text-xs text-muted-foreground">Fornecedor</p>
                </div>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelected(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Informações */}
            <div className="p-5 space-y-4">

              {selected.cpf_cnpj && (
                <InfoRow icon={<CreditCard className="h-4 w-4" />} label="CPF / CNPJ" value={selected.cpf_cnpj} />
              )}

              {selected.contato && (
                <InfoRow icon={<Building2 className="h-4 w-4" />} label="Contato" value={selected.contato} />
              )}

              {selected.telefone && (
                <InfoRow icon={<Phone className="h-4 w-4" />} label="Telefone" value={selected.telefone} />
              )}

              {(selected.cidade || selected.endereco) && (
                <InfoRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Localização"
                  value={[selected.endereco, selected.cidade].filter(Boolean).join(" — ")}
                />
              )}

              <div className="border-t pt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <DollarSign className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <p className="text-xs text-muted-foreground">Total Movimentado</p>
                  <p className="font-bold text-sm">
                    R$ {Number(selected.valor_total || 0).toFixed(2).replace(".", ",")}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <ShoppingCart className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <p className="text-xs text-muted-foreground">Última Compra</p>
                  <p className="font-bold text-sm">
                    {selected.ultima_compra
                      ? new Date(selected.ultima_compra).toLocaleDateString("pt-BR")
                      : "—"}
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Cadastrado em {selected.created_at
                  ? new Date(selected.created_at).toLocaleDateString("pt-BR")
                  : "—"}
              </p>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}

interface InfoRowProps { icon: React.ReactNode; label: string; value: string; }
function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
