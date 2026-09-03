import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { 
  FileSpreadsheet, 
  Filter, 
  X,
  Calendar as CalendarIcon,
  Trash2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/app/tarefas")({
  head: () => ({ meta: [{ title: "Tarefas - PREMIUM GARDEN" }] }),
  component: Tarefas,
});

function Tarefas() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [meioContato, setMeioContato] = useState("ligacao");
  const [clienteTexto, setClienteTexto] = useState("");
  const [detalhes, setDetalhes] = useState("");
  const [vendedorId, setVendedorId] = useState("");

  const [clientes, setClientes] = useState<any[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [resClientes, resVendedores, resTarefas] = await Promise.all([
          supabase.from("clientes").select("id, nome").order("nome"),
          supabase.from("vendedores").select("id, nome").eq("status", "Ativo").order("nome"),
          supabase.from("tarefas").select("*").order("created_at", { ascending: false })
        ]);
        
        if (resClientes.data) setClientes(resClientes.data);
        if (resVendedores.data) setVendedores(resVendedores.data);
        // It's possible the table doesn't exist yet, so we silently ignore errors on tarefas
        if (resTarefas.data) setTarefas(resTarefas.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    carregarDados();
  }, []);

  const handleStatusChange = async (id: string, novoStatus: string) => {
    setTarefas(tarefas.map(t => t.id === id ? { ...t, status: novoStatus } : t));
    
    const { error } = await supabase
      .from("tarefas")
      .update({ status: novoStatus })
      .eq("id", id);
      
    if (error) {
      toast.error("Erro ao atualizar status: " + error.message);
    } else {
      toast.success("Status atualizado!");
    }
  };

  const handleExcluirTarefa = async (id: string) => {
    const prevTarefas = [...tarefas];
    setTarefas(tarefas.filter(t => t.id !== id));
    
    const { error } = await supabase.from("tarefas").delete().eq("id", id);
    if (error) {
      setTarefas(prevTarefas);
      toast.error("Erro ao excluir: " + error.message);
    } else {
      toast.success("Tarefa excluída.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pendente": return "text-amber-600 bg-amber-50 ring-1 ring-amber-600/20";
      case "em andamento": return "text-blue-600 bg-blue-50 ring-1 ring-blue-600/20";
      case "concluído":
      case "concluido": return "text-green-600 bg-green-50 ring-1 ring-green-600/20";
      default: return "text-slate-600 bg-slate-50 ring-1 ring-slate-600/20";
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pendente": return "bg-amber-500";
      case "em andamento": return "bg-blue-500";
      case "concluído":
      case "concluido": return "bg-green-500";
      default: return "bg-slate-500";
    }
  };

  const handleSalvarTarefa = async () => {
    if (!date) {
      toast.error("Por favor, selecione uma data.");
      return;
    }
    setSaving(true);
    
    // Construct the data_hora combining date and time
    const dataHora = new Date(date);
    if (time) {
      const [h, m] = time.split(":");
      dataHora.setHours(parseInt(h, 10));
      dataHora.setMinutes(parseInt(m, 10));
    }
    
    const clienteEncontrado = clientes.find(c => c.nome.toLowerCase() === clienteTexto.toLowerCase());

    const { data, error } = await supabase.from("tarefas").insert([{
      data: dataHora.toISOString(),
      meio_contato: meioContato,
      cliente_nome: clienteTexto,
      cliente_id: clienteEncontrado ? clienteEncontrado.id : null,
      detalhes: detalhes,
      vendedor_id: vendedorId || null,
      status: "Pendente"
    }]).select();

    if (error) {
      console.error(error);
      if (error.code === 'PGRST205') {
        toast.error("Tabela 'tarefas' não existe no banco de dados. Crie-a usando o painel do Supabase.");
      } else {
        toast.error("Erro ao salvar tarefa: " + error.message);
      }
    } else {
      toast.success("Tarefa criada com sucesso!");
      setIsCreateOpen(false);
      
      // Limpar form
      setDate(undefined);
      setTime("");
      setMeioContato("ligacao");
      setClienteTexto("");
      setDetalhes("");
      setVendedorId("");
      
      if (data && data.length > 0) {
        setTarefas([data[0], ...tarefas]);
      }
    }
    setSaving(false);
  };

  return (
    <div className="flex h-full flex-col bg-[#F5F6F8]">
      {/* Top Navigation Tabs */}
      <div className="bg-white border-b px-6">
        <Tabs defaultValue="tarefas" className="w-full">
          <TabsList className="h-14 bg-transparent p-0">
            <TabsTrigger 
              value="tarefas" 
              className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-4 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-[#4b2781] data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              TAREFAS
            </TabsTrigger>
            <TabsTrigger 
              value="roteiros" 
              className="relative h-14 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-4 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-[#4b2781] data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              ROTEIROS
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Header and Actions */}
      <div className="bg-white flex flex-col gap-4 border-b px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-medium text-slate-800 uppercase tracking-wide">
            TAREFAS E ATIVIDADES
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe as tarefas agendadas e as atividades realizadas.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            className="bg-[#4b2781] hover:bg-[#4b2781]/90 h-10 font-medium px-5"
            onClick={() => setIsCreateOpen(true)}
          >
            Criar tarefa
          </Button>
          <Button variant="outline" className="h-10 border-slate-300 font-medium px-5 text-slate-700 hover:bg-slate-50">
            Registrar atividade
          </Button>
          <Button 
            variant="outline" 
            className="h-10 border-slate-300 font-medium relative px-5 text-slate-700 hover:bg-slate-50"
            onClick={() => setIsFilterOpen(true)}
          >
            Filtros
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#4b2781] text-[10px] font-bold text-white shadow-sm">
              4
            </span>
          </Button>
        </div>
      </div>
      
      {/* Secondary Actions (Excel) */}
      <div className="bg-white flex justify-end px-6 py-3 border-b shadow-sm">
        <Button variant="outline" className="h-8 text-xs font-medium border-slate-300 text-slate-700 hover:bg-slate-50">
          <FileSpreadsheet className="mr-2 h-4 w-4 text-[#4b2781]" />
          Excel
        </Button>
      </div>

      {/* Main Content */}
      {tarefas.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-[#F5F6F8]">
          <div className="mb-6 relative">
            <div className="flex h-28 w-28 items-center justify-center">
              <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="52" y="25" width="40" height="50" rx="2" fill="white" stroke="#CBD5E1" strokeWidth="1.5"/>
                <path d="M62 45L72 55L82 35" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="35" cy="50" r="14" stroke="#8B5CF6" strokeWidth="1.5" fill="white"/>
                <path d="M10 80C10 66.1929 21.1929 55 35 55C48.8071 55 60 66.1929 60 80" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" fill="white"/>
                <ellipse cx="50" cy="85" rx="30" ry="3" fill="#E2E8F0" opacity="0.5"/>
              </svg>
            </div>
          </div>
          <h3 className="mb-2 text-lg font-bold text-slate-800">
            Nenhuma tarefa ou atividade encontrada
          </h3>
          <p className="max-w-md text-sm text-slate-500 leading-relaxed">
            Não encontramos nenhuma tarefa ou atividade. Crie uma nova tarefa, registre uma atividade ou verifique os filtros aplicados.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-6 bg-[#F5F6F8]">
          <div className="flex flex-col gap-3">
            {tarefas.map(t => (
              <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4 group">
                <div className="bg-[#4b2781]/10 text-[#4b2781] p-3 rounded-full flex-shrink-0">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800">
                    <span className="uppercase text-[#4b2781] mr-1">{t.meio_contato}</span> 
                    - {t.cliente_nome || "Cliente Avulso"}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">{t.detalhes}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 font-medium">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="focus:outline-none">
                        <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(t.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(t.status)}`}></span>
                          {t.status}
                        </span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => handleStatusChange(t.id, "Pendente")}>
                          Pendente
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(t.id, "Em andamento")}>
                          Em andamento
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(t.id, "Concluído")}>
                          Concluído
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <span>{t.data ? format(new Date(t.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : ""}</span>
                    <span className="uppercase bg-[#4b2781]/10 text-[#4b2781] px-2 py-0.5 rounded-md font-bold text-[10px] tracking-wider">{t.meio_contato}</span>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button 
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all self-center"
                      title="Excluir tarefa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir tarefa</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir esta tarefa? Essa ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleExcluirTarefa(t.id)} className="bg-red-600 hover:bg-red-700">
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Task Drawer */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="w-[400px] sm:w-[480px] p-0 flex flex-col bg-[#fcfcfd]" side="right">
          <SheetHeader className="px-6 py-5 border-b bg-white flex flex-row items-center justify-between space-y-0">
            <SheetTitle className="text-base font-bold text-slate-800">Criar tarefa</SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="space-y-6">
              
              {/* Data and Time row */}
              <div className="flex gap-4">
                <div className="space-y-2 flex-1 relative">
                  <div className="absolute -top-3 left-0 right-0 border-t border-slate-200">
                    <span className="bg-[#fcfcfd] px-2 text-[10px] font-bold text-slate-400 absolute -top-2 left-0 uppercase tracking-wider">DATA</span>
                  </div>
                  <div className="pt-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal border-slate-300 h-10 bg-white">
                          {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : <span className="text-slate-400">dd/mm/aaaa</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="space-y-2 w-28 relative">
                  <div className="absolute -top-3 left-0 right-0 border-t border-transparent"></div>
                  <div className="pt-2">
                    <Input 
                      type="time" 
                      className="border-slate-300 h-10 text-center bg-white flex items-center justify-center" 
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Meio de Contato */}
              <div className="space-y-2 relative">
                <div className="absolute -top-3 left-0 right-0 border-t border-slate-200">
                  <span className="bg-[#fcfcfd] px-2 text-[10px] font-bold text-slate-400 absolute -top-2 left-0 uppercase tracking-wider">MEIO DE CONTATO</span>
                </div>
                <div className="pt-2">
                  <Select value={meioContato} onValueChange={setMeioContato}>
                    <SelectTrigger className="w-full border-[#4b2781] ring-1 ring-[#4b2781] h-10 bg-white">
                      <SelectValue placeholder="Meio de contato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visita">Visita</SelectItem>
                      <SelectItem value="ligacao">Ligação</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="skype">Skype</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Cliente */}
              <div className="space-y-2 relative">
                <div className="absolute -top-3 left-0 right-0 border-t border-slate-200">
                  <span className="bg-[#fcfcfd] px-2 text-[10px] font-bold text-slate-400 absolute -top-2 left-0 uppercase tracking-wider">CLIENTE</span>
                </div>
                <div className="pt-2">
                  <Input 
                    list="clientes-list" 
                    placeholder="Selecione ou pesquise pelo nome..." 
                    className="w-full border-slate-300 h-10 bg-white text-slate-700"
                    value={clienteTexto}
                    onChange={(e) => setClienteTexto(e.target.value)}
                  />
                  <datalist id="clientes-list">
                    {clientes.map(c => (
                      <option key={c.id} value={c.nome} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Detalhes */}
              <div className="space-y-2 relative">
                <div className="absolute -top-3 left-0 right-0 border-t border-slate-200">
                  <span className="bg-[#fcfcfd] px-2 text-[10px] font-bold text-slate-400 absolute -top-2 left-0 uppercase tracking-wider">DETALHES</span>
                </div>
                <div className="pt-2">
                  <Textarea 
                    className="min-h-[140px] resize-none border-slate-300 bg-white"
                    value={detalhes}
                    onChange={(e) => setDetalhes(e.target.value)}
                  />
                </div>
              </div>

              {/* Vendedor */}
              <div className="space-y-2 relative">
                <div className="absolute -top-3 left-0 right-0 border-t border-slate-200">
                  <span className="bg-[#fcfcfd] px-2 text-[10px] font-bold text-slate-400 absolute -top-2 left-0 uppercase tracking-wider">VENDEDOR</span>
                </div>
                <div className="pt-2">
                  <Select value={vendedorId} onValueChange={setVendedorId}>
                    <SelectTrigger className="w-full border-slate-300 h-10 bg-white text-slate-700">
                      <SelectValue placeholder="Selecione o Vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendedores.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

            </div>
          </div>
          
          <div className="px-6 py-4 border-t bg-[#f8f9fa] flex gap-4">
            <Button 
              className="bg-[#4b2781] hover:bg-[#4b2781]/90 sm:w-28 h-10 font-medium"
              onClick={handleSalvarTarefa}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar"}
            </Button>
            <Button variant="outline" className="sm:w-28 h-10 border-slate-300 text-slate-700 font-medium" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Filters Drawer */}
      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetContent className="w-[400px] sm:w-[480px] p-0 flex flex-col bg-[#fcfcfd]" side="right">
          <SheetHeader className="px-6 py-5 border-b bg-white flex flex-row items-center justify-between space-y-0">
            <SheetTitle className="text-base font-bold text-slate-800">Filtro de tarefas e atividades</SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="space-y-6">
              
              {/* Período */}
              <div className="space-y-2 relative">
                <div className="absolute -top-3 left-0 right-0 border-t border-slate-200">
                  <span className="bg-[#fcfcfd] px-2 text-[10px] font-bold text-slate-400 absolute -top-2 left-0 uppercase tracking-wider">PERÍODO</span>
                </div>
                <div className="pt-2">
                  <div className="border border-[#4b2781]/20 rounded-md p-3 bg-white space-y-3 shadow-sm">
                    <div className="flex items-center text-sm text-[#4b2781] font-semibold gap-2 px-1">
                      <div className="w-1.5 h-3 rounded-full bg-[#4b2781]" />
                      02/06/2026 a 02/12/2026
                    </div>
                    <Select defaultValue="outro">
                      <SelectTrigger className="w-full border-slate-200 bg-slate-50 h-10 text-slate-700 font-medium">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-[#4b2781]" />
                          <SelectValue placeholder="Período" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="outro">Outro período</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Vendedor */}
              <div className="space-y-2 relative">
                <div className="absolute -top-3 left-0 right-0 border-t border-slate-200">
                  <span className="bg-[#fcfcfd] px-2 text-[10px] font-bold text-slate-400 absolute -top-2 left-0 uppercase tracking-wider">VENDEDOR</span>
                </div>
                <div className="pt-2">
                  <div className="flex items-center min-h-[40px] border border-slate-300 rounded-md px-2 py-1.5 bg-white">
                    <div className="bg-slate-100 text-xs px-2 py-1 rounded-sm flex items-center gap-2 text-slate-700">
                      Lucas Pereira de Souza
                      <X className="w-3.5 h-3.5 text-red-400 hover:text-red-500 cursor-pointer" />
                    </div>
                    <div className="ml-auto flex items-center pl-2">
                      <X className="w-4 h-4 text-slate-400 hover:text-slate-500 cursor-pointer mr-2" />
                      <div className="w-px h-4 bg-slate-200 mr-2" />
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-400 cursor-pointer">
                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cliente */}
              <div className="space-y-2 relative">
                <div className="absolute -top-3 left-0 right-0 border-t border-slate-200">
                  <span className="bg-[#fcfcfd] px-2 text-[10px] font-bold text-slate-400 absolute -top-2 left-0 uppercase tracking-wider">CLIENTE</span>
                </div>
                <div className="pt-2">
                  <Select>
                    <SelectTrigger className="w-full border-slate-300 h-10 bg-white text-slate-500">
                      <SelectValue placeholder="Todos os clientes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os clientes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Meio de Contato */}
              <div className="space-y-2 relative">
                <div className="absolute -top-3 left-0 right-0 border-t border-slate-200">
                  <span className="bg-[#fcfcfd] px-2 text-[10px] font-bold text-slate-400 absolute -top-2 left-0 uppercase tracking-wider">MEIO DE CONTATO</span>
                </div>
                <div className="pt-2">
                  <Select>
                    <SelectTrigger className="w-full border-slate-300 h-10 bg-white text-slate-500">
                      <SelectValue placeholder="Todos os meios de contato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os meios de contato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2 relative">
                <div className="absolute -top-3 left-0 right-0 border-t border-slate-200">
                  <span className="bg-[#fcfcfd] px-2 text-[10px] font-bold text-slate-400 absolute -top-2 left-0 uppercase tracking-wider">STATUS</span>
                </div>
                <div className="pt-2">
                  <Select defaultValue="nao-realizadas">
                    <SelectTrigger className="w-full border-slate-300 h-10 bg-white text-slate-700">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nao-realizadas">Não realizadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

            </div>
          </div>
          
          <div className="px-6 py-4 border-t bg-[#f8f9fa] flex justify-between items-center">
            <Button className="bg-[#4b2781] hover:bg-[#4b2781]/90 sm:w-28 h-10 font-medium">
              Aplicar
            </Button>
            <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 sm:w-28 h-10 font-medium">
              Limpar
            </Button>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}
