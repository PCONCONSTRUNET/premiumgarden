import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Link } from "@tanstack/react-router";

type ClienteSearch = {
  id?: string;
};

export const Route = createFileRoute("/app/cliente-novo")({
  validateSearch: (search: Record<string, unknown>): ClienteSearch => {
    return {
      id: search.id as string | undefined,
    };
  },
  head: () => ({ meta: [{ title: "Novo Cliente — VIVAVERDE ERP" }] }),
  component: NovoCliente,
});

function NovoCliente() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [cliente, setCliente] = useState({
    nome: "",
    cpf_cnpj: "",
    telefone: "",
    cep: "",
    endereco: "",
    numero: "",
    bairro: "",
    cidade: "",
    uf: "",
    status: "Ativo",
  });

  const isEditing = !!id;

  useEffect(() => {
    if (id) {
      const fetchCliente = async () => {
        try {
          const { data, error } = await supabase
            .from("clientes")
            .select("*")
            .eq("id", id)
            .single();
          
          if (error) throw error;
          if (data) {
            let parsedEndereco = data.logradouro || data.endereco || "";
            let parsedNumero = data.numero || "";
            let parsedBairro = data.bairro || "";
            let parsedCep = data.cep || "";
            let parsedUf = data.uf || data.estado || "";

            if (parsedEndereco) {
              const parts = parsedEndereco.split(",").map((p: string) => p.trim());
              const newEnderecoParts: string[] = [];
              let foundConcat = false;

              for (const part of parts) {
                if (part.startsWith("nº ")) {
                  if (!parsedNumero) parsedNumero = part.substring(3);
                  foundConcat = true;
                } else if (part.startsWith("Bairro ")) {
                  if (!parsedBairro) parsedBairro = part.substring(7);
                  foundConcat = true;
                } else if (part.startsWith("CEP ")) {
                  if (!parsedCep) parsedCep = part.substring(4);
                  foundConcat = true;
                } else {
                  newEnderecoParts.push(part);
                }
              }
              
              if (foundConcat) {
                parsedEndereco = newEnderecoParts.join(", ");
              }
            }

            setCliente({
              nome: data.nome || "",
              cpf_cnpj: data.cpf_cnpj || "",
              telefone: data.telefone || "",
              cep: parsedCep, 
              endereco: parsedEndereco,
              numero: parsedNumero,
              bairro: parsedBairro,
              cidade: data.cidade || "",
              uf: parsedUf,
              status: data.status || "Ativo",
            });
          }
        } catch (err) {
          console.error("Erro ao buscar cliente para edição", err);
        }
      };
      fetchCliente();
    }
  }, [id]);

  const formatCpfCnpj = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length <= 11) {
      return v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
    } else {
      return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, "$1.$2.$3/$4-$5").substring(0, 18);
    }
  };

  const formatTelefone = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length <= 10) {
      return v.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    } else {
      return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3").substring(0, 15);
    }
  };

  const formatCep = (v: string) => {
    v = v.replace(/\D/g, "");
    return v.replace(/(\d{5})(\d{3})/, "$1-$2").substring(0, 9);
  };

  const handleSalvar = async () => {
    if (!cliente.nome) {
      alert("Preencha o nome do cliente.");
      return;
    }

    setLoading(true);
    try {
      // Envia apenas as colunas conhecidas da tabela clientes
      const payload: any = {
        nome: cliente.nome,
        cpf_cnpj: cliente.cpf_cnpj || null,
        telefone: cliente.telefone || null,
        cidade: cliente.cidade || null,
        uf: cliente.uf || null,
        status: cliente.status,
        endereco: cliente.endereco || null,
        numero: cliente.numero || null,
        bairro: cliente.bairro || null,
        cep: cliente.cep || null,
      };

      let error;
      if (isEditing) {
        const res = await supabase.from("clientes").update(payload).eq("id", id);
        error = res.error;
      } else {
        const res = await supabase.from("clientes").insert([payload]);
        error = res.error;
      }

      if (error) throw error;

      navigate({ to: "/app/clientes" });
    } catch (err: any) {
      console.error(err);
      alert("Erro ao salvar cliente: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title={isEditing ? "Editar Cliente" : "Novo Cliente"}
        subtitle={isEditing ? "Altere os dados do cliente selecionado" : "Cadastre um novo cliente no sistema"}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/app/clientes">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Link>
            </Button>
            <Button
              className="bg-gradient-brand text-primary-foreground"
              onClick={handleSalvar}
              disabled={loading}
            >
              <Save className="mr-2 h-4 w-4" /> {loading ? "Salvando..." : (isEditing ? "Salvar Alterações" : "Salvar Cliente")}
            </Button>
          </>
        }
      />

      <Card className="shadow-card p-6 max-w-2xl mx-auto space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome / Razão Social</Label>
              <Input
                value={cliente.nome}
                onChange={(e) => setCliente({ ...cliente, nome: e.target.value })}
                placeholder="Ex: Jardim Verde Ltda"
              />
            </div>
            <div className="space-y-2">
              <Label>CPF / CNPJ (Opcional)</Label>
              <Input
                value={cliente.cpf_cnpj}
                onChange={(e) =>
                  setCliente({ ...cliente, cpf_cnpj: formatCpfCnpj(e.target.value) })
                }
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={cliente.telefone}
                onChange={(e) =>
                  setCliente({ ...cliente, telefone: formatTelefone(e.target.value) })
                }
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={cliente.status}
                onChange={(e) => setCliente({ ...cliente, status: e.target.value })}
              >
                <option>Ativo</option>
                <option>Premium</option>
                <option>Inativo</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4 mt-4">
            <h4 className="font-semibold text-sm text-muted-foreground">Endereço (Opcional)</h4>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2 col-span-1">
                <Label>CEP</Label>
                <Input
                  value={cliente.cep}
                  onChange={(e) => setCliente({ ...cliente, cep: formatCep(e.target.value) })}
                  placeholder="00000-000"
                />
              </div>
              <div className="space-y-2 col-span-3">
                <Label>Logradouro / Endereço</Label>
                <Input
                  value={cliente.endereco}
                  onChange={(e) => setCliente({ ...cliente, endereco: e.target.value })}
                  placeholder="Ex: Rua das Flores"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2 col-span-1">
                <Label>Número</Label>
                <Input
                  value={cliente.numero}
                  onChange={(e) => setCliente({ ...cliente, numero: e.target.value })}
                  placeholder="Ex: 123 ou SN"
                />
              </div>
              <div className="space-y-2 col-span-1">
                <Label>Bairro</Label>
                <Input
                  value={cliente.bairro}
                  onChange={(e) => setCliente({ ...cliente, bairro: e.target.value })}
                  placeholder="Centro"
                />
              </div>
              <div className="space-y-2 col-span-1">
                <Label>Cidade</Label>
                <Input
                  value={cliente.cidade}
                  onChange={(e) => setCliente({ ...cliente, cidade: e.target.value })}
                  placeholder="Ex: São Paulo"
                />
              </div>
              <div className="space-y-2 col-span-1">
                <Label>UF</Label>
                <Input
                  value={cliente.uf}
                  onChange={(e) => setCliente({ ...cliente, uf: e.target.value })}
                  placeholder="Ex: SP"
                  maxLength={2}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
