import { toast } from "sonner";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ClienteSearch = {
  id?: string;
};

export const Route = createFileRoute("/app/cliente-novo")({
  validateSearch: (search: Record<string, unknown>): ClienteSearch => {
    return {
      id: search.id as string | undefined,
    };
  },
  head: () => ({ meta: [{ title: "Novo Cliente — PREMIUM GARDEN" }] }),
  component: NovoCliente,
});

function NovoCliente() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  
  const [tipoPessoa, setTipoPessoa] = useState("PJ");
  const [showCadastroCompleto, setShowCadastroCompleto] = useState(false);

  const [cliente, setCliente] = useState({
    nome: "",
    nome_fantasia: "",
    apelido: "",
    cpf_cnpj: "",
    telefone: "",
    email: "",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    status: "Ativo",
    segmento: "",
    rede: "",
    excecao_fiscal: "",
    informacoes_adicionais: ""
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
            setTipoPessoa(data.cpf_cnpj?.length > 14 ? "PJ" : "PF");
            
            // Basic parsing if old structure used single address field
            let parsedEndereco = data.logradouro || data.endereco || "";
            let parsedNumero = data.numero || "";
            let parsedBairro = data.bairro || "";
            let parsedCep = data.cep || "";
            let parsedUf = data.uf || data.estado || "";

            setCliente({
              ...cliente,
              nome: data.nome || "",
              cpf_cnpj: data.cpf_cnpj || "",
              telefone: data.telefone || "",
              email: data.email || "", // if exists
              cep: parsedCep, 
              endereco: parsedEndereco,
              numero: parsedNumero,
              bairro: parsedBairro,
              cidade: data.cidade || "",
              uf: parsedUf,
              status: data.status || "Ativo",
              segmento: data.segmento || "",
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
    if (tipoPessoa === "PF") {
      return v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4").substring(0, 14);
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

  const buscarCNPJ = async () => {
    const cnpj = cliente.cpf_cnpj.replace(/\D/g, "");
    if (cnpj.length !== 14) {
      toast.error("CNPJ incompleto ou inválido.");
      return;
    }
    
    setLoadingCnpj(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (!response.ok) {
        throw new Error("CNPJ não encontrado ou erro na API");
      }
      const data = await response.json();
      
      setCliente((prev) => ({
        ...prev,
        nome: data.razao_social || prev.nome,
        nome_fantasia: data.nome_fantasia || prev.nome_fantasia,
        telefone: formatTelefone(data.ddd_telefone_1 || prev.telefone),
        cep: formatCep(data.cep || prev.cep),
        endereco: data.logradouro || prev.endereco,
        numero: data.numero || prev.numero,
        complemento: data.complemento || prev.complemento,
        bairro: data.bairro || prev.bairro,
        cidade: data.municipio || prev.cidade,
        uf: data.uf || prev.uf,
      }));
      toast.success("Dados do CNPJ preenchidos com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao buscar CNPJ");
    } finally {
      setLoadingCnpj(false);
    }
  };

  const handleSalvar = async (cadastrarOutro = false) => {
    if (!cliente.nome) {
      toast.error(tipoPessoa === "PJ" ? "Preencha a Razão Social." : "Preencha o Nome.");
      return;
    }

    setLoading(true);
    try {
      // Ignorando campos que não existem no banco por enquanto para não quebrar (segmento, apelido, rede, excecao_fiscal, informacoes_adicionais)
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

      if (cadastrarOutro) {
        setCliente({
          nome: "", nome_fantasia: "", apelido: "", cpf_cnpj: "", telefone: "", email: "",
          cep: "", endereco: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "",
          status: "Ativo", segmento: "", rede: "", excecao_fiscal: "", informacoes_adicionais: ""
        });
        navigate({ to: "/app/cliente-novo" });
        toast.success("Cliente salvo com sucesso!");
      } else {
        navigate({ to: "/app/clientes" });
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar cliente: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <div className="p-4 md:p-8 mx-auto max-w-[1000px] bg-[#f3f4f6]">
        
        <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-8">
          NOVO CLIENTE
        </h1>

        <div className="space-y-8 bg-transparent">
          
          {/* Tipo de Pessoa */}
          <div className="flex items-center gap-6">
            <RadioGroup 
              value={tipoPessoa} 
              onValueChange={(val) => {
                setTipoPessoa(val);
                setCliente({...cliente, cpf_cnpj: ""});
              }}
              className="flex items-center space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PJ" id="pj" className="text-[#4a148c] border-[#4a148c]" />
                <Label htmlFor="pj" className="text-sm cursor-pointer">Pessoa Jurídica</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PF" id="pf" className="text-[#4a148c] border-[#4a148c]" />
                <Label htmlFor="pf" className="text-sm cursor-pointer">Pessoa Física</Label>
              </div>
            </RadioGroup>
          </div>

          {/* CNPJ / CPF e Nome */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="col-span-1 space-y-2">
              <Label className="text-xs text-slate-500 font-medium">{tipoPessoa === "PJ" ? "CNPJ" : "CPF"}</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={cliente.cpf_cnpj}
                  onChange={(e) => setCliente({ ...cliente, cpf_cnpj: formatCpfCnpj(e.target.value) })}
                  className="w-full sm:w-[220px] rounded-sm focus-visible:ring-0 focus-visible:border-[#4a148c]"
                />
                {tipoPessoa === "PJ" && cliente.cpf_cnpj.replace(/\D/g, "").length !== 14 && cliente.cpf_cnpj.length > 0 && (
                  <AlertTriangle className="h-5 w-5 text-slate-800" />
                )}
              </div>
              {tipoPessoa === "PJ" && (
                <button 
                  onClick={buscarCNPJ}
                  disabled={loadingCnpj}
                  className="text-xs font-semibold text-[#4a148c] hover:underline mt-1 block"
                >
                  {loadingCnpj ? "Buscando..." : "Completar cadastro automaticamente"}
                </button>
              )}
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
              <Label className="text-xs text-slate-500 font-medium">
                * {tipoPessoa === "PJ" ? "Razão social" : "Nome"}
              </Label>
              <Input
                value={cliente.nome}
                onChange={(e) => setCliente({ ...cliente, nome: e.target.value })}
                placeholder="obrigatório"
                className="w-full md:w-[600px] rounded-sm focus-visible:ring-0 focus-visible:border-[#4a148c]"
              />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
              <Label className="text-xs text-slate-500 font-medium">
                {tipoPessoa === "PJ" ? "Nome fantasia" : "Apelido"}
              </Label>
              <Input
                value={tipoPessoa === "PJ" ? cliente.nome_fantasia : cliente.apelido}
                onChange={(e) => {
                  if (tipoPessoa === "PJ") setCliente({ ...cliente, nome_fantasia: e.target.value })
                  else setCliente({ ...cliente, apelido: e.target.value })
                }}
                className="w-full md:w-[600px] rounded-sm focus-visible:ring-0 focus-visible:border-[#4a148c]"
              />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
              <Label className="text-xs text-slate-500 font-medium">Telefone</Label>
              <Input
                value={cliente.telefone}
                onChange={(e) => setCliente({ ...cliente, telefone: formatTelefone(e.target.value) })}
                className="w-full md:w-[300px] rounded-sm focus-visible:ring-0 focus-visible:border-[#4a148c]"
              />
              <button className="text-xs font-semibold text-[#4a148c] hover:underline mt-1 block">
                Adicionar telefone
              </button>
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
              <Label className="text-xs text-slate-500 font-medium">E-mail</Label>
              <Input
                value={cliente.email}
                onChange={(e) => setCliente({ ...cliente, email: e.target.value })}
                className="w-full md:w-[300px] rounded-sm focus-visible:ring-0 focus-visible:border-[#4a148c]"
              />
              <button className="text-xs font-semibold text-[#4a148c] hover:underline mt-1 block">
                Adicionar e-mail
              </button>
            </div>
          </div>

          {/* Expansão */}
          <div>
            <button 
              onClick={() => setShowCadastroCompleto(!showCadastroCompleto)}
              className="flex items-center gap-2 text-sm font-semibold text-[#4a148c] hover:underline"
            >
              {showCadastroCompleto ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Preencher cadastro completo: contatos, endereço e informações adicionais
            </button>
          </div>

          {/* Campos Adicionais (Expandidos) */}
          {showCadastroCompleto && (
            <div className="space-y-8 animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 font-medium">Exceção Fiscal</Label>
                  <Select value={cliente.excecao_fiscal} onValueChange={(val) => setCliente({...cliente, excecao_fiscal: val})}>
                    <SelectTrigger className="w-full md:w-[300px] rounded-sm focus:ring-0 focus:border-[#4a148c]">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nenhuma">Nenhuma</SelectItem>
                      <SelectItem value="simples">Simples Nacional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 md:col-start-1">
                  <Label className="text-xs text-slate-500 font-medium">Segmento</Label>
                  <Select value={cliente.segmento} onValueChange={(val) => setCliente({...cliente, segmento: val})}>
                    <SelectTrigger className="w-full md:w-[300px] rounded-sm focus:ring-0 focus:border-[#4a148c]">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="varejo">Varejo</SelectItem>
                      <SelectItem value="atacado">Atacado</SelectItem>
                      <SelectItem value="distribuidor">Distribuidor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-start-1">
                  <Label className="text-xs text-slate-500 font-medium">Rede</Label>
                  <Select value={cliente.rede} onValueChange={(val) => setCliente({...cliente, rede: val})}>
                    <SelectTrigger className="w-full md:w-[300px] rounded-sm focus:ring-0 focus:border-[#4a148c]">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rede_a">Rede A</SelectItem>
                      <SelectItem value="rede_b">Rede B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label className="text-xs text-slate-500 font-medium">Informações adicionais</Label>
                  <Textarea 
                    value={cliente.informacoes_adicionais}
                    onChange={(e) => setCliente({...cliente, informacoes_adicionais: e.target.value})}
                    className="w-full md:w-[600px] min-h-[120px] rounded-sm focus-visible:ring-0 focus-visible:border-[#4a148c]" 
                  />
                  <p className="text-[11px] text-slate-400">Adicione aqui quaisquer informações adicionais sobre este cliente.</p>
                </div>
              </div>

              {/* Endereço Principal */}
              <div className="space-y-6 pt-4">
                <h3 className="text-lg font-light text-slate-500 tracking-wide border-b border-slate-200 pb-2">
                  ENDEREÇO PRINCIPAL
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 max-w-[600px]">
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <Label className="text-xs text-slate-500 font-medium">CEP</Label>
                    <Input
                      value={cliente.cep}
                      onChange={(e) => setCliente({ ...cliente, cep: formatCep(e.target.value) })}
                      className="w-full sm:w-[150px] rounded-sm focus-visible:ring-0 focus-visible:border-[#4a148c]"
                    />
                  </div>
                  
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <Label className="text-xs text-slate-500 font-medium">Endereço</Label>
                    <Input
                      value={cliente.endereco}
                      onChange={(e) => setCliente({ ...cliente, endereco: e.target.value })}
                      className="w-full rounded-sm focus-visible:ring-0 focus-visible:border-[#4a148c]"
                    />
                  </div>

                  <div className="col-span-1 space-y-2">
                    <Label className="text-xs text-slate-500 font-medium">Número</Label>
                    <Input
                      value={cliente.numero}
                      onChange={(e) => setCliente({ ...cliente, numero: e.target.value })}
                      className="w-full sm:w-[150px] rounded-sm focus-visible:ring-0 focus-visible:border-[#4a148c]"
                    />
                  </div>

                  <div className="col-span-1 space-y-2 md:col-start-1">
                    <Label className="text-xs text-slate-500 font-medium">Complemento</Label>
                    <Input
                      value={cliente.complemento}
                      onChange={(e) => setCliente({ ...cliente, complemento: e.target.value })}
                      className="w-full sm:w-[300px] rounded-sm focus-visible:ring-0 focus-visible:border-[#4a148c]"
                    />
                  </div>

                  <div className="col-span-1 space-y-2 md:col-start-1">
                    <Label className="text-xs text-slate-500 font-medium">Bairro</Label>
                    <Input
                      value={cliente.bairro}
                      onChange={(e) => setCliente({ ...cliente, bairro: e.target.value })}
                      className="w-full sm:w-[300px] rounded-sm focus-visible:ring-0 focus-visible:border-[#4a148c]"
                    />
                  </div>

                  <div className="col-span-1 space-y-2 md:col-start-1">
                    <Label className="text-xs text-slate-500 font-medium">Cidade</Label>
                    <Input
                      value={cliente.cidade}
                      onChange={(e) => setCliente({ ...cliente, cidade: e.target.value })}
                      className="w-full sm:w-[300px] rounded-sm focus-visible:ring-0 focus-visible:border-[#4a148c]"
                    />
                  </div>

                  <div className="col-span-1 space-y-2 md:col-start-1">
                    <Label className="text-xs text-slate-500 font-medium">Estado</Label>
                    <Select value={cliente.uf} onValueChange={(val) => setCliente({...cliente, uf: val})}>
                      <SelectTrigger className="w-full sm:w-[300px] rounded-sm focus:ring-0 focus:border-[#4a148c]">
                        <SelectValue placeholder="Selecione o estado..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SP">São Paulo</SelectItem>
                        <SelectItem value="SC">Santa Catarina</SelectItem>
                        <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                        <SelectItem value="MG">Minas Gerais</SelectItem>
                        <SelectItem value="PR">Paraná</SelectItem>
                        <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-8 border-t border-slate-200 flex flex-wrap gap-3 mt-12 pb-12">
            <Button 
              className="bg-[#4a148c] hover:bg-[#4a148c]/90 text-white rounded-sm px-6 h-9"
              onClick={() => handleSalvar(false)}
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar"}
            </Button>
            
            <Button 
              className="bg-[#4a148c] hover:bg-[#4a148c]/90 text-white rounded-sm px-6 h-9"
              onClick={() => handleSalvar(true)}
              disabled={loading}
            >
              Salvar e cadastrar outro
            </Button>
            
            <Button 
              variant="outline"
              asChild
              className="border-slate-300 text-slate-600 rounded-sm px-6 h-9"
            >
              <Link to="/app/clientes">Cancelar</Link>
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
