import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, RotateCw } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabaseParceiro as supabase } from "@/lib/supabase";
import {
  getCachedProdutos,
  setCachedProdutos,
  isCacheStale,
  getSavedScroll,
  saveScroll,
  getSavedBusca,
  saveBusca,
} from "@/lib/parceiro-cache";

export const Route = createFileRoute("/parceiro/catalogo")({
  head: () => ({ meta: [{ title: "Catálogo — Portal do Parceiro" }] }),
  component: ParceiroCatalogo,
});

function ParceiroCatalogo() {
  const navigate = useNavigate();
  const cached = getCachedProdutos();
  const [produtos, setProdutos] = useState<any[]>(() => cached || []);
  const [loading, setLoading] = useState(() => !cached || cached.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busca, setBusca] = useState(() => getSavedBusca());
  const isMountedRef = useRef(true);

  const fetchProdutos = async (isBackground = false) => {
    if (!isBackground) {
      if (produtos.length === 0) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
    }
    try {
      let currentVendedorId = null;
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const { data: vData } = await supabase
          .from("vendedores")
          .select("id")
          .eq("user_id", session.user.id)
          .single();
        if (vData) currentVendedorId = vData.id;
      }

      const { data } = await supabase
        .from("produtos")
        .select("*")
        .eq("status", "Ativo")
        .order("nome");

      if (data && isMountedRef.current) {
        let finalProducts = [...data];
        if (currentVendedorId) {
          const { data: precos } = await supabase
            .from("vendedor_precos")
            .select("produto_id, valor_personalizado")
            .eq("vendedor_id", currentVendedorId);

          if (precos && precos.length > 0) {
            finalProducts = finalProducts.map((p) => {
              const custom = precos.find((c: any) => c.produto_id === p.id);
              if (custom && custom.valor_personalizado != null) {
                return { ...p, valor: custom.valor_personalizado };
              }
              return p;
            });
          }
        }
        setProdutos(finalProducts);
        setCachedProdutos(finalProducts);
      }
    } catch (err) {
      console.error("Erro ao carregar catálogo:", err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    // Se não há dados no cache ou o cache expirou, busca na nuvem
    if (!cached || cached.length === 0 || isCacheStale()) {
      fetchProdutos(cached && cached.length > 0);
    }

    // Salva a rolagem atual para não perder a posição ao navegar entre as abas
    let scrollTimeout: any = null;
    const handleScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        saveScroll(window.scrollY);
      }, 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Restaura a posição anterior da rolagem
    const savedY = getSavedScroll();
    if (savedY > 0) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedY, behavior: "instant" as any });
      });
    }

    return () => {
      isMountedRef.current = false;
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, []);

  const handleBuscaChange = (val: string) => {
    setBusca(val);
    saveBusca(val);
  };

  const handlePedir = (produtoId: string) => {
    // Salva scroll antes de ir ao PDV
    saveScroll(window.scrollY);
    navigate({
      to: "/parceiro/pdv",
      search: { produto: produtoId } as any,
    });
  };

  const filtrados = produtos.filter((p) => {
    const term = busca.toLowerCase();
    const matchBusca =
      p.nome.toLowerCase().includes(term) ||
      (p.codigo && p.codigo.toLowerCase().includes(term));
    return matchBusca;
  });

  const getGradient = (index: number) => {
    const gradients = [
      "from-emerald-100 to-green-200",
      "from-lime-100 to-emerald-200",
      "from-amber-100 to-orange-200",
      "from-green-100 to-teal-200",
      "from-pink-100 to-rose-200",
      "from-stone-100 to-stone-200",
      "from-slate-100 to-zinc-200",
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800">Catálogo de Produtos</h1>
          <p className="text-sm text-muted-foreground">Escolha os produtos e inicie um pedido rapidamente.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchProdutos(false)}
          disabled={isRefreshing || loading}
          className="text-xs flex items-center gap-1.5 h-9 rounded-lg border-slate-200 hover:bg-slate-100 text-slate-600 shrink-0"
          title="Atualizar produtos e preços"
        >
          <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
          <span className="hidden sm:inline">{isRefreshing ? "Atualizando..." : "Atualizar"}</span>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar produto por nome ou código…"
          className="h-12 pl-10 rounded-xl bg-white shadow-sm border-0 ring-1 ring-slate-900/5"
          value={busca}
          onChange={(e) => handleBuscaChange(e.target.value)}
        />
      </div>

      <div className="space-y-8">
        {loading ? (
          <div className="text-center text-muted-foreground py-12 flex flex-col items-center justify-center gap-2">
            <RotateCw className="h-6 w-6 animate-spin text-emerald-600" />
            <p>Carregando catálogo...</p>
          </div>
        ) : filtrados.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum produto encontrado.</p>
        ) : (
          Array.from(new Set(filtrados.map((p) => p.categoria || "Outros"))).map((cat) => {
            const produtosDaCategoria = filtrados.filter(
              (p) => (p.categoria || "Outros") === cat
            );
            return (
              <div key={cat} className="space-y-4">
                <h2 className="text-xl font-display font-bold text-slate-800 border-b pb-2">
                  {cat}
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                  {produtosDaCategoria.map((p, index) => (
                    <Card
                      key={p.id}
                      className="overflow-hidden shadow-sm hover:shadow-md transition-all border-0 ring-1 ring-slate-900/5 flex flex-col"
                    >
                      <div
                        className={`relative aspect-square overflow-hidden bg-gradient-to-br ${getGradient(
                          index
                        )} grid place-items-center text-5xl`}
                      >
                        {p.imagem ? (
                          <img
                            src={p.imagem}
                            alt={p.nome}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          p.emoji || "🪴"
                        )}
                        {p.estoque < 10 && (
                          <Badge className="absolute top-2 left-2 bg-warning/90 text-warning-foreground border-0 text-[10px]">
                            Pouco estoque
                          </Badge>
                        )}
                      </div>
                      <div className="p-3 flex flex-col flex-1">
                        <p className="text-[10px] text-muted-foreground uppercase">
                          {p.codigo || "S/ SKU"}
                        </p>
                        <h3 className="font-semibold text-sm mt-0.5 line-clamp-2">
                          {p.nome}
                        </h3>
                        <p className="text-brand font-bold text-lg mt-1 mb-2">
                          R$ {Number(p.valor).toFixed(2).replace(".", ",")}
                        </p>

                        <div className="mt-auto pt-2 grid gap-2">
                          <Button
                            onClick={() => handlePedir(p.id)}
                            className="w-full bg-gradient-brand hover:brightness-110 text-primary-foreground font-bold"
                            size="sm"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Pedir
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
