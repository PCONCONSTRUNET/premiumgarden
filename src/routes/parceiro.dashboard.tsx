import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabaseParceiro as supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Wallet,
  Clock,
  CheckCircle2,
  TrendingUp,
  XCircle,
  FileText,
  Download,
  Loader2,
  Trash2,
  Ban,
} from "lucide-react";
import {
  WhatsAppIcon,
  shareOrderWhatsApp,
  downloadOrderPdf,
  getOrderNumber,
  isOrderDav,
} from "@/lib/order-pdf";
import { ParceiroPedidoModal } from "@/components/parceiro-pedido-modal";

export const Route = createFileRoute("/parceiro/dashboard")({
  head: () => ({ meta: [{ title: "Meu Painel — PREMIUM GARDEN" }] }),
  component: ParceiroDashboard,
});

function ParceiroDashboard() {
  const [vendedorId, setVendedorId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [status, setStatus] = useState("");
  const [tipoComissao, setTipoComissao] = useState<string>("porcentagem");
  const [valorComissao, setValorComissao] = useState<number>(0);
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

  const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<any>(null);
  const [isSaleDetailsOpen, setIsSaleDetailsOpen] = useState(false);

  const handleShare = async (venda: any, itens?: any[]) => {
    setSharingId(venda.id);
    try {
      await shareOrderWhatsApp(venda, itens);
    } finally {
      setSharingId(null);
    }
  };

  const handleDownloadPdf = async (venda: any, itens?: any[]) => {
    setDownloadingPdfId(venda.id);
    try {
      await downloadOrderPdf(venda, itens);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const openSaleDetails = (venda: any) => {
    setSelectedSaleForDetails(venda);
    setIsSaleDetailsOpen(true);
  };

  const handleDeleteSale = async (venda: any) => {
    const isDav = isOrderDav(venda);
    const label = isDav ? "orçamento" : "pedido";
    if (!confirm(`Tem certeza que deseja excluir este ${label}? Esta ação não pode ser desfeita.`))
      return;

    try {
      await supabase.from("vendas_itens").delete().eq("venda_id", venda.id);
      await supabase.from("dav_items").delete().eq("dav_id", venda.id);
      const { error } = await supabase.from("vendas").delete().eq("id", venda.id);
      if (error) throw error;
      setVendas((prev) => prev.filter((v) => v.id !== venda.id));
      if (selectedSaleForDetails?.id === venda.id) {
        setIsSaleDetailsOpen(false);
        setSelectedSaleForDetails(null);
      }
    } catch (err: any) {
      alert(`Erro ao excluir ${label}: ` + err.message);
    }
  };

  const handleCancelDav = async (venda: any) => {
    if (!confirm("Tem certeza que deseja cancelar este orçamento?")) return;

    try {
      const { error } = await supabase
        .from("vendas")
        .update({ status: "Cancelado", status_aprovacao: "Cancelado" })
        .eq("id", venda.id);
      if (error) throw error;

      setVendas((prev) =>
        prev.map((v) =>
          v.id === venda.id ? { ...v, status: "Cancelado", status_aprovacao: "Cancelado" } : v,
        ),
      );
      if (selectedSaleForDetails?.id === venda.id) {
        setSelectedSaleForDetails((prev: any) =>
          prev ? { ...prev, status: "Cancelado", status_aprovacao: "Cancelado" } : null,
        );
      }
    } catch (err: any) {
      alert("Erro ao cancelar orçamento: " + err.message);
    }
  };

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        // Tenta achar o vendedor atrelado a este usuário
        const { data: vData, error: fetchError } = await supabase
          .from("vendedores")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        if (vData) {
          setVendedorId(vData.id);
          setNome(vData.nome);
          setStatus(vData.status || "Ativo");

          // Busca as vendas dele ignorando os Orçamentos (DAV)
          const { data: vendasData } = await supabase
            .from("vendas")
            .select("*, cliente:clientes(*)")
            .eq("vendedor_id", vData.id)
            .neq("tipo", "DAV")
            .order("created_at", { ascending: false });

          if (vendasData) setVendas(vendasData);
        } else {
          // Se não achou (falha de sincronia ou RLS no insert inicial), recria usando os metadados da sessão
          const meta = session.user.user_metadata || {};
          const newNome = meta.nome || "Parceiro";
          const newTelefone = meta.telefone || "";

          const { data: newVData, error: insertError } = await supabase
            .from("vendedores")
            .insert([
              {
                user_id: session.user.id,
                nome: newNome,
                email: session.user.email,
                telefone: newTelefone,
                status: "Aguardando Aprovação",
                valor_comissao: 0,
              },
            ])
            .select()
            .single();

          if (newVData && !insertError) {
            setVendedorId(newVData.id);
            setNome(newVData.nome);
            setStatus(newVData.status);

            // Tenta notificar o dono caso não tenha ido na primeira vez
            await supabase.from("notificacoes").insert([
              {
                tipo: "parceiro",
                titulo: `Nova solicitação de parceria`,
                mensagem: `${newNome} (${session.user.email}) se cadastrou e está aguardando aprovação.`,
              },
            ]);
          } else if (insertError) {
            // Se falhou por conflito (ex: email já existe), significa que o registro já estava lá.
            // Isso acontece se o usuário foi deletado do auth mas não da tabela vendedores.
            // Vamos buscar pelo E-MAIL em vez do user_id, e atualizar o user_id!
            const { data: retryData } = await supabase
              .from("vendedores")
              .select("*")
              .eq("email", session.user.email)
              .maybeSingle();
            if (retryData) {
              await supabase
                .from("vendedores")
                .update({ user_id: session.user.id })
                .eq("id", retryData.id);
              setVendedorId(retryData.id);
              setNome(retryData.nome);
              setStatus(retryData.status || "Aguardando Aprovação");
              setTipoComissao(retryData.tipo_comissao || "porcentagem");
              setValorComissao(Number(retryData.valor_comissao || 0));
              setTipoComissao(retryData.tipo_comissao || "porcentagem");
              setValorComissao(Number(retryData.valor_comissao || 0));
            } else {
              // Se falhou mesmo assim, vamos preencher o formulário manual com os metadados
              setNome(newNome);
            }
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados do dashboard do parceiro:", err);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  const comissoesAReceber = vendas
    .filter((v) => v.status_aprovacao === "Aprovada" && v.status_pagamento_comissao !== "Paga")
    .reduce((acc, v) => acc + (Number(v.valor_comissao) || 0), 0);

  const comissoesPagas = vendas
    .filter((v) => v.status_pagamento_comissao === "Paga")
    .reduce((acc, v) => acc + (Number(v.valor_comissao) || 0), 0);

  const aguardandoAprovacao = vendas.filter((v) => v.status_aprovacao === "Pendente").length;
  const aprovadas = vendas.filter((v) => v.status_aprovacao === "Aprovada").length;

  if (loading)
    return <div className="text-center py-10 text-muted-foreground">Carregando painel...</div>;

  if (vendedorId && status === "Aguardando Aprovação") {
    return (
      <div className="flex justify-center py-10 px-4">
        <Card className="w-full max-w-md border-0 shadow-lg ring-1 ring-slate-900/5">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold font-display text-slate-800">Conta em Análise</h2>
            <p className="text-sm text-slate-600">
              Olá, <strong>{nome}</strong>! Seu cadastro foi recebido com sucesso. Nossa equipe está
              avaliando sua solicitação de parceria.
            </p>
            <p className="text-sm text-muted-foreground pt-4 border-t">
              Por favor, aguarde nosso contato ou retorne mais tarde para verificar se sua conta foi
              aprovada.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (vendedorId && status === "Rejeitado") {
    return (
      <div className="flex justify-center py-10 px-4">
        <Card className="w-full max-w-md border-0 shadow-lg ring-1 ring-slate-900/5">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold font-display text-slate-800">Solicitação Recusada</h2>
            <p className="text-sm text-slate-600">
              Olá, <strong>{nome}</strong>. Infelizmente sua solicitação de parceria não foi
              aprovada neste momento.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCompletarCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.from("vendedores").insert([
        {
          user_id: session.user.id,
          nome: nome,
          email: session.user.email,
          telefone: "", // Pede para ele atualizar depois se quiser
          status: "Aguardando Aprovação",
          valor_comissao: 0,
        },
      ]);

      if (error) throw error;

      // Recarrega a página para puxar os dados atualizados
      window.location.reload();
    } catch (err: any) {
      alert("Erro ao concluir o cadastro: " + err.message);
      setLoading(false);
    }
  };

  if (!vendedorId) {
    return (
      <div className="flex justify-center py-10 px-4">
        <Card className="w-full max-w-md border-0 shadow-lg ring-1 ring-slate-900/5">
          <CardContent className="p-6 text-center space-y-4">
            <h2 className="text-xl font-bold font-display">Cadastro Incompleto</h2>
            <p className="text-sm text-muted-foreground">
              Detectamos que seu usuário foi criado, mas seu perfil de vendedor não foi gerado
              devido a um erro anterior.
            </p>

            <form onSubmit={handleCompletarCadastro} className="space-y-4 pt-4 text-left">
              <div>
                <label className="text-sm font-medium">Confirme seu Nome Completo</label>
                <Input
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  className="mt-1 h-12"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 font-bold bg-gradient-brand"
                disabled={loading}
              >
                {loading ? "Concluindo..." : "Concluir Meu Cadastro"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "Aguardando Aprovação") {
    return (
      <div className="text-center py-16 px-4 space-y-4 animate-in fade-in slide-in-from-bottom-4">
        <div className="mx-auto w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-display text-slate-800">Conta em Análise</h2>
        <p className="text-slate-600">
          Olá, {nome.split(" ")[0]}! Sua conta foi criada com sucesso e no momento está aguardando a
          aprovação do administrador.
        </p>
        <p className="text-sm text-muted-foreground mt-4 border-t pt-4">
          Assim que seu acesso for liberado, você poderá acessar o caixa e registrar suas vendas por
          aqui.
        </p>
      </div>
    );
  }

  if (status === "Rejeitado") {
    return (
      <div className="text-center py-16 px-4 space-y-4 animate-in fade-in slide-in-from-bottom-4">
        <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-display text-slate-800">Conta Recusada</h2>
        <p className="text-slate-600">
          Olá, {nome.split(" ")[0]}. Infelizmente, sua solicitação de parceria não foi aprovada pelo
          administrador.
        </p>
        <p className="text-sm text-muted-foreground mt-4 border-t pt-4">
          Se achar que houve um engano, entre em contato diretamente com a loja.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-800">
          Olá, {nome.split(" ")[0]}! 👋
        </h1>
                <p className="text-sm text-muted-foreground mt-1">Aqui está o resumo das suas vendas.</p>
        <div className="inline-flex items-center gap-1.5 mt-2 bg-brand/10 text-brand px-3 py-1.5 rounded-lg border border-brand/20">
          <span className="text-xs font-semibold uppercase tracking-wider">Sua Comissão:</span>
          <span className="text-sm font-black">{tipoComissao === 'porcentagem' ? `${valorComissao}%` : `R$ ${valorComissao.toFixed(2).replace('.', ',')}`}</span>
        </div>
      </div>

      <div className="bg-brand/5 border border-brand/20 p-4 rounded-xl flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-brand">Seu Catálogo Digital</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Envie este link para seus clientes comprarem com você.
          </p>
        </div>
        <Button
          variant="outline"
          className="border-brand/30 text-brand hover:bg-brand/10 shrink-0"
          onClick={() => {
            const primeiroNome = nome.split(" ")[0].replace(/[^a-zA-ZÀ-ÿ]/g, "");
            const link = `${window.location.origin}/catalogo?v=${primeiroNome}`;
            navigator.clipboard.writeText(link);
            alert("Link do catálogo copiado!\n\n" + link);
          }}
        >
          Copiar Link
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="shadow-sm border-0 ring-1 ring-amber-500/20 bg-amber-50/50">
          <CardContent className="p-4 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2 opacity-90 text-amber-700">
              <Wallet className="h-5 w-5" />
              <h3 className="font-medium text-sm">A Receber</h3>
            </div>
            <p className="text-3xl font-extrabold font-display text-amber-600">
              <span className="text-lg font-bold mr-1 opacity-80">R$</span>
              {comissoesAReceber.toFixed(2).replace(".", ",")}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 ring-1 ring-emerald-500/20 bg-emerald-50/50">
          <CardContent className="p-4 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2 opacity-90 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              <h3 className="font-medium text-sm">Pagas</h3>
            </div>
            <p className="text-3xl font-extrabold font-display text-emerald-600">
              <span className="text-lg font-bold mr-1 opacity-80">R$</span>
              {comissoesPagas.toFixed(2).replace(".", ",")}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 ring-1 ring-slate-900/5">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 grid place-items-center mb-2">
              <Clock className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{aguardandoAprovacao}</p>
            <p className="text-xs text-muted-foreground font-medium">Aguardando</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 ring-1 ring-slate-900/5">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="h-10 w-10 rounded-full bg-success/20 text-success grid place-items-center mb-2">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{aprovadas}</p>
            <p className="text-xs text-muted-foreground font-medium">Aprovadas</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-brand" /> Últimas Vendas
        </h2>

        <div className="space-y-3">
          {vendas.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-4 bg-white rounded-xl shadow-sm border border-slate-100">
              Nenhuma venda registrada ainda.
            </p>
          ) : (
            vendas.slice(0, 10).map((v) => {
              const isDav = isOrderDav(v);
              const num = getOrderNumber(v);
              const isSharing = sharingId === v.id;

              return (
                <div
                  key={v.id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3 cursor-pointer active:scale-[0.99] transition-all hover:border-brand/30"
                  onClick={() => openSaleDetails(v)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-800 text-base">
                        R$ {Number(v.valor_total).toFixed(2).replace(".", ",")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="font-semibold text-slate-700">
                          {isDav ? "Orçamento" : "Pedido"} #{num}
                        </span>{" "}
                        • {new Date(v.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        {v.status_aprovacao === "Aprovada" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-success bg-success/10 px-2 py-1 rounded-md">
                            <CheckCircle2 className="h-3 w-3" /> Aprovada
                          </span>
                        ) : v.status_aprovacao === "Rejeitada" || v.status === "Cancelado" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded-md">
                            {v.status === "Cancelado" ? "Cancelado" : "Rejeitada"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-md">
                            <Clock className="h-3 w-3" /> Pendente
                          </span>
                        )}

                        {/* Ações Rápidas */}
                        {isDav && v.status !== "Cancelado" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelDav(v);
                            }}
                            className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded transition-colors"
                            title="Cancelar orçamento"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSale(v);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title={isDav ? "Excluir orçamento" : "Excluir pedido"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {v.status_aprovacao === "Aprovada" && v.valor_comissao > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          + R$ {Number(v.valor_comissao).toFixed(2)} comissão
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ações rápidas no card */}
                  <div className="border-t border-slate-100 pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSharing}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(v);
                      }}
                      className="flex-1 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-emerald-200/60"
                      title="Enviar arquivo PDF e resumo no WhatsApp"
                    >
                      {isSharing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                      ) : (
                        <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      disabled={downloadingPdfId === v.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPdf(v);
                      }}
                      className="flex-1 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200 disabled:opacity-50"
                      title="Baixar PDF"
                    >
                      {downloadingPdfId === v.id ? (
                        <Loader2 className="w-3.5 h-3.5 text-slate-500 shrink-0 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      )}
                      <span>{downloadingPdfId === v.id ? "Baixando..." : "Baixar PDF"}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <ParceiroPedidoModal
        open={isSaleDetailsOpen}
        onOpenChange={setIsSaleDetailsOpen}
        venda={selectedSaleForDetails}
        vendedor={{
          id: vendedorId || undefined,
          tipo_comissao: tipoComissao,
          valor_comissao: valorComissao,
          nome,
        }}
        onVendaUpdated={(updatedVenda) => {
          setVendas((prev) =>
            prev.map((v) => (v.id === updatedVenda.id ? { ...v, ...updatedVenda } : v)),
          );
          setSelectedSaleForDetails(updatedVenda);
        }}
        onVendaDeleted={(id) => {
          setVendas((prev) => prev.filter((v) => v.id !== id));
          setSelectedSaleForDetails(null);
        }}
      />
    </div>
  );
}
