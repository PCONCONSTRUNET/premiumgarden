import { toast } from "sonner";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { MapPin, Pencil, ChevronDown, Plus, Edit2, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ClienteSearch = {
  id: string;
};

export const Route = createFileRoute("/app/cliente-detalhes")({
  validateSearch: (search: Record<string, unknown>): ClienteSearch => {
    return {
      id: search.id as string,
    };
  },
  head: () => ({ meta: [{ title: "Detalhes do Cliente — PREMIUM GARDEN" }] }),
  component: ClienteDetalhes,
});

function ClienteDetalhes() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [empresaDados, setEmpresaDados] = useState<any>(null);

  useEffect(() => {
    const fetchCliente = async () => {
      try {
        const { data, error } = await supabase
          .from("clientes")
          .select("*")
          .eq("id", id)
          .single();
        if (error) throw error;
        setCliente(data);
      } catch (err: any) {
        console.error(err);
        toast.error("Erro ao buscar detalhes do cliente.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCliente();
    supabase.from("configuracoes").select("*").eq("id", 1).single().then(({ data }) => {
      if (data) setEmpresaDados(data);
    });
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Carregando detalhes do cliente...</div>;
  }

  if (!cliente) {
    return <div className="p-8 text-center text-slate-500">Cliente não encontrado.</div>;
  }

  const enderecoCompleto = [
    cliente.endereco,
    cliente.numero,
    cliente.bairro,
    cliente.cidade,
    cliente.uf,
    cliente.cep
  ].filter(Boolean).join(" - ");

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <div className="p-4 md:p-6 mx-auto max-w-[1400px]">
        
        {/* HEADER BLOCK */}
        <div className="bg-white border border-slate-200 rounded-sm mb-6 p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-wide">
              {cliente.nome}
            </h1>
            <div className="flex flex-wrap gap-2">
              <Button asChild className="bg-[#4a148c] hover:bg-[#4a148c]/90 text-white rounded-sm h-8 px-4">
                <Link to="/app/cliente-novo" search={{ id: cliente.id }}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Alterar
                </Link>
              </Button>
              <Button variant="outline" className="border-slate-300 text-slate-600 rounded-sm h-8 px-4">
                <svg className="w-3.5 h-3.5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Vínculos e Permissões
              </Button>
              <Button variant="outline" className="border-slate-300 text-slate-600 rounded-sm h-8 px-4">
                Mais opções <ChevronDown className="ml-2 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm text-slate-600 mb-6">
            <MapPin className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
            <div>
              <p>{enderecoCompleto || "Endereço não informado"}</p>
              <button className="text-[#4a148c] hover:underline text-xs mt-1 font-medium">Visualizar mapa</button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-center">
            <button className="text-[#4a148c] text-xs font-semibold flex items-center hover:underline">
              <ChevronDown className="h-3.5 w-3.5 mr-1" />
              Ver cadastro completo
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* COLUNA ESQUERDA (Atividades) */}
          <div className="flex-1 space-y-6">
            {/* TAREFAS */}
            <div className="bg-white border border-slate-200 rounded-sm">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Tarefas</h2>
                <Button className="bg-[#4a148c] hover:bg-[#4a148c]/90 text-white h-7 rounded-sm text-xs px-3">
                  Criar tarefa
                </Button>
              </div>
              <div className="p-12 text-center text-sm text-slate-400">
                Crie uma tarefa na agenda para lembrar de contatar este cliente.
              </div>
            </div>

            {/* OPORTUNIDADES ABERTAS */}
            <div className="bg-white border border-slate-200 rounded-sm">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Oportunidades Abertas</h2>
                <Button variant="outline" className="border-slate-300 text-[#4a148c] h-7 rounded-sm text-xs px-3">
                  Criar oportunidade
                </Button>
              </div>
              <div className="p-12 text-center text-sm text-slate-400">
                Acompanhe as oportunidades criadas para seu cliente.
              </div>
            </div>

            {/* PEDIDOS E ATIVIDADES */}
            <div className="bg-white border border-slate-200 rounded-sm">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Pedidos e Atividades</h2>
                <div className="flex gap-2">
                  <Button className="bg-[#4a148c] hover:bg-[#4a148c]/90 text-white h-7 rounded-sm text-xs px-3">
                    Criar pedido
                  </Button>
                  <Button variant="outline" className="border-slate-300 text-[#4a148c] h-7 rounded-sm text-xs px-3">
                    Registrar atividade
                  </Button>
                  <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700 h-7 rounded-sm text-xs px-3 flex items-center">
                    <span className="text-lg leading-none mr-1.5">✨</span>
                    Sugerir reposição
                  </Button>
                </div>
              </div>
              <div className="p-12 text-center text-sm text-slate-400">
                Veja os pedidos criados e registre as atividades realizadas neste cliente.
              </div>
            </div>

            {/* NOTAS FISCAIS */}
            <div className="bg-white border border-slate-200 rounded-sm">
              <div className="p-4 border-b border-slate-100">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Notas Fiscais</h2>
              </div>
              <div className="p-12 text-center text-sm text-slate-400">
                Não há notas fiscais disponíveis no Mercos para este cliente.
              </div>
            </div>

            {/* PRODUTOS MAIS COMPRADOS */}
            <div className="bg-white border border-slate-200 rounded-sm">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg>
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Produtos Mais Comprados</h2>
              </div>
              <div className="p-12 text-center text-sm text-slate-400">
                Não possui compra nos últimos 6 meses.
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA (Resumo) */}
          <div className="w-full lg:w-[350px] shrink-0 space-y-6">
            
            {/* RESUMO */}
            <div className="bg-white border border-slate-200 rounded-sm">
              <div className="p-4 border-b border-slate-100">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Resumo</h2>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-700">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Últimos 6 meses
                </div>
                <div className="bg-slate-50 rounded-sm p-4 flex items-center border border-slate-100 mb-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <div>
                      <span className="font-bold text-lg text-slate-800">0</span>
                      <span className="text-sm text-slate-500 ml-1">Pedidos realizados</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-1 text-[11px] text-slate-400">
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center font-bold text-[8px] mt-0.5">i</span>
                  Apenas pedidos do tipo venda
                </div>
              </div>
            </div>

            {/* LIMITE DE CRÉDITO */}
            <div className="bg-white border border-slate-200 rounded-sm">
              <div className="p-4 border-b border-slate-100">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Limite de Crédito</h2>
              </div>
              <div className="p-4">
                <h3 className="text-[11px] font-bold text-slate-800 uppercase mb-4">{empresaDados?.razao_social || "PREMIUM GARDEN"}</h3>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-[11px] text-slate-500 mb-1">Limite disponível</div>
                    <div className="flex items-center gap-2 text-slate-800 font-semibold">
                      <span className="text-slate-400">$</span> Não definido
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 mb-1">Limite total</div>
                    <div className="flex items-center gap-2 text-slate-800 font-semibold">
                      <span className="text-slate-400">$</span> Não definido
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* TÍTULOS */}
            <div className="bg-white border border-slate-200 rounded-sm">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Títulos</h2>
                <Button variant="ghost" className="h-7 text-[#4a148c] text-xs px-2 hover:bg-[#4a148c]/5 font-semibold">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Adicionar título
                </Button>
              </div>
              <div className="p-4 border-b border-slate-100">
                <div className="flex gap-2">
                  <span className="bg-[#4a148c] text-white text-xs px-3 py-1 rounded-full font-medium">A receber</span>
                  <span className="bg-white text-slate-500 border border-slate-200 text-xs px-3 py-1 rounded-full font-medium hover:bg-slate-50 cursor-pointer">Recebidos</span>
                </div>
              </div>
              <div className="p-12 text-center text-xs text-slate-400">
                Este cliente não possui títulos a receber cadastrados no sistema.
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
