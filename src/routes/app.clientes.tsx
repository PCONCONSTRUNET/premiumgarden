import { toast } from "sonner";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MapPin, Pencil, Trash2, Download, List } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useConfirm } from "@/contexts/ConfirmContext";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/app/clientes")({
  head: () => ({ meta: [{ title: "Clientes — PREMIUM GARDEN" }] }),
  component: Clientes,
});

function Clientes() {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setClientes(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao buscar clientes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !(await confirm({
        description: "Tem certeza que deseja excluir este cliente?",
        variant: "destructive",
      }))
    )
      return;
    try {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
      fetchClientes();
    } catch (err: any) {
      toast.error("Erro ao deletar: " + err.message);
    }
  };

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate({ to: "/app/cliente-novo", search: { id } });
  };

  const ativos = clientes.filter((c) => c.status === "Ativo" || c.status === "Premium").length;
  const inativos = clientes.filter((c) => c.status === "Inativo").length;
  const prospects = 0; // Example placeholder if we don't have this status
  const total = clientes.length;

  const chartData = [
    { name: "Ativos", value: ativos > 0 ? ativos : 1, color: "#22c55e" },
  ];
  if (ativos === 0) chartData[0].color = "#e2e8f0"; // Grey out if 0

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      {/* Container principal ocupando mais espaço na tela */}
      <div className="w-full px-4 md:px-8 lg:px-12 py-6 mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* COLUNA ESQUERDA - LISTAGEM */}
          <div className="flex-1 bg-white border border-slate-200 rounded-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wide">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  CLIENTES
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild className="bg-[#4a148c] hover:bg-[#4a148c]/90 text-white rounded-sm px-6 h-9">
                    <Link to="/app/cliente-novo">
                      <Plus className="mr-2 h-4 w-4" />
                      Cadastrar cliente
                    </Link>
                  </Button>
                  <Button variant="outline" className="border-slate-300 text-slate-600 rounded-sm h-9">
                    <Download className="mr-2 h-4 w-4" />
                    Importar
                  </Button>
                  <Button variant="outline" className="border-slate-300 text-slate-600 rounded-sm h-9">
                    <List className="mr-2 h-4 w-4" />
                    Vínculos e permissões
                  </Button>
                </div>
                <div className="flex items-center">
                  <div className="relative">
                    <Input 
                      placeholder="Pesquise por nome ou CNPJ" 
                      className="w-full md:w-64 h-9 pr-10 rounded-sm rounded-r-none border-slate-300 focus-visible:ring-0 focus-visible:border-[#4a148c]" 
                    />
                  </div>
                  <Button variant="outline" className="h-9 px-3 rounded-sm rounded-l-none border-slate-300 border-l-0 bg-slate-50 hover:bg-slate-100 text-slate-600">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Filtro Rápido */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button className="text-[#4a148c] font-medium hover:underline flex items-center gap-1">
                  Exibir todos os clientes ▾
                </button>
                <div className="text-slate-500">
                  Pesquise por cidade, estado, etc.
                </div>
              </div>

              <div className="border-t border-dashed border-slate-200 mt-4 pt-4">
                {/* Lista de Clientes */}
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8 text-slate-500 text-sm">Carregando clientes...</div>
                  ) : clientes.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">Nenhum cliente encontrado.</div>
                  ) : (
                    clientes.map((c) => (
                      <div 
                        key={c.id} 
                        onClick={() => navigate({ to: "/app/cliente-detalhes", search: { id: c.id } })}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-sm border border-transparent hover:border-slate-200 hover:shadow-sm cursor-pointer transition-all bg-white"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#4a148c] hover:underline text-[15px]">
                              {c.nome}
                            </span>
                            <span className="text-slate-400 text-sm">
                              - {c.segmento || "Comércio de Gêneros Alimentícios LTDA"} 
                              {c.cpf_cnpj ? ` - ${c.cpf_cnpj}` : ""}
                            </span>
                          </div>
                          <div className="flex items-center text-slate-500 text-sm gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {c.cidade ? `${c.cidade}${c.uf ? " - " + c.uf : ""}` : "Endereço não informado"}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4 sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => handleEdit(c.id, e)}
                            className="h-8 text-xs font-semibold text-[#4a148c] border-slate-200 hover:bg-[#4a148c]/5"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1.5" />
                            Alterar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => handleDelete(c.id, e)}
                            className="h-8 text-xs font-semibold text-red-600 border-slate-200 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {!loading && clientes.length > 0 && (
                <div className="flex justify-end pt-4 border-t border-dashed border-slate-200">
                  <span className="text-xs text-[#4a148c] font-medium hover:underline cursor-pointer">
                    Contar registros
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* COLUNA DIREITA - CARTEIRA */}
          <div className="w-full lg:w-[320px] shrink-0">
            <div className="bg-white border border-slate-200 rounded-sm">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide">
                  CARTEIRA DE CLIENTES
                  <span className="text-slate-400 font-normal ml-0.5 cursor-help">ⓘ</span>
                </div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">
                  {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                </div>
              </div>
              
              <div className="p-6 flex flex-col items-center">
                <div className="relative w-40 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        innerRadius={60}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-light text-slate-800">{total}</span>
                    <span className="text-xs text-[#4a148c]">Clientes</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 w-full mt-6">
                  <div className="flex items-center gap-2 text-xs text-slate-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                    <span className="font-semibold">{ativos}</span> ativos
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                    <span className="font-semibold">{inativos}</span> inativos recentes
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <span className="font-semibold">0</span> inativos antigos
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span>
                    <span className="font-semibold">{prospects}</span> prospects
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <Button className="w-full bg-white hover:bg-slate-50 text-[#4a148c] border border-slate-200 shadow-sm font-semibold h-9 rounded-sm">
                  <List className="mr-2 h-4 w-4" /> Detalhar carteira
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
