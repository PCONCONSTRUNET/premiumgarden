import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { supabaseParceiro as supabase } from "@/lib/supabase";
import { ColorDock } from "@/components/color-dock";

export const Route = createFileRoute("/parceiro/catalogo")({
  head: () => ({ meta: [{ title: "Catálogo — Portal do Parceiro" }] }),
  component: ParceiroCatalogo,
});

function ParceiroCatalogo() {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  const fetchProdutos = async () => {
    try {
      const { data } = await supabase.from("produtos").select("*").eq("status", "Ativo").order("nome");
      if (data) setProdutos(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  const handlePedir = (produtoId: string) => {
    navigate({
      to: "/parceiro/pdv",
      search: { produto: produtoId } as any
    });
  };

  const filtrados = produtos.filter((p) => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase()) || (p.codigo && p.codigo.toLowerCase().includes(busca.toLowerCase()));
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-800">Catálogo de Produtos</h1>
        <p className="text-sm text-muted-foreground">Escolha os produtos e inicie um pedido rapidamente.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar produto por nome ou código…"
          className="h-12 pl-10 rounded-xl bg-white shadow-sm border-0 ring-1 ring-slate-900/5"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="space-y-8">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Carregando catálogo...</p>
        ) : filtrados.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum produto encontrado.</p>
        ) : (
          Array.from(new Set(filtrados.map(p => p.categoria || "Outros"))).map((cat) => {
            const produtosDaCategoria = filtrados.filter(p => (p.categoria || "Outros") === cat);
            return (
              <div key={cat} className="space-y-4">
                <h2 className="text-xl font-display font-bold text-slate-800 border-b pb-2">{cat}</h2>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                  {produtosDaCategoria.map((p, index) => (
                    <Card
                      key={p.id}
                      className="overflow-hidden shadow-sm hover:shadow-md transition-all border-0 ring-1 ring-slate-900/5 flex flex-col"
                    >
                      <div className={`relative aspect-square overflow-hidden bg-gradient-to-br ${getGradient(index)} grid place-items-center text-5xl`}>
                        {p.imagem ? (
                          <img src={p.imagem} alt={p.nome} className="w-full h-full object-cover" />
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
                        <p className="text-[10px] text-muted-foreground uppercase">{p.codigo || "S/ SKU"}</p>
                        <h3 className="font-semibold text-sm mt-0.5 line-clamp-2">{p.nome}</h3>
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
