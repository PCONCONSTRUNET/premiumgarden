import { toast } from "sonner";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, Upload, ChevronDown, Eye, EyeOff, PenLine, RotateCcw, ArrowDownUp } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useProdutos } from "@/contexts/ProdutosContext";
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
import { Download, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/contexts/ConfirmContext";

export const Route = createFileRoute("/app/produtos")({
  head: () => ({ meta: [{ title: "Produtos — PREMIUM GARDEN" }] }),
  component: Produtos,
});

function Produtos() {
  const navigate = useNavigate();
  const { produtos: products, loading, fetchProdutos, updateProdutoLocal, removeProdutoLocal } = useProdutos();
  
  // Navigation State
  const [activeSubTab, setActiveSubTab] = useState<"tabelas" | "estoque" | "fotos">("tabelas");
  
  // Tabelas State
  const [busca, setBusca] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState("Ativo");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  // Estoque State
  const [estoqueMode, setEstoqueMode] = useState<"ajuste" | "entrada">("ajuste");
  const [estoqueSort, setEstoqueSort] = useState<"nome" | "codigo">("nome");
  
  // Inline Stock Edit
  const [editingEstoqueId, setEditingEstoqueId] = useState<string | null>(null);
  const [editingEstoqueValue, setEditingEstoqueValue] = useState<string>("");
  const [buscaEstoque, setBuscaEstoque] = useState("");
  
  // Temporary Draft State for Estoque adjustments
  const [draftEstoque, setDraftEstoque] = useState<Record<string, string>>({});
  const [savingEstoque, setSavingEstoque] = useState<Record<string, boolean>>({});

  const confirm = useConfirm();

  // Carrega produtos usando cache (não rebusca se já estiver carregado)
  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  const handleExcluirProduto = async (produto: any) => {
    confirm({
      title: "Excluir produto",
      description: `Tem certeza que deseja excluir o produto "${produto.nome}"? Esta ação não pode ser desfeita e pode falhar se o produto já estiver vinculado a vendas ou orçamentos.`,
      onConfirm: async () => {
        try {
          const { data, error } = await supabase.from("produtos").delete().eq("id", produto.id).select();
          if (error) throw error;
          if (!data || data.length === 0) {
            toast.error("Não foi possível excluir o produto. Verifique as permissões ou atualize a página.");
            return;
          }
          removeProdutoLocal(produto.id);
          toast.success("Produto excluído com sucesso.");
        } catch (err: any) {
          console.error(err);
          toast.error("Erro ao excluir produto: " + (err.message || "Ele pode estar vinculado a vendas."));
        }
      }
    });
  };

  const handleSaveInlineEstoque = async (p: any) => {
    const newVal = Number(editingEstoqueValue);
    if (isNaN(newVal) || newVal < 0) {
      toast.error("Valor inválido.");
      setEditingEstoqueId(null);
      return;
    }
    
    if (String(newVal) === String(p.estoque || 0)) {
      setEditingEstoqueId(null);
      return;
    }
    
    try {
      const { error } = await supabase.from("produtos").update({ estoque: newVal }).eq("id", p.id);
      if (error) throw error;
      updateProdutoLocal(p.id, { estoque: newVal });
      toast.success("Estoque atualizado!");
    } catch (err) {
      toast.error("Erro ao atualizar estoque.");
    } finally {
      setEditingEstoqueId(null);
    }
  };

  const toggleProductStatus = async (produto: any) => {
    const newStatus = produto.status === "Ativo" ? "Inativo" : "Ativo";
    try {
      const { error } = await supabase.from("produtos").update({ status: newStatus }).eq("id", produto.id);
      if (error) throw error;
      updateProdutoLocal(produto.id, { status: newStatus });
      toast.success(`Produto marcado como ${newStatus.toLowerCase()}`);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao atualizar status do produto.");
    }
  };


  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const searchStr = busca.trim().toLowerCase();
      const matchBusca = p.nome.toLowerCase().includes(searchStr) ||
          (p.codigo && String(p.codigo).toLowerCase().includes(searchStr));

      const matchCat = categoriaFilter === "Todas" || p.categoria === categoriaFilter;
      const matchStatus = statusFilter === "Todos" || p.status === statusFilter;
      return matchBusca && matchCat && matchStatus;
    });
    
    result.sort((a, b) => {
      // Usar número se for numérico, caso contrário ordenar como texto
      const isNumA = !isNaN(Number(a.codigo));
      const isNumB = !isNaN(Number(b.codigo));
      
      if (isNumA && isNumB) {
        return sortOrder === "asc" 
          ? Number(a.codigo) - Number(b.codigo)
          : Number(b.codigo) - Number(a.codigo);
      }
      
      // Fallback para string sort
      const strA = String(a.codigo || "");
      const strB = String(b.codigo || "");
      return sortOrder === "asc" 
        ? strA.localeCompare(strB) 
        : strB.localeCompare(strA);
    });

    return result;
  }, [products, busca, categoriaFilter, statusFilter, sortOrder]);

  const filteredEstoqueProducts = useMemo(() => {
    let result = products.filter((p) => {
      const searchStr = buscaEstoque.trim().toLowerCase();
      return p.nome.toLowerCase().includes(searchStr) ||
          (p.codigo && String(p.codigo).toLowerCase().includes(searchStr));
    });
    
    // Sort
    if (estoqueSort === "nome") {
      result = result.sort((a, b) => a.nome.localeCompare(b.nome));
    } else {
      result = result.sort((a, b) => String(a.codigo || "").localeCompare(String(b.codigo || "")));
    }
    
    return result;
  }, [products, buscaEstoque, estoqueSort]);

  const handleDraftChange = (id: string, val: string) => {
    setDraftEstoque(prev => ({ ...prev, [id]: val }));
  };

  const clearDraft = (id: string) => {
    setDraftEstoque(prev => {
      const newDraft = { ...prev };
      delete newDraft[id];
      return newDraft;
    });
  };

  const saveEstoque = async (produto: any) => {
    const valStr = draftEstoque[produto.id];
    if (valStr === undefined || valStr === "") return; // No change or empty
    
    const val = parseInt(valStr, 10);
    if (isNaN(val)) {
      clearDraft(produto.id);
      return;
    }
    
    let novoEstoque = 0;
    if (estoqueMode === "ajuste") {
      novoEstoque = val;
      if (novoEstoque === Number(produto.estoque)) {
        clearDraft(produto.id);
        return; // Didn't actually change
      }
    } else { // entrada
      if (val === 0) {
        clearDraft(produto.id);
        return;
      }
      novoEstoque = Number(produto.estoque || 0) + val;
    }

    setSavingEstoque(prev => ({ ...prev, [produto.id]: true }));
    try {
      // 1. Atualizar produto
      const { error } = await supabase.from("produtos").update({ estoque: novoEstoque }).eq("id", produto.id);
      if (error) throw error;
      
      // 2. Registrar movimentação
      const diff = novoEstoque - Number(produto.estoque || 0);
      await supabase.from("movimentacoes_estoque").insert({
        produto_id: produto.id,
        tipo: estoqueMode === "ajuste" ? "Ajuste" : "Entrada",
        quantidade: diff,
        motivo: estoqueMode === "ajuste" ? "Ajuste manual pela tela de produtos" : "Entrada manual pela tela de produtos",
      });

      // Update local state via cache context
      updateProdutoLocal(produto.id, { estoque: novoEstoque });
      clearDraft(produto.id);
      toast.success(`Estoque atualizado! (${diff > 0 ? '+' : ''}${diff})`);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao atualizar estoque.");
    } finally {
      setSavingEstoque(prev => ({ ...prev, [produto.id]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      {/* Top Tabs */}
      <div className="bg-white border-b px-6 pt-4 flex gap-6 text-sm font-semibold text-muted-foreground uppercase tracking-wide overflow-x-auto">
        <Link to="/app/produtos" className="border-b-2 border-[#4b2781] text-[#4b2781] pb-3 flex items-center gap-2 cursor-pointer whitespace-nowrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
          Produtos
        </Link>
        <Link to="/app/promocoes" className="pb-3 flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors whitespace-nowrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          Promoções
        </Link>
        <Link to="/app/produtos" className="pb-3 flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors whitespace-nowrap text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Destaques
        </Link>
        <Link to="/app/configuracoes" className="pb-3 flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors whitespace-nowrap text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          Configurações
        </Link>
      </div>

      {/* Sub Tabs */}
      <div className="bg-white border-b px-6 flex gap-6 text-sm text-muted-foreground overflow-x-auto">
        <div 
          className={cn(
            "py-3 flex items-center gap-2 cursor-pointer whitespace-nowrap transition-colors",
            activeSubTab === "tabelas" ? "border-b-2 border-slate-800 text-slate-800 font-medium" : "hover:text-slate-700"
          )}
          onClick={() => setActiveSubTab("tabelas")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
          Produtos e tabelas
        </div>
        <div 
          className={cn(
            "py-3 flex items-center gap-2 cursor-pointer whitespace-nowrap transition-colors",
            activeSubTab === "estoque" ? "border-b-2 border-slate-800 text-slate-800 font-medium" : "hover:text-slate-700"
          )}
          onClick={() => setActiveSubTab("estoque")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          Gerenciar estoque
        </div>
        <div 
          className={cn(
            "py-3 flex items-center gap-2 cursor-pointer whitespace-nowrap transition-colors",
            activeSubTab === "fotos" ? "border-b-2 border-slate-800 text-slate-800 font-medium" : "hover:text-slate-700"
          )}
          onClick={() => setActiveSubTab("fotos")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="13" r="2"/><path d="m20 17-1.09-1.09a2 2 0 0 0-2.82 0L10 22"/></svg>
          Importar fotos
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-full mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-border/50">
          
          {activeSubTab === "tabelas" && (
            <>
              {/* Actions & Filters for Tabelas */}
              <div className="p-4 border-b flex flex-col xl:flex-row justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  <Button 
                    className="bg-[#4b2781] hover:bg-[#4b2781]/90 text-white font-medium px-4 h-9" 
                    onClick={() => navigate({ to: "/app/produto-novo" })}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Cadastrar produto
                  </Button>
                    <Button variant="outline" className="text-[#4b2781] hover:text-[#4b2781] hover:bg-slate-50 font-medium h-9 border-slate-300" onClick={() => navigate({ to: "/app/produtos-importar" })}>
                      <Upload className="mr-2 h-4 w-4" /> Importar produtos
                    </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="text-[#4b2781] hover:text-[#4b2781] hover:bg-slate-50 font-medium h-9 border-slate-300">
                        Mais opções <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuItem className="cursor-pointer gap-2 py-2">
                        <Download className="h-4 w-4 text-muted-foreground" /> Baixar tabela de preços em PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer gap-2 py-2">
                        <Download className="h-4 w-4 text-muted-foreground" /> Exportar apenas produtos ativos (excel)
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer gap-2 py-2">
                        <Download className="h-4 w-4 text-muted-foreground" /> Exportar todos os produtos (excel)
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer gap-2 py-2">
                        <Download className="h-4 w-4 text-muted-foreground" /> Exportar todas as imagens dos produtos
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer gap-2 py-2 text-destructive focus:bg-destructive/10 focus:text-destructive">
                        <Trash2 className="h-4 w-4" /> Excluir todas as imagens
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                  <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-[#f8f9fa] border-none h-9 text-slate-600 font-medium">
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todas">Todas as categorias</SelectItem>
                      {Array.from(new Set(products.map((p) => p.categoria).filter(Boolean)))
                        .sort()
                        .map((cat: any) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    className="h-9 border-none bg-[#f8f9fa] text-slate-600 font-medium px-3 flex-shrink-0"
                    onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                    title={sortOrder === "asc" ? "Ordenar por código (Crescente)" : "Ordenar por código (Decrescente)"}
                  >
                    <ArrowDownUp className="h-4 w-4 mr-2 text-muted-foreground" />
                    Ordem
                  </Button>
                  <div className="relative w-full sm:w-[250px]">
                    <Input
                      placeholder="Pesquise por código ou nome"
                      className="pr-9 bg-[#f8f9fa] border-none h-9 text-sm"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                    />
                    <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 border-b flex justify-between items-center text-xs">
                 <DropdownMenu>
                   <DropdownMenuTrigger className="flex items-center text-[#4b2781] cursor-pointer font-medium hover:underline focus:outline-none">
                     Exibir produtos {statusFilter === "Todos" ? "ativos e inativos" : statusFilter.toLowerCase()}s <ChevronDown className="ml-1 h-3 w-3" />
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="start">
                     <DropdownMenuItem onClick={() => setStatusFilter("Ativo")}>Exibir produtos ativos</DropdownMenuItem>
                     <DropdownMenuItem onClick={() => setStatusFilter("Inativo")}>Exibir produtos inativos</DropdownMenuItem>
                     <DropdownMenuItem onClick={() => setStatusFilter("Todos")}>Exibir todos os produtos</DropdownMenuItem>
                   </DropdownMenuContent>
                 </DropdownMenu>
              </div>

              {/* Table - Tabelas */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-transparent [&_tr]:border-b-0">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-slate-700 w-16">Fotos</TableHead>
                      <TableHead className="font-semibold text-slate-700">Código</TableHead>
                      <TableHead className="font-semibold text-slate-700">Nome</TableHead>
                      <TableHead className="font-semibold text-slate-700">Variações</TableHead>
                      <TableHead className="font-semibold text-slate-700">Estoque</TableHead>
                      <TableHead className="font-semibold text-slate-700">Unidade</TableHead>
                      <TableHead className="font-semibold text-slate-700">Preço Mínimo</TableHead>
                      <TableHead className="font-semibold text-slate-700">Preço de Tabela</TableHead>
                      <TableHead className="text-right pr-4"><div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#4b2781] text-white"><Plus className="w-3.5 h-3.5"/></div></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          Carregando produtos...
                        </TableCell>
                      </TableRow>
                    ) : filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          Nenhum produto encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((p) => (
                        <TableRow key={p.id} className="group hover:bg-muted/30">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {p.status === "Ativo" ? (
                                <Eye 
                                  className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" 
                                  onClick={() => toggleProductStatus(p)}
                                  title="Desativar produto"
                                />
                              ) : (
                                <EyeOff 
                                  className="w-4 h-4 text-red-500 cursor-pointer hover:text-red-600" 
                                  onClick={() => toggleProductStatus(p)}
                                  title="Ativar produto"
                                />
                              )}
                              <div className="w-8 h-8 rounded border bg-white flex items-center justify-center overflow-hidden">
                                {p.imagem ? (
                                  <img src={p.imagem} alt={p.nome} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[10px] text-muted-foreground opacity-50">---</span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium">{p.codigo || "---"}</TableCell>
                          <TableCell className="text-sm font-medium text-[#4b2781] flex items-center gap-2 min-h-[48px]">
                            <PenLine className="w-3.5 h-3.5 text-[#4b2781] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => navigate({ to: "/app/produto-novo", search: { id: p.id } })} />
                            <span className="cursor-pointer hover:underline" onClick={() => navigate({ to: "/app/produto-novo", search: { id: p.id } })}>{p.nome}</span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {p.cores && p.cores.length > 0 ? p.cores.join(", ") : "---"}
                          </TableCell>
                          <TableCell className="text-sm font-semibold text-slate-700">
                            {editingEstoqueId === p.id ? (
                              <Input
                                autoFocus
                                type="number"
                                className="w-20 h-7 text-sm"
                                value={editingEstoqueValue}
                                onChange={(e) => setEditingEstoqueValue(e.target.value)}
                                onBlur={() => handleSaveInlineEstoque(p)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleSaveInlineEstoque(p);
                                  }
                                }}
                              />
                            ) : (
                              <div className="flex items-center gap-2 group/estoque">
                                <span>{p.estoque || 0}</span>
                                <PenLine 
                                  className="w-3.5 h-3.5 text-slate-400 cursor-pointer opacity-0 group-hover/estoque:opacity-100 transition-opacity hover:text-[#4b2781]" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingEstoqueId(p.id);
                                    setEditingEstoqueValue(String(p.estoque || 0));
                                  }}
                                />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{p.unidade_medida || "Un"}</TableCell>
                          <TableCell className="text-sm font-medium">
                            R$ {(Number(p.valor) * 0.9).toFixed(2).replace(".", ",")}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            R$ {Number(p.valor).toFixed(2).replace(".", ",")}
                          </TableCell>
                          <TableCell className="text-right pr-4">
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" 
                               onClick={() => handleExcluirProduto(p)}
                               title="Excluir produto"
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {activeSubTab === "estoque" && (
            <>
              {/* Actions & Filters for Gerenciar Estoque */}
              <div className="p-4 border-b flex flex-col md:flex-row justify-between gap-4">
                <div className="flex gap-4">
                  <div className="flex bg-slate-100 p-1 rounded-md">
                    <Button 
                      variant="ghost"
                      className={cn("h-8 px-4 text-xs font-medium rounded-sm", estoqueMode === "ajuste" ? "bg-[#4b2781] text-white hover:bg-[#4b2781]/90 hover:text-white" : "text-slate-600 hover:text-slate-800")}
                      onClick={() => { setEstoqueMode("ajuste"); setDraftEstoque({}); }}
                    >
                      Ajuste de estoque
                    </Button>
                    <Button 
                      variant="ghost"
                      className={cn("h-8 px-4 text-xs font-medium rounded-sm", estoqueMode === "entrada" ? "bg-[#4b2781] text-white hover:bg-[#4b2781]/90 hover:text-white" : "text-slate-600 hover:text-slate-800")}
                      onClick={() => { setEstoqueMode("entrada"); setDraftEstoque({}); }}
                    >
                      Entrada de estoque
                    </Button>
                  </div>
                  
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Ordenar por:</span>
                    <div className="flex bg-slate-100 p-1 rounded-md">
                      <Button 
                        variant="ghost"
                        className={cn("h-7 px-3 text-xs font-medium rounded-sm", estoqueSort === "codigo" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-800")}
                        onClick={() => setEstoqueSort("codigo")}
                      >
                        Código
                      </Button>
                      <Button 
                        variant="ghost"
                        className={cn("h-7 px-3 text-xs font-medium rounded-sm", estoqueSort === "nome" ? "bg-[#4b2781] shadow-sm text-white hover:bg-[#4b2781]/90 hover:text-white" : "text-slate-500 hover:text-slate-800")}
                        onClick={() => setEstoqueSort("nome")}
                      >
                        Nome
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="relative w-full md:w-[300px]">
                  <Input
                    placeholder="Pesquise por código ou nome"
                    className="pr-9 border-slate-200 h-9 text-sm"
                    value={buscaEstoque}
                    onChange={(e) => setBuscaEstoque(e.target.value)}
                  />
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              {/* Table - Gerenciar Estoque */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-transparent [&_tr]:border-b-0">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-slate-700 w-[140px]">
                        {estoqueMode === "ajuste" ? "Estoque" : "Adicionar"}
                      </TableHead>
                      {estoqueMode === "entrada" && <TableHead className="font-semibold text-slate-700 w-24">Estoque</TableHead>}
                      <TableHead className="font-semibold text-slate-700 w-32">Código</TableHead>
                      <TableHead className="font-semibold text-slate-700">Nome</TableHead>
                      <TableHead className="font-semibold text-slate-700">Preço Cadastro</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-center w-28">Movimentação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Carregando produtos...
                        </TableCell>
                      </TableRow>
                    ) : filteredEstoqueProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum produto encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEstoqueProducts.map((p) => {
                        const isDrafting = draftEstoque[p.id] !== undefined;
                        const inputValue = isDrafting ? draftEstoque[p.id] : (estoqueMode === "ajuste" ? String(p.estoque || 0) : "");
                        const isChanged = isDrafting && draftEstoque[p.id] !== String(p.estoque || 0) && estoqueMode === "ajuste";
                        const isSaving = savingEstoque[p.id];
                        
                        return (
                          <TableRow key={p.id} className="group hover:bg-muted/30">
                            <TableCell>
                              <div className="flex items-center gap-2 relative">
                                <Input 
                                  className={cn("w-20 h-8 border-slate-300", isChanged ? "border-[#4b2781] text-[#4b2781] font-medium" : "")}
                                  value={inputValue}
                                  onChange={(e) => handleDraftChange(p.id, e.target.value)}
                                  onBlur={() => saveEstoque(p)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.currentTarget.blur();
                                    }
                                  }}
                                  disabled={isSaving}
                                />
                                {isChanged && !isSaving && (
                                  <RotateCcw 
                                    className="w-3.5 h-3.5 text-[#4b2781] cursor-pointer hover:text-slate-800 transition-colors"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      clearDraft(p.id);
                                    }}
                                  />
                                )}
                              </div>
                            </TableCell>
                            {estoqueMode === "entrada" && (
                              <TableCell className="text-sm font-medium text-slate-600">
                                {p.estoque || 0}
                              </TableCell>
                            )}
                            <TableCell className="text-sm font-medium text-slate-600">{p.codigo || ""}</TableCell>
                            <TableCell className="text-sm font-medium text-[#4b2781] flex items-center gap-2 min-h-[48px]">
                              <PenLine className="w-3.5 h-3.5 text-[#4b2781] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => navigate({ to: "/app/produto-novo", search: { id: p.id } })} />
                              <span className="cursor-pointer hover:underline" onClick={() => navigate({ to: "/app/produto-novo", search: { id: p.id } })}>{p.nome}</span>
                            </TableCell>
                            <TableCell className="text-sm font-medium text-slate-700">
                              R$ {Number(p.valor).toFixed(2).replace(".", ",")}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-[#4b2781] hover:text-[#4b2781] hover:bg-slate-100">
                                <ArrowDownUp className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
          
          {activeSubTab === "fotos" && (
             <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center py-20">
               <Upload className="w-8 h-8 mb-4 opacity-50" />
               <p>O gerenciador de fotos será implementado em breve.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
