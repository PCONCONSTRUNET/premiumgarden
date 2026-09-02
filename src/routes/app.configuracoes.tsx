import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database, PackageOpen, Plus, Building2, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/app/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — PREMIUM GARDEN" }] }),
  component: Configuracoes,
});

function Configuracoes() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("empresa");
  const [novaCategoria, setNovaCategoria] = useState("");

  const [empresa, setEmpresa] = useState({
    razao_social: "",
    cnpj: "",
    endereco: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadEmpresa() {
      const { data } = await supabase.from("configuracoes").select("*").eq("id", 1).single();
      if (data) {
        setEmpresa({
          razao_social: data.razao_social || "",
          cnpj: data.cnpj || "",
          endereco: data.endereco || "",
        });
      }
    }
    loadEmpresa();
  }, []);

  const handleSaveEmpresa = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from("configuracoes").upsert({
        id: 1,
        razao_social: empresa.razao_social,
        cnpj: empresa.cnpj,
        endereco: empresa.endereco,
      });
      if (error) throw error;
      toast.success("Dados da empresa salvos com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar dados: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      {/* Top Tabs */}
      <div className="bg-white border-b px-6 pt-4 flex gap-6 text-sm font-semibold text-muted-foreground uppercase tracking-wide overflow-x-auto">
        <Link to="/app/produtos" className="pb-3 flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors whitespace-nowrap text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
          Produtos
        </Link>
        <Link to="/app/promocoes" className="pb-3 flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors whitespace-nowrap text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          Promoções
        </Link>
        <Link to="/app/produtos" className="pb-3 flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors whitespace-nowrap text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Destaques
        </Link>
        <Link to="/app/configuracoes" className="border-b-2 border-brand text-brand pb-3 flex items-center gap-2 cursor-pointer whitespace-nowrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          Configurações
        </Link>
      </div>

      {/* Sub Tabs */}
      <div className="bg-white border-b px-6 flex gap-6 text-sm text-muted-foreground overflow-x-auto">
        <div 
          className={`py-3 flex items-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === 'empresa' ? 'border-b-2 border-foreground text-foreground font-bold' : 'hover:text-foreground transition-colors font-medium'}`}
          onClick={() => setActiveTab('empresa')}
        >
          <Building2 className="w-4 h-4" />
          Perfil da Empresa
        </div>
        <div 
          className={`py-3 flex items-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === 'categorias' ? 'border-b-2 border-foreground text-foreground font-bold' : 'hover:text-foreground transition-colors font-medium'}`}
          onClick={() => setActiveTab('categorias')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          Categorias
        </div>
        <div 
          className={`py-3 flex items-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === 'variacoes' ? 'border-b-2 border-foreground text-foreground font-bold' : 'hover:text-foreground transition-colors font-medium'}`}
          onClick={() => setActiveTab('variacoes')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v8"></path><path d="M8 12h8"></path></svg>
          Variações de produto
        </div>
        <div 
          className={`py-3 flex items-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === 'inatividade' ? 'border-b-2 border-foreground text-foreground font-bold' : 'hover:text-foreground transition-colors font-medium'}`}
          onClick={() => setActiveTab('inatividade')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          Período de inatividade
        </div>
        <div 
          className={`py-3 flex items-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === 'tributacoes' ? 'border-b-2 border-foreground text-foreground font-bold' : 'hover:text-foreground transition-colors font-medium'}`}
          onClick={() => setActiveTab('tributacoes')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          Tributações
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-full mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-border/50 min-h-[60vh] flex flex-col">
          
          {activeTab === 'empresa' && (
            <div className="p-6 md:p-8 max-w-2xl">
              <h2 className="text-xl font-bold mb-6 text-slate-800">Dados da Empresa</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Razão Social / Nome</Label>
                  <Input 
                    value={empresa.razao_social}
                    onChange={(e) => setEmpresa({...empresa, razao_social: e.target.value})}
                    placeholder="Ex: GARDEN PREMIUM PRODUTOS JARDINAGEM LTDA"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input 
                    value={empresa.cnpj}
                    onChange={(e) => setEmpresa({...empresa, cnpj: e.target.value})}
                    placeholder="Ex: 46.595.008/0001-49"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Endereço Completo</Label>
                  <Input 
                    value={empresa.endereco}
                    onChange={(e) => setEmpresa({...empresa, endereco: e.target.value})}
                    placeholder="Rua Antonieta da Silva Gomes, 316..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">Este endereço será exibido nos comprovantes e faturamentos gerados pelo sistema.</p>
                </div>
                <div className="pt-4">
                  <Button onClick={handleSaveEmpresa} disabled={loading} className="bg-brand text-white w-full sm:w-auto">
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'categorias' && (
            <>
              <div className="p-4 border-b flex items-center gap-2">
                <Input 
                  placeholder="Criar nova categoria" 
                  className="max-w-xs border-brand text-sm h-9"
                  value={novaCategoria}
                  onChange={(e) => setNovaCategoria(e.target.value)}
                />
                <Button className="bg-[#4b2781] hover:bg-[#4b2781]/90 h-9 px-6 font-medium text-xs">
                  OK
                </Button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
                <div className="mb-6 relative">
                  <div className="w-24 h-24 flex items-center justify-center text-[#a896bd]">
                    <Database className="w-16 h-16" strokeWidth={1} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhuma categoria cadastrada</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Organize seus produtos em até 3 níveis de categorias para que clientes e usuários encontrem eles rapidamente. Vamos começar?
                </p>
              </div>
            </>
          )}

          {activeTab === 'variacoes' && (
            <>
              <div className="p-4 border-b">
                <Button className="bg-[#4b2781] hover:bg-[#4b2781]/90 h-9 px-4 font-medium text-xs">
                  <Plus className="w-4 h-4 mr-2" /> Nova variação
                </Button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
                <div className="mb-6 relative">
                  <div className="w-32 h-24 flex items-center justify-center text-[#a896bd] relative">
                    <PackageOpen className="w-16 h-16" strokeWidth={1} />
                    <div className="absolute top-2 left-0 w-8 h-8 rounded-full border border-[#a896bd] bg-white flex items-center justify-center text-xs font-bold">GG</div>
                    <div className="absolute bottom-2 left-6 w-6 h-6 rounded-full border border-[#a896bd] bg-white flex items-center justify-center text-[10px] font-bold">PP</div>
                    <div className="absolute top-8 left-12 w-10 h-10 rounded-full border border-[#a896bd] bg-white flex items-center justify-center text-sm font-bold z-10 shadow-sm">M</div>
                    <div className="absolute top-0 right-6 w-8 h-8 rounded-full border border-[#a896bd] bg-white flex items-center justify-center text-xs font-bold">G</div>
                    <div className="absolute bottom-4 right-0 w-8 h-8 rounded-full border border-[#a896bd] bg-white flex items-center justify-center text-xs font-bold">XG</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhuma variação cadastrada</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Cadastre aqui as variações existentes em seu catálogo de produtos, como Cores, Tamanhos, Acabamentos, Voltagens, etc.<br/>Vamos começar?
                </p>
              </div>
            </>
          )}

          {(activeTab === 'inatividade' || activeTab === 'tributacoes') && (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground">
              Seção em desenvolvimento.
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
