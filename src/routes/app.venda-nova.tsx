import { toast } from "sonner";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  BookOpen,
  Building2,
  Check,
  ChevronsUpDown,
  CircleDollarSign,
  FileText,
  ImageIcon,
  Info,
  Package,
  Pencil,
  Plus,
  Save,
  Search,
  Store,
  Trash2,
  Truck,
  UserRound,
  Weight,
  type LucideIcon,
} from "lucide-react";
import { formatCpfCnpj, formatPhone } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { CnpjLoader } from "@/components/cnpj-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/app/venda-nova")({
  head: () => ({ meta: [{ title: "Novo Pedido - PREMIUM GARDEN" }] }),
  component: NovoPedido,
});

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function OrderSection({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t bg-card px-5 py-6 md:px-8">
      <div className="mb-4 flex items-center gap-2 border-b pb-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-base font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function NovoPedido() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);

  const [clienteId, setClienteId] = useState("");
  const [tipo, setTipo] = useState("VENDA");
  const [status, setStatus] = useState("Pendente");
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().split("T")[0]);
  const [contato, setContato] = useState("");
  const [condicaoPagamento, setCondicaoPagamento] = useState("");
  const [freteValor, setFreteValor] = useState(0);
  const [transportadora, setTransportadora] = useState("");
  const [rastreamento, setRastreamento] = useState("");
  const [enderecoEntrega, setEnderecoEntrega] = useState("Endereço principal do cliente");
  const [observacoes, setObservacoes] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [itens, setItens] = useState<any[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState<string>("1"); // string to allow free editing
  const [draftItemQtys, setDraftItemQtys] = useState<Record<number, string>>({}); // per-item draft
  const [openProduto, setOpenProduto] = useState(false);
  const [openCliente, setOpenCliente] = useState(false);
  const [descontoValor, setDescontoValor] = useState(0);
  const [descontoPercentual, setDescontoPercentual] = useState(0);

  const [openModalCliente, setOpenModalCliente] = useState(false);
  const [saveAfterClientCreation, setSaveAfterClientCreation] = useState(false);
  const [loadingCliente, setLoadingCliente] = useState(false);
  const [novoCliente, setNovoCliente] = useState({
    nome: "",
    cpf_cnpj: "",
    telefone: "",
    cep: "",
    endereco: "",
    numero: "",
    bairro: "",
    cidade: "",
    uf: "",
  });

  const [openNewProduct, setOpenNewProduct] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [newProductTab, setNewProductTab] = useState("pricing");
  const [newProduct, setNewProduct] = useState({
    nome: "",
    codigo: "",
    categoria: "Sem categoria",
    unidade: "Un",
    multiplo: 1,
    valor: 0,
    estoque: 0,
    ncm: "",
    comissao: 0,
    informacoes: "",
    variacoes: "",
    peso: "",
    largura: "",
    altura: "",
    comprimento: "",
  });

  const fetchData = async () => {
    const [{ data: clients }, { data: products }, { data: config }] = await Promise.all([
      supabase.from("clientes").select("*").order("nome"),
      supabase.from("produtos").select("*").eq("status", "Ativo").order("nome"),
      supabase.from("configuracoes").select("*").limit(1).maybeSingle(),
    ]);
    setClientes(clients || []);
    setProdutos(products || []);
    setCompany(config || null);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedClient = clientes.find((client) => client.id === clienteId);
  const selectedProduct = produtos.find((product) => product.id === produtoSelecionado);
  const categories = useMemo(
    () => Array.from(new Set(produtos.map((product) => product.categoria).filter(Boolean))).sort(),
    [produtos],
  );

  const subtotal = itens.reduce((total, item) => total + item.subtotal, 0);
  const percentualValue = (subtotal * descontoPercentual) / 100;
  const totalPedido = Math.max(0, subtotal - descontoValor - percentualValue) + freteValor;

  const handleAddItem = () => {
    if (!selectedProduct || parseInt(quantidade) <= 0 || quantidade === "") {
      toast.info("Selecione um produto e informe a quantidade.");
      return;
    }
    const qtd = Math.max(1, parseInt(quantidade) || 1);
    if (tipo === "VENDA" && Number(selectedProduct.estoque || 0) < qtd) {
      toast.info(`Estoque insuficiente. Disponível: ${selectedProduct.estoque || 0}.`);
      return;
    }

    setItens((current) => {
      const existingIndex = current.findIndex((item) => item.produto_id === selectedProduct.id);
      if (existingIndex >= 0) {
        return current.map((item, index) => {
          if (index !== existingIndex) return item;
          const newQuantity = item.quantidade + qtd;
          return {
            ...item,
            quantidade: newQuantity,
            subtotal: newQuantity * item.valor_unitario,
          };
        });
      }
      return [
        ...current,
        {
          produto_id: selectedProduct.id,
          nome: selectedProduct.nome,
          codigo: selectedProduct.codigo,
          valor_unitario: Number(selectedProduct.valor || 0),
          quantidade: qtd,
          subtotal: Number(selectedProduct.valor || 0) * qtd,
          imagem: selectedProduct.imagem,
        },
      ];
    });
    setProdutoSelecionado("");
    setQuantidade("1");
  };

  const handleUpdateItem = (
    index: number,
    field: "quantidade" | "valor_unitario",
    value: number,
  ) => {
    setItens((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const next = { ...item, [field]: Math.max(field === "quantidade" ? 1 : 0, value) };
        return { ...next, subtotal: next.quantidade * next.valor_unitario };
      }),
    );
  };

  const handleRemoveItem = (index: number) => {
    setItens((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSalvar = async () => {
    if (itens.length === 0) {
      toast.info("Adicione pelo menos um produto ao pedido.");
      return;
    }
    if (!condicaoPagamento.trim()) {
      toast.info("Informe a condição de pagamento nos detalhes do pedido.");
      setDetailsOpen(true);
      return;
    }
    if (!clienteId) {
      setSaveAfterClientCreation(true);
      setOpenModalCliente(true);
      return;
    }
    await executarSalvamentoVenda(clienteId);
  };

  const executarSalvamentoVenda = async (clientId: string) => {
    setLoading(true);
    try {
      let nextNumero = 1;
      const { data: maxVenda } = await supabase
        .from("vendas")
        .select("numero")
        .not("numero", "is", null)
        .order("numero", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (maxVenda?.numero) nextNumero = Number(maxVenda.numero) + 1;

      const { data: vendaData, error: vendaError } = await supabase
        .from("vendas")
        .insert([
          {
            cliente_id: clientId,
            tipo,
            status: tipo === "DAV" ? "Pendente" : status,
            valor_total: totalPedido,
            numero: nextNumero,
            condicao_pagamento: condicaoPagamento,
            desconto_percentual: descontoPercentual,
            desconto_valor: descontoValor,
          },
        ])
        .select()
        .single();
      if (vendaError) throw vendaError;

      const { error: itemsError } = await supabase.from("vendas_itens").insert(
        itens.map((item) => ({
          venda_id: vendaData.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          subtotal: item.subtotal,
        })),
      );
      if (itemsError) throw itemsError;

      if (tipo === "VENDA") {
        for (const item of itens) {
          const product = produtos.find((candidate) => candidate.id === item.produto_id);
          if (product) {
            await supabase
              .from("produtos")
              .update({ estoque: Number(product.estoque || 0) - Number(item.quantidade) })
              .eq("id", item.produto_id);
          }
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        await supabase.from("contas_receber").insert([
          {
            venda_id: vendaData.id,
            cliente_id: clientId,
            descricao: `Pedido #${nextNumero}`,
            valor: totalPedido,
            vencimento: dueDate.toISOString().split("T")[0],
            status: status === "Pago" ? "Recebido" : "Pendente",
            data_pagamento: status === "Pago" ? new Date().toISOString().split("T")[0] : null,
          },
        ]);
      }

      toast.success(tipo === "DAV" ? "Orçamento criado." : "Pedido gerado com sucesso.");
      navigate({ to: "/app/vendas" });
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao gerar pedido: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const buscarCnpj = async (document: string) => {
    const cnpj = document.replace(/\D/g, "");
    if (cnpj.length !== 14) return;
    setLoadingCnpj(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (!response.ok) throw new Error("CNPJ não encontrado.");
      const data = await response.json();
      setNovoCliente((current) => ({
        ...current,
        nome: data.razao_social || current.nome,
        telefone: data.ddd_telefone_1
          ? data.ddd_telefone_1.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3")
          : current.telefone,
        cep: data.cep
          ? data.cep.replace(/\D/g, "").replace(/(\d{5})(\d{3})/, "$1-$2")
          : current.cep,
        endereco: data.logradouro || current.endereco,
        numero: data.numero || current.numero,
        bairro: data.bairro || current.bairro,
        cidade: data.municipio || current.cidade,
        uf: data.uf || current.uf,
      }));
      toast.success("Dados preenchidos pela Receita Federal.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao consultar o CNPJ.");
    } finally {
      setLoadingCnpj(false);
    }
  };

  const handleSalvarNovoCliente = async () => {
    if (!novoCliente.nome.trim()) {
      toast.info("Informe o nome do cliente.");
      return;
    }
    setLoadingCliente(true);
    try {
      const { data, error } = await supabase
        .from("clientes")
        .insert([{ ...novoCliente, status: "Ativo" }])
        .select()
        .single();
      if (error) throw error;
      setClientes((current) => [...current, data].sort((a, b) => a.nome.localeCompare(b.nome)));
      setClienteId(data.id);
      setOpenModalCliente(false);
      if (saveAfterClientCreation) await executarSalvamentoVenda(data.id);
    } catch (err: any) {
      toast.error("Erro ao criar cliente: " + err.message);
    } finally {
      setLoadingCliente(false);
      setSaveAfterClientCreation(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!newProduct.nome.trim() || !newProduct.codigo.trim()) {
      toast.info("Informe o nome e o código do produto.");
      return;
    }
    setSavingProduct(true);
    try {
      const dimensao = [newProduct.largura, newProduct.altura].filter(Boolean).join(" x ");
      const { data, error } = await supabase
        .from("produtos")
        .insert([
          {
            nome: newProduct.nome.trim(),
            codigo: newProduct.codigo.trim(),
            categoria: newProduct.categoria || "Sem categoria",
            estoque: Number(newProduct.estoque || 0),
            valor: Number(newProduct.valor || 0),
            status: "Ativo",
            imagem: "",
            numero: null,
            dimensao: dimensao || null,
            volume: null,
            comprimento: newProduct.comprimento || null,
            cores: newProduct.variacoes
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            ncm: newProduct.ncm || null,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      setProdutos((current) => [...current, data].sort((a, b) => a.nome.localeCompare(b.nome)));
      setProdutoSelecionado(data.id);
      setOpenNewProduct(false);
      toast.success("Produto criado e selecionado.");
    } catch (err: any) {
      toast.error("Erro ao criar produto: " + err.message);
    } finally {
      setSavingProduct(false);
    }
  };

  return (
    <>
      {loadingCnpj && <CnpjLoader />}
      <div className="overflow-hidden border-2 border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 bg-muted/40 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">Pedido #novo</h1>
              <Badge className="border-amber-300 bg-amber-100 text-amber-700 hover:bg-amber-100">
                {tipo === "DAV" ? "Em orçamento" : "Novo pedido"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Preencha cliente, produtos e condição de pagamento para gerar o pedido.
            </p>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/app/vendas">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos pedidos
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 border-y-2 border-foreground/80 px-5 py-3">
          <Button onClick={handleSalvar} disabled={loading}>
            <Save className="mr-2 h-4 w-4" /> {loading ? "Gerando..." : "Gerar pedido"}
          </Button>
          <Button variant="outline" onClick={() => setDetailsOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Detalhes do pedido
          </Button>
        </div>

        <OrderSection icon={Store} title="Cliente">
          <div className="max-w-5xl space-y-3">
            <Popover open={openCliente} onOpenChange={setOpenCliente}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCliente}
                  className="h-10 w-full justify-between border-primary/70 font-normal"
                >
                  <span className="truncate">
                    {selectedClient
                      ? `${selectedClient.nome}${selectedClient.cpf_cnpj ? ` - ${selectedClient.cpf_cnpj}` : ""}`
                      : "Digite o nome ou CNPJ/CPF do cliente e selecione"}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[min(720px,calc(100vw-2rem))] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar cliente..." />
                  <CommandList>
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup>
                      {clientes.map((client) => (
                        <CommandItem
                          key={client.id}
                          value={`${client.nome} ${client.cpf_cnpj || ""} ${client.cidade || ""}`}
                          onSelect={() => {
                            setClienteId(client.id);
                            setOpenCliente(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              clienteId === client.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <div>
                            <p className="font-medium">{client.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {[client.cpf_cnpj, client.cidade, client.uf]
                                .filter(Boolean)
                                .join(" - ")}
                            </p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSaveAfterClientCreation(false);
                  setOpenModalCliente(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Novo cliente
              </Button>
              <Button variant="link" size="sm" asChild>
                <Link to="/app/clientes">Listar todos os clientes</Link>
              </Button>
            </div>
          </div>
        </OrderSection>

        <OrderSection icon={Building2} title="Representada">
          <div className="border-l-4 border-primary/30 pl-4">
            <p className="font-semibold text-primary">
              {company?.nome_fantasia || company?.razao_social || "PREMIUM GARDEN"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {[company?.telefone, company?.email_contato].filter(Boolean).join(" - ") ||
                "Representada principal"}
            </p>
          </div>
        </OrderSection>

        <OrderSection icon={BookOpen} title="Produtos">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="min-w-0 flex-1 space-y-2">
                <Label>Produto</Label>
                <Popover open={openProduto} onOpenChange={setOpenProduto}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openProduto}
                      className="h-10 w-full justify-between font-normal"
                    >
                      <span className="truncate">
                        {selectedProduct
                          ? `${selectedProduct.codigo || "S/C"} - ${selectedProduct.nome} - ${currency.format(Number(selectedProduct.valor || 0))}`
                          : "Digite o código ou nome do produto para adicionar"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[min(760px,calc(100vw-2rem))] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar produto por código ou nome..." />
                      <CommandList>
                        <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                        <CommandGroup>
                          {produtos.map((product) => (
                            <CommandItem
                              key={product.id}
                              value={`${product.codigo || ""} ${product.nome} ${product.categoria || ""}`}
                              onSelect={() => {
                                setProdutoSelecionado(product.id);
                                setOpenProduto(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  produtoSelecionado === product.id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{product.nome}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {product.codigo || "Sem código"} - Estoque:{" "}
                                    {product.estoque || 0}
                                  </p>
                                </div>
                                <strong className="shrink-0 text-sm">
                                  {currency.format(Number(product.valor || 0))}
                                </strong>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="w-full space-y-2 lg:w-28">
                <Label>Quantidade</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={quantidade}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setQuantidade(e.target.value.replace(/[^0-9]/g, ""))}
                  onBlur={() => {
                    const n = parseInt(quantidade) || 1;
                    setQuantidade(String(Math.max(1, n)));
                  }}
                />
              </div>
              <Button onClick={handleAddItem}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpenNewProduct(true)}>
                <Plus className="mr-2 h-4 w-4" /> Novo produto
              </Button>
              <Button variant="link" size="sm" asChild>
                <Link to="/app/produtos">Listar todos os produtos</Link>
              </Button>
            </div>

            <div className="overflow-x-auto rounded-md border">
              <div className="grid min-w-[760px] grid-cols-[minmax(240px,1fr)_120px_150px_150px_48px] bg-muted/40 px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">
                <span>Produto</span>
                <span>Quantidade</span>
                <span>Unitário</span>
                <span>Subtotal</span>
                <span />
              </div>
              {itens.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Nenhum produto adicionado ao pedido.
                </div>
              ) : (
                itens.map((item, index) => (
                  <div
                    key={item.produto_id}
                    className="grid min-w-[760px] grid-cols-[minmax(240px,1fr)_120px_150px_150px_48px] items-center border-t px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md bg-muted">
                        {item.imagem ? (
                          <img
                            src={item.imagem}
                            alt={item.nome}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.codigo || "Sem código"}
                        </p>
                      </div>
                    </div>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={draftItemQtys[index] !== undefined ? draftItemQtys[index] : String(item.quantidade)}
                      onFocus={(e) => {
                        setDraftItemQtys((prev) => ({ ...prev, [index]: String(item.quantidade) }));
                        e.target.select();
                      }}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        setDraftItemQtys((prev) => ({ ...prev, [index]: raw }));
                      }}
                      onBlur={() => {
                        const n = Math.max(1, parseInt(draftItemQtys[index] ?? "") || 1);
                        handleUpdateItem(index, "quantidade", n);
                        setDraftItemQtys((prev) => { const d = { ...prev }; delete d[index]; return d; });
                      }}
                      className="h-8 w-24"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.valor_unitario}
                      onChange={(event) =>
                        handleUpdateItem(index, "valor_unitario", Number(event.target.value))
                      }
                      className="h-8 w-32"
                    />
                    <strong className="text-sm">{currency.format(item.subtotal)}</strong>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Summary bar + finish button */}
            {itens.length > 0 && (
              <div className="flex flex-col gap-3 rounded-md border bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                  <span><strong className="text-foreground">{itens.length}</strong> {itens.length === 1 ? "item" : "itens"} no pedido</span>
                  <span>Qtd. total: <strong className="text-foreground">{itens.reduce((s, i) => s + i.quantidade, 0)}</strong></span>
                  <span>Valor total: <strong className="text-primary">{currency.format(subtotal)}</strong></span>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  className="shrink-0 bg-primary"
                  onClick={() => setDetailsOpen(true)}
                >
                  <Check className="mr-2 h-4 w-4" /> Terminei de adicionar os produtos
                </Button>
              </div>
            )}
          </div>
        </OrderSection>

        <OrderSection icon={Info} title="Detalhes do pedido">
          <div className="grid gap-8 lg:grid-cols-3">
            <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Nº do pedido</dt>
              <dd>Novo</dd>
              <dt className="text-muted-foreground">Data da emissão</dt>
              <dd>{new Date(`${dataEmissao}T12:00:00`).toLocaleDateString("pt-BR")}</dd>
              <dt className="text-muted-foreground">Tipo de pedido</dt>
              <dd>{tipo === "DAV" ? "Orçamento" : "Venda"}</dd>
              <dt className="text-muted-foreground">Vendedor</dt>
              <dd>Administrador</dd>
              <dt className="text-muted-foreground">Contato</dt>
              <dd>{contato || "---"}</dd>
            </dl>
            <dl className="grid grid-cols-[150px_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Condição de pagamento</dt>
              <dd>{condicaoPagamento || "---"}</dd>
              <dt className="text-muted-foreground">Status inicial</dt>
              <dd>{tipo === "DAV" ? "Em orçamento" : status}</dd>
              <dt className="text-muted-foreground">Informações adicionais</dt>
              <dd>{observacoes || "---"}</dd>
            </dl>
            <dl className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Valor do frete</dt>
              <dd>{currency.format(freteValor)}</dd>
              <dt className="text-muted-foreground">Transportadora</dt>
              <dd>{transportadora || "---"}</dd>
              <dt className="text-muted-foreground">Rastreamento</dt>
              <dd>{rastreamento || "---"}</dd>
              <dt className="text-muted-foreground">End. de entrega</dt>
              <dd>{enderecoEntrega}</dd>
            </dl>
          </div>
          <Button variant="outline" className="mt-6" onClick={() => setDetailsOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Alterar detalhes do pedido
          </Button>
        </OrderSection>

        <section className="border-t bg-muted/20 px-5 py-6 md:px-8">
          <div className="ml-auto w-full max-w-lg space-y-3 rounded-md border-2 border-primary/50 bg-card p-5">
            <div className="flex items-center gap-2 border-b pb-3">
              <CircleDollarSign className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Resumo do pedido</h2>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <strong>{currency.format(subtotal)}</strong>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Desconto (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={descontoValor}
                  onChange={(event) => setDescontoValor(Number(event.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label>Desconto (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={descontoPercentual}
                  onChange={(event) => setDescontoPercentual(Number(event.target.value))}
                />
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Frete</span>
              <span>{currency.format(freteValor)}</span>
            </div>
            <div className="flex justify-between border-t pt-3 text-lg">
              <strong>Total</strong>
              <strong className="text-primary">{currency.format(totalPedido)}</strong>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-2 border-t-2 border-foreground/80 bg-card px-5 py-4 md:px-8">
          <Button onClick={handleSalvar} disabled={loading}>
            <Save className="mr-2 h-4 w-4" /> {loading ? "Gerando..." : "Gerar pedido"}
          </Button>
          <Button variant="outline" asChild>
            <Link to="/app/vendas">Cancelar</Link>
          </Button>
        </div>
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes do pedido</DialogTitle>
            <DialogDescription>
              Defina emissão, pagamento, entrega e informações adicionais.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-8 py-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Número do pedido</Label>
                <Input value="Automático" disabled />
              </div>
              <div className="space-y-2">
                <Label>Data da emissão</Label>
                <Input
                  type="date"
                  value={dataEmissao}
                  onChange={(event) => setDataEmissao(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de pedido</Label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={tipo}
                  onChange={(event) => setTipo(event.target.value)}
                >
                  <option value="VENDA">Venda</option>
                  <option value="DAV">Orçamento</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status inicial</Label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  disabled={tipo === "DAV"}
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Aguardando Pagamento">Aguardando pagamento</option>
                  <option value="Em Separação">Em separação</option>
                  <option value="Pago">Pago</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Contato no cliente</Label>
                <Input
                  value={contato}
                  onChange={(event) => setContato(event.target.value)}
                  placeholder="Nome do contato"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b pb-2">
                <CircleDollarSign className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-medium uppercase text-muted-foreground">Pagamento</h3>
              </div>
              <div className="max-w-xl space-y-2">
                <Label>Condição de pagamento *</Label>
                <Input
                  value={condicaoPagamento}
                  onChange={(event) => setCondicaoPagamento(event.target.value)}
                  placeholder="Ex.: À vista, 30 dias, 30/60/90"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b pb-2">
                <Truck className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-medium uppercase text-muted-foreground">Entrega</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Valor do frete</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={freteValor}
                    onChange={(event) => setFreteValor(Number(event.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Transportadora</Label>
                  <Input
                    value={transportadora}
                    onChange={(event) => setTransportadora(event.target.value)}
                    placeholder="Transportadora"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rastreamento</Label>
                  <Input
                    value={rastreamento}
                    onChange={(event) => setRastreamento(event.target.value)}
                    placeholder="Código ou link"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Endereço de entrega</Label>
                  <Input
                    value={enderecoEntrega}
                    onChange={(event) => setEnderecoEntrega(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="border-b pb-2">
                <h3 className="text-lg font-medium uppercase text-muted-foreground">
                  Informações adicionais
                </h3>
              </div>
              <textarea
                className="min-h-28 w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={observacoes}
                onChange={(event) => setObservacoes(event.target.value)}
                placeholder="Descreva informações adicionais deste pedido"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setDetailsOpen(false)}>Salvar detalhes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openNewProduct} onOpenChange={setOpenNewProduct}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Novo produto</DialogTitle>
            <DialogDescription>Cadastre o produto sem sair do pedido.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-3 md:grid-cols-[64px_1fr_180px]">
            <div className="grid h-16 w-16 place-items-center rounded-md border bg-muted">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={newProduct.nome}
                onChange={(event) => setNewProduct({ ...newProduct, nome: event.target.value })}
                placeholder="Nome do produto"
              />
            </div>
            <div className="space-y-2">
              <Label>Código *</Label>
              <Input
                value={newProduct.codigo}
                onChange={(event) => setNewProduct({ ...newProduct, codigo: event.target.value })}
                placeholder="SKU ou referência"
              />
            </div>
            <div className="space-y-2 md:col-start-2">
              <Label>Unidade de medida</Label>
              <Input
                value={newProduct.unidade}
                onChange={(event) => setNewProduct({ ...newProduct, unidade: event.target.value })}
                placeholder="Un, Kg, Cx"
              />
            </div>
            <div className="space-y-2">
              <Label>Venda em múltiplos de</Label>
              <Input
                type="number"
                min="1"
                value={newProduct.multiplo}
                onChange={(event) =>
                  setNewProduct({ ...newProduct, multiplo: Number(event.target.value) })
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2 md:col-start-2">
              <Label>Categoria</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={newProduct.categoria}
                onChange={(event) =>
                  setNewProduct({ ...newProduct, categoria: event.target.value })
                }
              >
                <option value="Sem categoria">Sem categoria</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Tabs value={newProductTab} onValueChange={setNewProductTab}>
            <TabsList className="h-auto w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="pricing"
                className="rounded-none border-b-2 border-transparent px-5 py-3 data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                Tabelas de preço
              </TabsTrigger>
              <TabsTrigger
                value="general"
                className="rounded-none border-b-2 border-transparent px-5 py-3 data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                Informações gerais
              </TabsTrigger>
              <TabsTrigger
                value="variations"
                className="rounded-none border-b-2 border-transparent px-5 py-3 data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                Variações
              </TabsTrigger>
              <TabsTrigger
                value="dimensions"
                className="rounded-none border-b-2 border-transparent px-5 py-3 data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                Peso e dimensões
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pricing" className="min-h-64 p-4">
              <div className="grid max-w-xl gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Preço de tabela *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newProduct.valor}
                    onChange={(event) =>
                      setNewProduct({ ...newProduct, valor: Number(event.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estoque inicial</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newProduct.estoque}
                    onChange={(event) =>
                      setNewProduct({ ...newProduct, estoque: Number(event.target.value) })
                    }
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="general" className="min-h-64 space-y-6 p-4">
              <div className="grid max-w-xl gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>NCM</Label>
                  <Input
                    value={newProduct.ncm}
                    onChange={(event) =>
                      setNewProduct({
                        ...newProduct,
                        ncm: event.target.value.replace(/\D/g, "").slice(0, 8),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Comissão (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newProduct.comissao}
                    onChange={(event) =>
                      setNewProduct({ ...newProduct, comissao: Number(event.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Informações adicionais</Label>
                <textarea
                  className="min-h-32 w-full rounded-md border p-3 text-sm"
                  value={newProduct.informacoes}
                  onChange={(event) =>
                    setNewProduct({ ...newProduct, informacoes: event.target.value })
                  }
                />
              </div>
            </TabsContent>
            <TabsContent value="variations" className="min-h-64 p-4">
              <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-4 py-8 text-center">
                <Package className="h-12 w-12 text-primary/60" />
                <div>
                  <h3 className="font-semibold">Variações do produto</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Informe cores ou variações separadas por vírgula.
                  </p>
                </div>
                <Input
                  value={newProduct.variacoes}
                  onChange={(event) =>
                    setNewProduct({ ...newProduct, variacoes: event.target.value })
                  }
                  placeholder="Ex.: Verde, Preto, Terracota"
                />
              </div>
            </TabsContent>
            <TabsContent value="dimensions" className="min-h-64 p-4">
              <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
                <Weight className="h-5 w-5" /> Peso e dimensões unitárias
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Peso bruto</Label>
                  <Input
                    value={newProduct.peso}
                    onChange={(event) => setNewProduct({ ...newProduct, peso: event.target.value })}
                    placeholder="kg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Largura</Label>
                  <Input
                    value={newProduct.largura}
                    onChange={(event) =>
                      setNewProduct({ ...newProduct, largura: event.target.value })
                    }
                    placeholder="cm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Altura</Label>
                  <Input
                    value={newProduct.altura}
                    onChange={(event) =>
                      setNewProduct({ ...newProduct, altura: event.target.value })
                    }
                    placeholder="cm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Comprimento</Label>
                  <Input
                    value={newProduct.comprimento}
                    onChange={(event) =>
                      setNewProduct({ ...newProduct, comprimento: event.target.value })
                    }
                    placeholder="cm"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNewProduct(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProduct} disabled={savingProduct}>
              <Check className="mr-2 h-4 w-4" /> {savingProduct ? "Salvando..." : "Salvar produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openModalCliente} onOpenChange={setOpenModalCliente}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo cliente</DialogTitle>
            <DialogDescription>Cadastre o cliente sem sair do pedido.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome / Empresa *</Label>
              <Input
                value={novoCliente.nome}
                onChange={(event) => setNovoCliente({ ...novoCliente, nome: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>CPF / CNPJ</Label>
              <div className="flex gap-2">
                <Input
                  value={novoCliente.cpf_cnpj}
                  onChange={(event) => {
                    const value = formatCpfCnpj(event.target.value);
                    setNovoCliente({ ...novoCliente, cpf_cnpj: value });
                    if (value.replace(/\D/g, "").length === 14) buscarCnpj(value);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => buscarCnpj(novoCliente.cpf_cnpj)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={novoCliente.telefone}
                onChange={(event) =>
                  setNovoCliente({ ...novoCliente, telefone: formatPhone(event.target.value) })
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input
                  value={novoCliente.cep}
                  onChange={(event) => setNovoCliente({ ...novoCliente, cep: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input
                  value={novoCliente.endereco}
                  onChange={(event) =>
                    setNovoCliente({ ...novoCliente, endereco: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input
                  value={novoCliente.numero}
                  onChange={(event) =>
                    setNovoCliente({ ...novoCliente, numero: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input
                  value={novoCliente.bairro}
                  onChange={(event) =>
                    setNovoCliente({ ...novoCliente, bairro: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={novoCliente.cidade}
                  onChange={(event) =>
                    setNovoCliente({ ...novoCliente, cidade: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>UF</Label>
                <Input
                  maxLength={2}
                  value={novoCliente.uf}
                  onChange={(event) =>
                    setNovoCliente({ ...novoCliente, uf: event.target.value.toUpperCase() })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModalCliente(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarNovoCliente} disabled={loadingCliente}>
              <UserRound className="mr-2 h-4 w-4" />{" "}
              {loadingCliente ? "Salvando..." : "Salvar cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
