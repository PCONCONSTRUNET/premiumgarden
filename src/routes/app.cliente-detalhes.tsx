import { toast } from "sonner";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { MapPin, Pencil, ChevronDown, Plus, FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const [vendas, setVendas] = useState<any[]>([]);
  const [tarefas, setTarefas] = useState<any[]>([]);

  // Modal states
  const [openTarefa, setOpenTarefa] = useState(false);
  const [openAtividade, setOpenAtividade] = useState(false);
  const [salvandoTarefa, setSalvandoTarefa] = useState(false);
  const [salvandoAtividade, setSalvandoAtividade] = useState(false);
  const [tarefaTitulo, setTarefaTitulo] = useState("");
  const [tarefaData, setTarefaData] = useState("");
  const [atividadeDesc, setAtividadeDesc] = useState("");

  const fetchTarefas = async () => {
    const { data } = await supabase
      .from("tarefas")
      .select("id, titulo, data_vencimento, status")
      .eq("cliente_id", id)
      .order("data_vencimento", { ascending: true })
      .limit(5);
    if (data) setTarefas(data);
  };

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

    const fetchVendas = async () => {
      const { data, error } = await supabase
        .from("vendas")
        .select("id, numero, valor_total, total, status, status_aprovacao, created_at")
        .eq("cliente_id", id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) console.error("Erro ao buscar vendas do cliente:", error);
      if (data) setVendas(data);
    };

    if (id) {
      fetchCliente();
      fetchVendas();
      fetchTarefas();
    }
  }, [id]);

  const handleCriarPedido = () => {
    navigate({ to: "/app/venda-nova", search: { cliente_id: id } as any });
  };

  const handleSugerirReposicao = () => {
    toast.info("Analisando histórico de compras para sugestão...");
  };

  const handleSalvarTarefa = async () => {
    if (!tarefaTitulo.trim()) {
      toast.info("Informe o título da tarefa.");
      return;
    }
    setSalvandoTarefa(true);
    try {
      const { error } = await supabase.from("tarefas").insert({
        titulo: tarefaTitulo,
        data_vencimento: tarefaData || null,
        cliente_id: id,
        status: "Pendente",
      });
      if (error) throw error;
      toast.success("Tarefa criada com sucesso!");
      setTarefaTitulo("");
      setTarefaData("");
      setOpenTarefa(false);
      fetchTarefas();
    } catch (err: any) {
      toast.error("Erro ao criar tarefa: " + err.message);
    } finally {
      setSalvandoTarefa(false);
    }
  };

  const handleSalvarAtividade = async () => {
    if (!atividadeDesc.trim()) {
      toast.info("Informe a descrição da atividade.");
      return;
    }
    setSalvandoAtividade(true);
    try {
      const { error } = await supabase.from("tarefas").insert({
        titulo: atividadeDesc,
        cliente_id: id,
        status: "Concluída",
      });
      if (error) throw error;
      toast.success("Atividade registrada!");
      setAtividadeDesc("");
      setOpenAtividade(false);
    } catch (err: any) {
      toast.error("Erro ao registrar atividade: " + err.message);
    } finally {
      setSalvandoAtividade(false);
    }
  };

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
                <Button
                  className="bg-[#4a148c] hover:bg-[#4a148c]/90 text-white h-7 rounded-sm text-xs px-3"
                  onClick={() => setOpenTarefa(true)}
                >
                  Criar tarefa
                </Button>
              </div>
              {tarefas.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-400">
                  Crie uma tarefa na agenda para lembrar de contatar este cliente.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {tarefas.map(t => (
                    <div key={t.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{t.titulo}</p>
                        {t.data_vencimento && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            Vence: {new Date(t.data_vencimento).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        t.status === "Concluída" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>{t.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PEDIDOS E ATIVIDADES */}
            <div className="bg-white border border-slate-200 rounded-sm">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Pedidos e Atividades</h2>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    className="bg-[#4a148c] hover:bg-[#4a148c]/90 text-white h-7 rounded-sm text-xs px-3"
                    onClick={handleCriarPedido}
                  >
                    Criar pedido
                  </Button>
                  <Button
                    variant="outline"
                    className="border-slate-300 text-[#4a148c] h-7 rounded-sm text-xs px-3"
                    onClick={() => setOpenAtividade(true)}
                  >
                    Registrar atividade
                  </Button>
                </div>
              </div>
              {vendas.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-400">
                  Veja os pedidos criados e registre as atividades realizadas neste cliente.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {vendas.map(v => (
                    <div
                      key={v.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer"
                      onClick={() => navigate({ to: "/app/vendas", search: { id: v.id } as any })}
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-700">Pedido #{v.numero || v.id.slice(0, 8)}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(v.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-800">
                          R$ {Number(v.valor_total || v.total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          v.status === "Pago" ? "bg-green-100 text-green-700" :
                          v.status === "Em aberto" ? "bg-blue-100 text-blue-700" :
                          v.status === "Faturado" ? "bg-purple-100 text-purple-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>{v.status || v.status_aprovacao || "—"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                      <span className="font-bold text-lg text-slate-800">{vendas.filter(v => {
                        const diff = (Date.now() - new Date(v.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30);
                        return diff <= 6;
                      }).length}</span>
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

      {/* MODAL: Criar Tarefa */}
      <Dialog open={openTarefa} onOpenChange={setOpenTarefa}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Tarefa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Título da tarefa *</Label>
              <Input
                value={tarefaTitulo}
                onChange={e => setTarefaTitulo(e.target.value)}
                placeholder="Ex: Ligar para o cliente, Enviar proposta..."
              />
            </div>
            <div className="space-y-2">
              <Label>Data de vencimento</Label>
              <Input
                type="date"
                value={tarefaData}
                onChange={e => setTarefaData(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenTarefa(false)}>Cancelar</Button>
            <Button
              className="bg-[#4a148c] hover:bg-[#4a148c]/90 text-white"
              onClick={handleSalvarTarefa}
              disabled={salvandoTarefa}
            >
              {salvandoTarefa ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Criar tarefa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: Registrar Atividade */}
      <Dialog open={openAtividade} onOpenChange={setOpenAtividade}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Atividade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Descrição da atividade *</Label>
              <Textarea
                value={atividadeDesc}
                onChange={e => setAtividadeDesc(e.target.value)}
                placeholder="Ex: Ligação realizada, visita técnica, e-mail enviado..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAtividade(false)}>Cancelar</Button>
            <Button
              className="bg-[#4a148c] hover:bg-[#4a148c]/90 text-white"
              onClick={handleSalvarAtividade}
              disabled={salvandoAtividade}
            >
              {salvandoAtividade ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
