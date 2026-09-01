import { toast } from "sonner";
import { formatCpfCnpj, formatPhone } from "@/lib/utils";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabaseParceiro as supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Trash2, ShoppingCart, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/parceiro/pdv")({
  head: () => ({ meta: [{ title: "Nova Venda — SENALANDIA 2 ERP" }] }),
  component: ParceiroPDV,
});

function ParceiroPDV() {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientForm, setClientForm] = useState({
    nome: "",
    documento: "",
    telefone: "",
    cep: "",
    endereco: "",
    numero: "",
    bairro: "",
    cidade: "",
    uf: "",
    pagamento: "Dinheiro / Pix",
    frete: "Retirada",
    observacoes: "",
    descontoPercentual: 0,
    condicaoPagamento: "",
  });
  const [vendedorInfo, setVendedorInfo] = useState<{ id: string; nome: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [davGeradoId, setDavGeradoId] = useState<string | null>(null);
  const [davGeradoNumero, setDavGeradoNumero] = useState<string | number | null>(null);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const { data: vData } = await supabase
          .from("vendedores")
          .select("id, status, nome")
          .eq("user_id", session.user.id)
          .single();
        if (vData) {
          setVendedorInfo({ id: vData.id, nome: vData.nome });
          if (vData.status === "Aguardando Aprovação") {
            navigate({ to: "/parceiro/dashboard" });
            return;
          }
        }
      }

      const { data } = await supabase.from("produtos").select("*").eq("status", "Ativo").order("nome");
      if (data) {
        setProdutos(data);

        // Verifica se veio um produto mágico pela URL (formato antigo)
        const params = new URLSearchParams(window.location.search);

        const eParam = params.get("e");
        const cnjParam = params.get("cnpj");
        const cepParam = params.get("cep");
        const endParam = params.get("end");
        const numParam = params.get("num");
        const bairroParam = params.get("bairro");
        const cidParam = params.get("cid");
        const ufParam = params.get("uf");
        const telParam = params.get("tel");

        if (eParam || cnjParam) {
          setClientForm((prev) => ({
            ...prev,
            nome: eParam || "",
            documento: cnjParam || "",
            cep: cepParam || "",
            endereco: endParam || "",
            numero: numParam || "",
            bairro: bairroParam || "",
            cidade: cidParam || "",
            uf: ufParam || "",
            telefone: telParam || "",
          }));
        }

        const produtoIdMagic = params.get("produto");
        if (produtoIdMagic) {
          const magicProduct = data.find((p) => p.id === produtoIdMagic);
          if (magicProduct) {
            setCart([
              {
                id: magicProduct.id,
                p: magicProduct.nome,
                q: 1,
                u: Number(magicProduct.valor),
                t: Number(magicProduct.valor),
                emoji: magicProduct.emoji,
                imagem: magicProduct.imagem,
              },
            ]);
            // Limpa a URL para não adicionar de novo num refresh
            window.history.replaceState({}, "", "/parceiro/pdv");
          }
        }

        // Novo formato do Carrinho via Catálogo
        const cartMagic = params.get("c");
        if (cartMagic) {
          const parsedCart: any[] = [];
          const items = cartMagic.split(",");
          items.forEach((item) => {
            const [id, qStr] = item.split(":");
            const qty = parseInt(qStr) || 1;
            const prod = data.find((p) => p.id === id);
            if (prod) {
              parsedCart.push({
                id: prod.id,
                p: prod.nome,
                q: qty,
                u: Number(prod.valor),
                t: qty * Number(prod.valor),
                emoji: prod.emoji,
                imagem: prod.imagem,
              });
            }
          });
          if (parsedCart.length > 0) {
            setCart(parsedCart);
            window.history.replaceState({}, "", "/parceiro/pdv");
          }
        }
      }
    };
    init();
  }, []);

  const addToCart = (produto: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === produto.id);
      if (existing) {
        return prev.map((i) =>
          i.id === produto.id ? { ...i, q: i.q + 1, t: (i.q + 1) * i.u } : i,
        );
      }
      return [
        ...prev,
        {
          id: produto.id,
          p: produto.nome,
          q: 1,
          u: Number(produto.valor),
          t: Number(produto.valor),
          emoji: produto.emoji,
          imagem: produto.imagem,
        },
      ];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const newQ = i.q + delta;
          if (newQ <= 0) return i;
          return { ...i, q: newQ, t: newQ * i.u };
        }
        return i;
      }),
    );
  };

  const setQuantity = (id: string, newQ: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          if (newQ <= 0) return i;
          return { ...i, q: newQ, t: newQ * i.u };
        }
        return i;
      }),
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const subtotal = cart.reduce((s, i) => s + i.t, 0);
  const valorDesconto = (subtotal * (clientForm.descontoPercentual || 0)) / 100;
  const totalComDesconto = subtotal - valorDesconto;

  const handleOpenClientModal = () => {
    if (cart.length === 0 || !vendedorInfo) return;
    setIsClientModalOpen(true);
  };

  const buscarCnpj = async (doc: string) => {
    const cnpjLimpo = doc.replace(/\D/g, "");
    if (cnpjLimpo.length !== 14) return;
    
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      if (!res.ok) {
        toast.error("CNPJ não encontrado na Receita Federal.");
        return;
      }
      const data = await res.json();
      
      const tel = data.ddd_telefone_1 ? data.ddd_telefone_1.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3") : "";
      const cepFmt = data.cep ? data.cep.replace(/\D/g, "").replace(/(\d{5})(\d{3})/, "$1-$2") : "";
      const tipoLogradouro = data.descricao_tipo_de_logradouro ? data.descricao_tipo_de_logradouro + " " : "";
      const cidade = data.municipio ? data.municipio.charAt(0) + data.municipio.slice(1).toLowerCase() : "";
      
      setClientForm((prev) => ({
        ...prev,
        nome: data.razao_social || prev.nome,
        telefone: tel || prev.telefone,
        cep: cepFmt || prev.cep,
        endereco: tipoLogradouro + (data.logradouro || ""),
        numero: data.numero || prev.numero,
        bairro: data.bairro || prev.bairro,
        cidade: cidade || prev.cidade,
        uf: data.uf || prev.uf,
      }));
      toast.success("Dados preenchidos via Receita Federal!");
    } catch (error) {
      console.error("Erro na busca do CNPJ:", error);
    }
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.nome) {
      toast.error("Por favor, preencha o nome do cliente.");
      return;
    }

    setIsClientModalOpen(false);
    setLoading(true);

    try {
      // 1. Cria ou busca o cliente
      let finalClienteId = null;

      // Se o cliente digitou um documento, tenta buscar primeiro para não duplicar
      if (clientForm.documento && clientForm.documento.trim() !== "") {
        const { data: existingClient } = await supabase
          .from("clientes")
          .select("id")
          .eq("cpf_cnpj", clientForm.documento.trim())
          .maybeSingle();

        if (existingClient) {
          finalClienteId = existingClient.id;
        }
      }

      // Se não encontrou o cliente, tenta criar um novo
      if (!finalClienteId) {
        const payload: any = { nome: clientForm.nome };
        if (clientForm.documento && clientForm.documento.trim() !== "") {
          payload.cpf_cnpj = clientForm.documento.trim();
        }
        if (clientForm.telefone && clientForm.telefone.trim() !== "") {
          payload.telefone = clientForm.telefone.trim();
        }
        if (clientForm.cep && clientForm.cep.trim() !== "") {
          payload.cep = clientForm.cep.trim();
        }
        if (clientForm.endereco && clientForm.endereco.trim() !== "") {
          payload.endereco = clientForm.endereco.trim();
        }
        if (clientForm.numero && clientForm.numero.trim() !== "") {
          payload.numero = clientForm.numero.trim();
        }
        if (clientForm.bairro && clientForm.bairro.trim() !== "") {
          payload.bairro = clientForm.bairro.trim();
        }
        if (clientForm.cidade && clientForm.cidade.trim() !== "") {
          payload.cidade = clientForm.cidade.trim();
        }
        if (clientForm.uf && clientForm.uf.trim() !== "") {
          payload.uf = clientForm.uf.trim();
        }
        payload.status = "Ativo";

        const { data: clienteData, error: clienteError } = await supabase
          .from("clientes")
          .insert([payload])
          .select()
          .maybeSingle();

        if (clienteData) {
          finalClienteId = clienteData.id;
        } else if (clienteError) {
          console.error("Erro ao criar cliente pelo parceiro:", clienteError);
          toast.error("Não foi possível salvar o cliente: " + clienteError.message);
          setLoading(false);
          return;
        }
      }

      // 2. Cria a venda pendente
      const { data: vendaData, error: vendaError } = await supabase
        .from("vendas")
        .insert([
          {
            tipo: "PDV",
            status_aprovacao: "Pendente",
            status: "Pendente",
            valor_total: totalComDesconto,
            desconto_percentual: clientForm.descontoPercentual,
            desconto_valor: valorDesconto,
            condicao_pagamento: clientForm.pagamento === "Dinheiro / Pix" ? "À vista" : clientForm.condicaoPagamento,
            vendedor_id: vendedorInfo?.id,
            cliente_id: finalClienteId,
          },
        ])
        .select()
        .single();

      if (vendaError) throw vendaError;

      // Insere os itens
      const itensToInsert = cart.map((i) => ({
        venda_id: vendaData.id,
        produto_id: i.id,
        quantidade: i.q,
        valor_unitario: i.u,
        subtotal: i.t,
      }));

      const { error: itensError } = await supabase.from("vendas_itens").insert(itensToInsert);
      if (itensError) throw itensError;

      // 3. Gera o DAV Oficial (Orçamento) na tabela VENDAS
      const { data: dav, error: davError } = await supabase
        .from("vendas")
        .insert([
          {
            tipo: "DAV",
            status: "Pendente",
            status_aprovacao: "Pendente",
            valor_total: totalComDesconto,
            desconto_percentual: clientForm.descontoPercentual,
            desconto_valor: valorDesconto,
            condicao_pagamento: clientForm.pagamento === "Dinheiro / Pix" ? "À vista" : clientForm.condicaoPagamento,
            vendedor_id: vendedorInfo?.id,
            cliente_id: finalClienteId,
          },
        ])
        .select()
        .single();

      if (!davError && dav) {
        setDavGeradoId(dav.id);
        setDavGeradoNumero(dav.numero_venda);

        // Salvar itens do DAV
        const davItensToInsert = cart.map((i) => ({
          venda_id: dav.id,
          produto_id: i.id,
          quantidade: i.q,
          valor_unitario: i.u,
          subtotal: i.t,
        }));
        await supabase.from("vendas_itens").insert(davItensToInsert);
      } else if (davError) {
        console.error("Erro ao gerar DAV:", davError);
        toast.success(
          "Aviso: O pedido foi enviado, mas o Orçamento (DAV) não pôde ser gerado: " +
            davError.message,
        );
      }

      // 4. Dispara a notificação para o dono
      await supabase.from("notificacoes").insert([
        {
          tipo: "venda",
          titulo: `Novo pedido pendente`,
          mensagem: `Um parceiro enviou um novo pedido (Cliente: ${clientForm.nome}) no valor de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalComDesconto)} para aprovação.`,
        },
      ]);

      setIsSuccessModalOpen(true);
    } catch (err: any) {
      toast.error("Erro ao enviar venda: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const closeSuccessModal = () => {
    setIsSuccessModalOpen(false);
    navigate({ to: "/parceiro/dashboard" });
  };

  const handleShareWhatsApp = () => {
    if (!davGeradoId) return;

    let msg = `*ORÇAMENTO - SENALANDIA 2 ERP VASOS*\n`;
    msg += `Nº do Orçamento: ${davGeradoNumero || davGeradoId.substring(0, 8).toUpperCase()}\n\n`;
    msg += `Olá ${clientForm.nome}, aqui está o seu orçamento detalhado!\n\n`;

    msg += `*ITENS DO ORÇAMENTO:*\n`;
    cart.forEach((item) => {
      msg += `• ${item.q}x ${item.p} - R$ ${Number(item.t).toFixed(2).replace(".", ",")}\n`;
    });

    msg += `\n*SUBTOTAL: R$ ${subtotal.toFixed(2).replace(".", ",")}*\n`;
    if (valorDesconto > 0) {
      msg += `*DESCONTO: R$ ${valorDesconto.toFixed(2).replace(".", ",")}*\n`;
    }
    msg += `*TOTAL GERAL: R$ ${totalComDesconto.toFixed(2).replace(".", ",")}*\n\n`;

    const linkPdf = `${window.location.origin}/orcamento/${davGeradoId}`;
    msg += `📄 *Acesse o orçamento completo em PDF aqui:*\n${linkPdf}`;

    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  if (!vendedorInfo)
    return <div className="text-center py-10">Verificando perfil de vendedor...</div>;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-2">
        <h1 className="text-2xl font-bold font-display text-slate-800">Nova Venda</h1>
        <p className="text-sm text-muted-foreground">Registre o pedido do seu cliente.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar produto…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-12 pl-10 rounded-xl bg-white shadow-sm border-0 ring-1 ring-slate-900/5"
        />
      </div>

      <div className="flex overflow-x-auto pb-2 gap-2 snap-x">
        {produtos
          .filter((p) => p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || (p.codigo && p.codigo.toLowerCase().includes(searchTerm.toLowerCase())))
          .map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              className="flex-shrink-0 snap-center w-28 bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-transform"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md bg-accent text-3xl">
                {p.imagem ? (
                  <img src={p.imagem} alt={p.nome} className="h-full w-full object-cover" />
                ) : (
                  <span className="opacity-50">{p.emoji || "🪴"}</span>
                )}
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight">
                  {p.nome}
                </p>
                <p className="text-[10px] font-bold text-brand mt-1">
                  R$ {Number(p.valor).toFixed(2)}
                </p>
              </div>
            </button>
          ))}
      </div>

      <Card className="shadow-sm border-0 ring-1 ring-slate-900/5 overflow-hidden">
        <div className="bg-slate-50 border-b p-3 flex justify-between items-center">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" /> Carrinho
          </h2>
          <span className="text-xs font-bold text-muted-foreground">{cart.length} itens</span>
        </div>
        <CardContent className="p-0">
          <div className="max-h-[40vh] overflow-y-auto divide-y">
            {cart.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Selecione produtos acima.
              </div>
            ) : (
              cart.map((i) => (
                <div key={i.id} className="flex items-center gap-3 p-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md bg-accent text-2xl">
                    {i.imagem ? (
                      <img src={i.imagem} alt={i.p} className="h-full w-full object-cover" />
                    ) : (
                      <span className="opacity-50">{i.emoji || "🪴"}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{i.p}</p>
                    <p className="text-xs text-brand font-bold">R$ {i.t.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1">
                    <button
                      onClick={() => updateQuantity(i.id, -1)}
                      className="h-6 w-6 grid place-items-center bg-white rounded shadow-sm text-lg leading-none font-medium"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={i.q || ""}
                      onChange={(e) => setQuantity(i.id, parseInt(e.target.value) || 1)}
                      className="w-8 text-center text-xs font-bold bg-transparent border-0 outline-none p-0 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => updateQuantity(i.id, 1)}
                      className="h-6 w-6 grid place-items-center bg-white rounded shadow-sm text-lg leading-none font-medium"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(i.id)}
                    className="p-1.5 text-destructive bg-destructive/10 rounded-md"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {cart.length > 0 && (
        <div className="sticky bottom-24 pt-2">
          <Button
            onClick={handleOpenClientModal}
            disabled={loading}
            className="w-full h-14 bg-gradient-brand text-primary-foreground text-lg font-bold shadow-lg shadow-brand/25 flex justify-between px-6"
          >
            <span>Enviar Pedido</span>
            <span className="flex flex-col text-right">
              {valorDesconto > 0 && <span className="text-xs line-through opacity-70">R$ {subtotal.toFixed(2).replace(".", ",")}</span>}
              <span>R$ {totalComDesconto.toFixed(2).replace(".", ",")}</span>
            </span>
          </Button>
        </div>
      )}

      {/* Modal de Sucesso */}
      <Dialog open={isSuccessModalOpen} onOpenChange={closeSuccessModal}>
        <DialogContent className="w-[90vw] sm:max-w-[425px] rounded-2xl text-center">
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <DialogTitle className="text-2xl">Pedido Enviado!</DialogTitle>
            <DialogDescription className="text-center text-base">
              A venda foi registrada com sucesso e está aguardando a aprovação da loja para liberar
              sua comissão.
            </DialogDescription>
          </div>
          <div className="pt-2 flex flex-col gap-3 w-full">
            {davGeradoId && (
              <Button
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white h-12 text-sm sm:text-base font-bold shadow-md"
                onClick={handleShareWhatsApp}
              >
                Enviar Orçamento no WhatsApp
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full border-slate-300 text-slate-800 hover:bg-slate-100 h-12 text-sm sm:text-base font-bold"
              onClick={closeSuccessModal}
            >
              Voltar ao Painel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal do Cliente */}
      <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl p-5 sm:p-6">
          <form onSubmit={submitOrder}>
            <DialogHeader>
              <DialogTitle>Finalizar Geração de Orçamento / Pedido</DialogTitle>
              <DialogDescription>
                Preencha os dados abaixo. Eles sairão no PDF oficial e serão enviados à loja.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-brand text-sm border-b pb-1">Dados do Cliente</h3>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Nome / Empresa *</label>
                  <Input
                    required
                    placeholder="Ex: João Silva ou Construtora X"
                    value={clientForm.nome}
                    onChange={(e) => setClientForm({ ...clientForm, nome: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">CPF / CNPJ</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Apenas números (CPF/CNPJ)"
                      value={clientForm.documento}
                      onChange={(e) => {
                        const val = e.target.value;
                        setClientForm({ ...clientForm, documento: val });
                        if (val.replace(/\D/g, "").length === 14) {
                          buscarCnpj(val);
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="px-3 shrink-0"
                      onClick={() => buscarCnpj(clientForm.documento)}
                      title="Buscar dados do CNPJ"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Telefone / WhatsApp</label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={clientForm.telefone}
                    onChange={(e) => setClientForm({ ...clientForm, telefone: formatPhone(e.target.value) })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">CEP</label>
                    <Input
                      placeholder="00000-000"
                      value={clientForm.cep}
                      onChange={(e) => setClientForm({ ...clientForm, cep: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Endereço (Rua)</label>
                    <Input
                      placeholder="Rua Exemplo"
                      value={clientForm.endereco}
                      onChange={(e) => setClientForm({ ...clientForm, endereco: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Número</label>
                    <Input
                      placeholder="123"
                      value={clientForm.numero}
                      onChange={(e) => setClientForm({ ...clientForm, numero: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Bairro</label>
                    <Input
                      placeholder="Centro"
                      value={clientForm.bairro}
                      onChange={(e) => setClientForm({ ...clientForm, bairro: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Cidade</label>
                    <Input
                      placeholder="Sua Cidade"
                      value={clientForm.cidade}
                      onChange={(e) => setClientForm({ ...clientForm, cidade: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Estado (UF)</label>
                    <Input
                      placeholder="SP"
                      value={clientForm.uf}
                      onChange={(e) => setClientForm({ ...clientForm, uf: e.target.value })}
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-2">
                <h3 className="font-semibold text-brand text-sm border-b pb-1">Condições</h3>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Forma de Pagamento</label>
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={clientForm.pagamento}
                    onChange={(e) => {
                      setClientForm({ 
                        ...clientForm, 
                        pagamento: e.target.value,
                        descontoPercentual: 0 // Reseta o desconto se mudar a forma
                      })
                    }}
                  >
                    <option>Dinheiro / Pix</option>
                    <option>Cartão de Crédito</option>
                    <option>Cartão de Débito</option>
                    <option>Boleto a Prazo</option>
                  </select>
                </div>
                {clientForm.pagamento === "Dinheiro / Pix" && (
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Desconto (%)</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={clientForm.descontoPercentual || ""}
                      onChange={(e) => setClientForm({ ...clientForm, descontoPercentual: Number(e.target.value) })}
                    />
                  </div>
                )}
                {clientForm.pagamento !== "Dinheiro / Pix" && (
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-brand">Condição de Pagamento *</label>
                    <Input
                      required
                      placeholder="Ex: 30/60/90, Para o dia 10..."
                      value={clientForm.condicaoPagamento}
                      onChange={(e) => setClientForm({ ...clientForm, condicaoPagamento: e.target.value })}
                    />
                  </div>
                )}
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Forma do Frete</label>
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={clientForm.frete}
                    onChange={(e) => setClientForm({ ...clientForm, frete: e.target.value })}
                  >
                    <option>Retirada</option>
                    <option>FOB (Por conta do cliente)</option>
                    <option>CIF (Por conta da loja)</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Observações</label>
                  <Input
                    placeholder="Anotações extras..."
                    value={clientForm.observacoes}
                    onChange={(e) => setClientForm({ ...clientForm, observacoes: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsClientModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-gradient-brand text-white">
                {loading ? "Gerando..." : "Gerar Pedido e Orçamento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
