import { toast } from "sonner";
import { formatCpfCnpj, formatPhone } from "@/lib/utils";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, ArrowLeft, Search } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Link } from "@tanstack/react-router";
import { CnpjLoader } from "@/components/cnpj-loader";

export const Route = createFileRoute("/app/fornecedor-novo")({
  head: () => ({ meta: [{ title: "Novo Fornecedor — PREMIUM GARDEN" }] }),
  component: NovoFornecedor,
});

function NovoFornecedor() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingCnpj, setLoadingCnpj] = useState(false);

  const [fornecedor, setFornecedor] = useState({
    empresa: "",
    contato: "",
    telefone: "",
    cpf_cnpj: "",
    endereco: "",
    cidade: "",
    valor_total: 0,
  });

  const buscarCnpj = async (doc: string) => {
    const cnpjLimpo = doc.replace(/\D/g, "");
    if (cnpjLimpo.length !== 14) return;
    
    const start = Date.now();
    setLoadingCnpj(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      if (!res.ok) {
        toast.error("CNPJ não encontrado na Receita Federal.");
        return;
      }
      const data = await res.json();
      
      const tel = data.ddd_telefone_1 ? data.ddd_telefone_1.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3") : "";
      const tipoLogradouro = data.descricao_tipo_de_logradouro ? data.descricao_tipo_de_logradouro + " " : "";
      const cidade = data.municipio ? data.municipio.charAt(0) + data.municipio.slice(1).toLowerCase() : "";
      
      setFornecedor((prev) => ({
        ...prev,
        empresa: data.razao_social || prev.empresa,
        telefone: tel || prev.telefone,
        endereco: tipoLogradouro + (data.logradouro || "") + (data.numero ? `, ${data.numero}` : "") + (data.bairro ? ` - ${data.bairro}` : ""),
        cidade: cidade ? `${cidade}/${data.uf || ""}` : prev.cidade,
      }));
      toast.success("Dados do fornecedor preenchidos via Receita Federal!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao consultar o CNPJ.");
    } finally {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 2000 - elapsed);
      await new Promise((r) => setTimeout(r, remaining));
      setLoadingCnpj(false);
    }
  };

  const handleSalvar = async () => {
    if (!fornecedor.empresa) {
      toast.error("Preencha o nome da empresa.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("fornecedores").insert([fornecedor]);
      if (error) throw error;

      navigate({ to: "/app/fornecedores" });
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar fornecedor: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loadingCnpj && <CnpjLoader />}
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
              <div className="flex gap-2">
                <Input
                  value={fornecedor.cpf_cnpj}
                  onChange={(e) => {
                    const formatted = formatCpfCnpj(e.target.value);
                    setFornecedor({ ...fornecedor, cpf_cnpj: formatted });
                    if (formatted.replace(/\D/g, "").length === 14) {
                      buscarCnpj(formatted);
                    }
                  }}
                  onBlur={(e) => buscarCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="px-3 shrink-0"
                  onClick={() => buscarCnpj(fornecedor.cpf_cnpj)}
                  title="Buscar dados do CNPJ"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
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
                onChange={(e) => setFornecedor({ ...fornecedor, telefone: formatPhone(e.target.value) })}
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
