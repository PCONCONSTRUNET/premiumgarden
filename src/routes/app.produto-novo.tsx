import { toast } from "sonner";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageIcon, Plus, Info } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/app/produto-novo")({
  validateSearch: (search: Record<string, unknown>): { id?: string } => {
    return {
      id: search.id as string | undefined,
    };
  },
  head: () => ({ meta: [{ title: "Produto — PREMIUM GARDEN" }] }),
  component: NovoProduto,
});

function NovoProduto() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const isEditing = !!search.id;
  const [loading, setLoading] = useState(false);
  const [isFetchingInfo, setIsFetchingInfo] = useState(isEditing);

  const [produto, setProduto] = useState({
    codigo: "",
    nome: "",
    categoria: "",
    unidade_medida: "Un",
    multiplos_venda: 1,
    moeda: "R$",
    preco_minimo: "",
    preco_tabela: "",
    ipi: "",
    ncm: "",
    comissao: "",
    info_adicionais: "",
    imagem: "",
    forma_peso: "unitaria",
    peso_bruto: "",
    largura: "",
    altura: "",
    comprimento: "",
    variacoes: [] as string[],
    
    // Existing backend fields to not break it
    estoque: 0,
    valor: 0,
    status: "Ativo",
    numero: "",
    dimensao: "",
    volume: "",
    cores: [] as string[],
  });

  const [categoriasDB, setCategoriasDB] = useState<string[]>([
    "Sem categoria",
    "Vasos Plásticos",
    "Vasos Decorativos",
  ]);

  const [variacaoInput, setVariacaoInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCategorias = async () => {
    try {
      const { data } = await supabase.from("produtos").select("categoria");
      if (data) {
        const unicas = Array.from(new Set(data.map((p) => p.categoria))).filter(Boolean);
        const merged = Array.from(new Set([...categoriasDB, ...unicas]));
        setCategoriasDB(merged);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategorias();

    if (isEditing) {
      const fetchProduto = async () => {
        try {
          const { data, error } = await supabase
            .from("produtos")
            .select("*")
            .eq("id", search.id)
            .single();
          if (error) throw error;
          if (data) {
            setProduto((prev) => ({
              ...prev,
              codigo: data.codigo || "",
              nome: data.nome || "",
              categoria: data.categoria || "Sem categoria",
              valor: data.valor || 0,
              preco_tabela: data.valor ? String(data.valor) : "",
              status: data.status || "Ativo",
              imagem: data.imagem || "",
              ncm: data.ncm || "",
              cores: data.cores || [],
              variacoes: data.cores || [], // Sync colors to variations for now
              estoque: data.estoque || 0,
            }));
          }
        } catch (err) {
          console.error(err);
          toast.error("Erro ao carregar os dados do produto.");
        } finally {
          setIsFetchingInfo(false);
        }
      };
      fetchProduto();
    }
  }, [isEditing, search.id]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          if (width > 800) { height *= 800 / width; width = 800; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject("Canvas not supported");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/webp", 0.8));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) return toast.info("Selecione uma imagem.");
      try {
        const compressed = await compressImage(file);
        setProduto((prev) => ({ ...prev, imagem: compressed }));
      } catch (err) {
        toast.error("Erro ao processar imagem.");
      }
    }
  };

  const handleAddVariacao = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    const val = variacaoInput.trim();
    if (val && !produto.variacoes.includes(val)) {
      setProduto(prev => ({ ...prev, variacoes: [...prev.variacoes, val], cores: [...prev.cores, val] }));
      setVariacaoInput("");
    }
  };

  const handleSalvar = async (cadastrarOutro = false) => {
    if (!produto.nome) {
      toast.error("Preencha o nome do produto.");
      return;
    }

    setLoading(true);
    try {
      // Map UI fields back to DB fields
      const valorNumerico = parseFloat(produto.preco_tabela.replace(",", ".")) || produto.valor;
      
      const payload = {
        codigo: produto.codigo,
        nome: produto.nome,
        categoria: produto.categoria === "Sem categoria" ? "" : produto.categoria,
        estoque: produto.estoque,
        valor: valorNumerico,
        status: produto.status,
        imagem: produto.imagem,
        ncm: produto.ncm || null,
        cores: produto.variacoes, // Saving variations in cores column to preserve DB structure
      };

      if (isEditing) {
        const { error } = await supabase.from("produtos").update(payload).eq("id", search.id);
        if (error) {
          if (error.code === "23505") throw new Error("Já existe um produto com este código!");
          throw error;
        }
        toast.success("Produto atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("produtos").insert([payload]);
        if (error) {
          if (error.code === "23505") throw new Error("Já existe um produto com este código!");
          throw error;
        }
        toast.success("Produto cadastrado com sucesso!");
      }

      if (cadastrarOutro) {
        navigate({ to: "/app/produto-novo" });
        window.location.reload(); // Force full reload to reset state easily
      } else {
        navigate({ to: "/app/produtos" });
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar produto: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isFetchingInfo) {
    return <div className="p-8 text-center text-muted-foreground">Carregando produto...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      {/* Header */}
      <div className="bg-white border-b px-8 py-5">
        <h1 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
          {isEditing ? "EDITAR PRODUTO" : "NOVO PRODUTO"}
        </h1>
      </div>

      <div className="p-8 max-w-[1200px] mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-border/50 overflow-hidden">
          
          <div className="p-8">
            {/* Top section (Image + Basic Info) */}
            <div className="flex gap-8 mb-10">
              {/* Image Box */}
              <div className="relative w-24 h-24 flex-shrink-0 group">
                <div 
                  className="w-24 h-24 bg-muted/30 border-2 border-dashed border-border rounded flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/50 overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {produto.imagem ? (
                    <img src={produto.imagem} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 opacity-40" />
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
                {produto.imagem && (
                  <button
                    type="button"
                    title="Remover foto"
                    onClick={(e) => { e.stopPropagation(); setProduto({ ...produto, imagem: "" }); }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                )}
              </div>
              
              {/* Basic Fields */}
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_250px] gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-normal">* Nome</Label>
                    <Input 
                      className="border-slate-300"
                      value={produto.nome}
                      onChange={(e) => setProduto({...produto, nome: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-normal">Código</Label>
                    <Input 
                      placeholder="SKU ou referência" 
                      className="border-slate-300"
                      value={produto.codigo}
                      onChange={(e) => setProduto({...produto, codigo: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[150px_150px_1fr] gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-normal">Unidade de medida</Label>
                    <Input 
                      placeholder="Kg, Cx, Un, Pç, etc." 
                      className="border-slate-300"
                      value={produto.unidade_medida}
                      onChange={(e) => setProduto({...produto, unidade_medida: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-normal">Venda em múltiplos de</Label>
                    <Input 
                      type="number" 
                      className="border-slate-300 text-right"
                      value={produto.multiplos_venda}
                      onChange={(e) => setProduto({...produto, multiplos_venda: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-normal">Categoria</Label>
                    <Select value={produto.categoria} onValueChange={(val) => setProduto({...produto, categoria: val})}>
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Sem categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriasDB.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue="preco" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 gap-6 h-auto">
                <TabsTrigger 
                  value="preco" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:text-brand data-[state=active]:shadow-none data-[state=active]:bg-transparent pb-3 text-xs uppercase tracking-wide px-0 font-bold text-muted-foreground"
                >
                  TABELAS DE PREÇO
                </TabsTrigger>
                <TabsTrigger 
                  value="info" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:text-brand data-[state=active]:shadow-none data-[state=active]:bg-transparent pb-3 text-xs uppercase tracking-wide px-0 font-bold text-muted-foreground"
                >
                  INFORMAÇÕES GERAIS
                </TabsTrigger>
                <TabsTrigger 
                  value="variacoes" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:text-brand data-[state=active]:shadow-none data-[state=active]:bg-transparent pb-3 text-xs uppercase tracking-wide px-0 font-bold text-muted-foreground"
                >
                  VARIAÇÕES
                </TabsTrigger>
                <TabsTrigger 
                  value="peso" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:text-brand data-[state=active]:shadow-none data-[state=active]:bg-transparent pb-3 text-xs uppercase tracking-wide px-0 font-bold text-muted-foreground"
                >
                  PESO E DIMENSÕES
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="preco" className="pt-8 space-y-6">
                <div className="grid grid-cols-[150px_150px] gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-normal">Moeda</Label>
                    <Select value={produto.moeda} onValueChange={(val) => setProduto({...produto, moeda: val})}>
                      <SelectTrigger className="border-slate-300 bg-[#f8f9fa] h-9">
                        <SelectValue placeholder="R$" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="R$">R$</SelectItem>
                        <SelectItem value="US$">US$</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 relative">
                    <Label className="text-xs font-normal flex items-center gap-1 text-muted-foreground">Preço Mínimo <Info className="w-3 h-3"/></Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                      <Input 
                        placeholder="0,00" 
                        className="pl-8 text-right bg-[#f8f9fa] border-slate-300 h-9"
                        value={produto.preco_minimo}
                        onChange={(e) => setProduto({...produto, preco_minimo: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="w-[150px] space-y-2">
                  <Label className="text-xs font-normal text-slate-800">* Preço de Tabela</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                    <Input 
                      placeholder="0,00" 
                      className="pl-8 text-right bg-[#f8f9fa] border-slate-300 h-9"
                      value={produto.preco_tabela}
                      onChange={(e) => setProduto({...produto, preco_tabela: e.target.value})}
                    />
                  </div>
                </div>

                <div className="w-[150px] space-y-2">
                  <Label className="text-xs font-normal text-slate-800">Estoque inicial</Label>
                  <Input 
                    type="number"
                    min="0"
                    placeholder="0"
                    className="text-right bg-[#f8f9fa] border-slate-300 h-9"
                    value={produto.estoque === 0 ? "" : produto.estoque}
                    onChange={(e) => setProduto({...produto, estoque: Number(e.target.value) || 0})}
                  />
                </div>
              </TabsContent>

              <TabsContent value="info" className="pt-8 space-y-8">
                <div className="grid grid-cols-[120px_250px] gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-slate-700">IPI</Label>
                    <div className="flex rounded-md border border-slate-300 overflow-hidden h-9">
                      <Input 
                        className="border-0 rounded-none text-right flex-1 focus-visible:ring-0" 
                        placeholder="0,00"
                        value={produto.ipi}
                        onChange={(e) => setProduto({...produto, ipi: e.target.value})}
                      />
                      <div className="bg-[#f8f9fa] text-muted-foreground px-3 flex items-center border-l text-xs">%</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-normal flex items-center gap-1 text-slate-700">NCM <Info className="w-3 h-3 text-muted-foreground"/></Label>
                    <Input 
                      className="border-slate-300 h-9"
                      value={produto.ncm}
                      onChange={(e) => setProduto({...produto, ncm: e.target.value})}
                    />
                  </div>
                </div>

                <div className="w-[120px] space-y-2">
                  <Label className="text-xs font-normal flex items-center gap-1 text-slate-700">Comissão <Info className="w-3 h-3 text-muted-foreground"/></Label>
                  <div className="flex rounded-md border border-slate-300 overflow-hidden h-9">
                    <Input 
                      className="border-0 rounded-none text-right flex-1 focus-visible:ring-0" 
                      placeholder="5,00"
                      value={produto.comissao}
                      onChange={(e) => setProduto({...produto, comissao: e.target.value})}
                    />
                    <div className="bg-[#f8f9fa] text-muted-foreground px-3 flex items-center border-l text-xs">%</div>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <h4 className="text-sm font-medium text-slate-700 uppercase tracking-wide border-b pb-2">INFORMAÇÕES ADICIONAIS</h4>
                  <Textarea 
                    placeholder="Descreva informações adicionais deste produto" 
                    className="min-h-[150px] border-slate-300 resize-none text-sm p-4"
                    value={produto.info_adicionais}
                    onChange={(e) => setProduto({...produto, info_adicionais: e.target.value})}
                  />
                </div>
              </TabsContent>

              <TabsContent value="variacoes" className="pt-8 space-y-6">
                <Button className="bg-[#4b2781] hover:bg-[#4b2781]/90 h-9 px-4 text-xs font-medium uppercase tracking-wide">
                  <Plus className="w-4 h-4 mr-2" /> Nova variação
                </Button>
                
                <div className="bg-[#f8f9fa] border p-4 rounded flex items-center gap-4">
                  <Input 
                    placeholder="Nome da variação. Ex: Cor, Tamanho" 
                    className="bg-white border-brand flex-1 h-9"
                    value={variacaoInput}
                    onChange={(e) => setVariacaoInput(e.target.value)}
                    onKeyDown={(e) => {
                       if (e.key === "Enter") handleAddVariacao(e);
                    }}
                  />
                  <div className="flex gap-2">
                    <Button className="bg-[#a896bd] hover:bg-[#a896bd]/90 h-9 font-medium text-xs text-white" onClick={handleAddVariacao}>
                      Criar variação
                    </Button>
                    <Button variant="outline" className="h-9 font-medium text-xs text-[#4b2781] border-slate-300">
                      Cancelar
                    </Button>
                  </div>
                </div>

                {produto.variacoes.length > 0 && (
                  <div className="mt-4 flex flex-col gap-2 border rounded p-4">
                    {produto.variacoes.map((v, i) => (
                      <div key={i} className="flex justify-between items-center text-sm py-2 border-b last:border-0">
                        <span>{v}</span>
                        <Button variant="ghost" size="sm" className="h-6 text-destructive" onClick={() => setProduto(prev => ({...prev, variacoes: prev.variacoes.filter(va => va !== v)}))}>
                           Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="peso" className="pt-8 space-y-6">
                <p className="text-xs text-muted-foreground">Selecione a melhor forma de cadastro do peso e dimensões deste produto.</p>
                
                <RadioGroup 
                  value={produto.forma_peso} 
                  onValueChange={(val) => setProduto({...produto, forma_peso: val})}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className={`border p-4 rounded flex items-start space-x-3 cursor-pointer ${produto.forma_peso === 'unitaria' ? 'border-[#4b2781] bg-[#4b2781]/5' : ''}`} onClick={() => setProduto({...produto, forma_peso: 'unitaria'})}>
                    <RadioGroupItem value="unitaria" id="r1" className="mt-1" />
                    <div className="space-y-1">
                      <Label htmlFor="r1" className="font-semibold text-sm cursor-pointer">Peso e dimensões unitárias</Label>
                      <p className="text-xs text-muted-foreground">Considera o produto unitário.</p>
                    </div>
                  </div>
                  <div className={`border p-4 rounded flex items-start space-x-3 cursor-pointer ${produto.forma_peso === 'master' ? 'border-[#4b2781] bg-[#4b2781]/5' : ''}`} onClick={() => setProduto({...produto, forma_peso: 'master'})}>
                    <RadioGroupItem value="master" id="r2" className="mt-1" />
                    <div className="space-y-1">
                      <Label htmlFor="r2" className="font-semibold text-sm cursor-pointer">Peso e dimensões de caixa master</Label>
                      <p className="text-xs text-muted-foreground">Considera os múltiplos de venda, ou seja, uma caixa contendo várias unidades do produto.</p>
                    </div>
                  </div>
                </RadioGroup>

                {produto.forma_peso === 'master' && (
                  <div className="bg-[#4b2781]/5 border border-[#4b2781]/20 rounded p-4 flex gap-3 text-sm text-[#4b2781]">
                    <Info className="w-5 h-5 flex-shrink-0" />
                    <div>
                      Você selecionou a opção "Peso e dimensões de caixa master", mas não preencheu o campo "Venda em múltiplos de".<br/>
                      Assim, para o cálculo do volume do pedido, será considerada a caixa master com apenas uma unidade do produto.
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-6 pt-4 max-w-3xl">
                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-slate-700">Peso bruto</Label>
                    <div className="flex rounded-md border border-slate-300 overflow-hidden h-9">
                      <Input className="border-0 rounded-none text-right flex-1" value={produto.peso_bruto} onChange={(e) => setProduto({...produto, peso_bruto: e.target.value})} />
                      <div className="bg-[#f8f9fa] text-muted-foreground px-3 flex items-center border-l text-xs">kg</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-slate-700">Largura</Label>
                    <div className="flex rounded-md border border-slate-300 overflow-hidden h-9">
                      <Input className="border-0 rounded-none text-right flex-1" value={produto.largura} onChange={(e) => setProduto({...produto, largura: e.target.value})}/>
                      <div className="bg-[#f8f9fa] text-muted-foreground px-3 flex items-center border-l text-xs">cm</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-slate-700">Altura</Label>
                    <div className="flex rounded-md border border-slate-300 overflow-hidden h-9">
                      <Input className="border-0 rounded-none text-right flex-1" value={produto.altura} onChange={(e) => setProduto({...produto, altura: e.target.value})} />
                      <div className="bg-[#f8f9fa] text-muted-foreground px-3 flex items-center border-l text-xs">cm</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-slate-700">Comprimento</Label>
                    <div className="flex rounded-md border border-slate-300 overflow-hidden h-9">
                      <Input className="border-0 rounded-none text-right flex-1" value={produto.comprimento} onChange={(e) => setProduto({...produto, comprimento: e.target.value})}/>
                      <div className="bg-[#f8f9fa] text-muted-foreground px-3 flex items-center border-l text-xs">cm</div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Bottom Bar Actions */}
          <div className="bg-[#f8f9fa] p-4 px-8 border-t flex items-center gap-3">
            <Button 
              className="bg-[#4b2781] hover:bg-[#4b2781]/90 h-10 px-6 font-medium"
              onClick={() => handleSalvar(false)}
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar"}
            </Button>
            <Button 
              className="bg-[#4b2781] hover:bg-[#4b2781]/90 h-10 px-6 font-medium"
              onClick={() => handleSalvar(true)}
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar e cadastrar outro"}
            </Button>
            <Button 
              variant="outline" 
              className="h-10 px-6 border-slate-300 text-[#4b2781]"
              onClick={() => navigate({ to: "/app/produtos" })}
            >
              Cancelar
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
