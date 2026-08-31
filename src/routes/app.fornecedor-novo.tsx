import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/app/fornecedor-novo")({
  head: () => ({ meta: [{ title: "Novo Fornecedor — VIVAVERDE ERP" }] }),
  component: NovoFornecedor,
});

function NovoFornecedor() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [fornecedor, setFornecedor] = useState({
    empresa: "",
    contato: "",
    telefone: "",
    cpf_cnpj: "",
    endereco: "",
    cidade: "",
    valor_total: 0,
  });

  const handleSalvar = async () => {
    if (!fornecedor.empresa) {
      alert("Preencha o nome da empresa.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("fornecedores").insert([fornecedor]);
      if (error) throw error;

      navigate({ to: "/app/fornecedores" });
    } catch (err: any) {
      console.error(err);
      alert("Erro ao salvar fornecedor: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Novo Fornecedor"
        subtitle="Cadastre um novo fornecedor no sistema"
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/app/fornecedores">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Link>
            </Button>
            <Button
              className="bg-gradient-brand text-primary-foreground"
              onClick={handleSalvar}
              disabled={loading}
            >
              <Save className="mr-2 h-4 w-4" /> {loading ? "Salvando..." : "Salvar Fornecedor"}
            </Button>
          </>
        }
      />

      <Card className="shadow-card p-6 max-w-2xl mx-auto space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome da Empresa *</Label>
              <Input
                value={fornecedor.empresa}
                onChange={(e) => setFornecedor({ ...fornecedor, empresa: e.target.value })}
                placeholder="Ex: Plasvale Indústria"
              />
            </div>
            <div className="space-y-2">
              <Label>CPF ou CNPJ (Opcional)</Label>
              <Input
                value={fornecedor.cpf_cnpj}
                onChange={(e) => setFornecedor({ ...fornecedor, cpf_cnpj: e.target.value })}
                placeholder="00.000.000/0001-00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Contato</Label>
              <Input
                value={fornecedor.contato}
                onChange={(e) => setFornecedor({ ...fornecedor, contato: e.target.value })}
                placeholder="Ex: Roberto Almeida"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone (Opcional)</Label>
              <Input
                value={fornecedor.telefone}
                onChange={(e) => setFornecedor({ ...fornecedor, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Endereço Completo (Opcional)</Label>
              <Input
                value={fornecedor.endereco}
                onChange={(e) => setFornecedor({ ...fornecedor, endereco: e.target.value })}
                placeholder="Rua, Número, Bairro"
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade / Estado</Label>
              <Input
                value={fornecedor.cidade}
                onChange={(e) => setFornecedor({ ...fornecedor, cidade: e.target.value })}
                placeholder="Ex: Joinville/SC"
              />
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
