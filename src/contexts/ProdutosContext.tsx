import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

interface ProdutosContextType {
  produtos: any[];
  loading: boolean;
  fetchProdutos: (forceRefresh?: boolean) => Promise<void>;
  updateProdutoLocal: (id: string, changes: Partial<any>) => void;
  removeProdutoLocal: (id: string) => void;
}

const ProdutosContext = createContext<ProdutosContextType | null>(null);

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

export function ProdutosProvider({ children }: { children: ReactNode }) {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const lastFetchedAt = useRef<number | null>(null);
  const isFetching = useRef(false);

  const fetchProdutos = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    const isCacheValid = lastFetchedAt.current && (now - lastFetchedAt.current) < CACHE_TTL_MS;

    // Se o cache é válido e não é forçado, não busca de novo
    if (isCacheValid && !forceRefresh) return;
    // Evita chamadas paralelas
    if (isFetching.current) return;

    isFetching.current = true;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setProdutos(data || []);
      lastFetchedAt.current = Date.now();
    } catch (err: any) {
      console.error("Erro ao buscar produtos:", err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  // Atualiza um produto no cache local sem refetch
  const updateProdutoLocal = useCallback((id: string, changes: Partial<any>) => {
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p));
  }, []);

  // Remove um produto do cache local sem refetch
  const removeProdutoLocal = useCallback((id: string) => {
    setProdutos(prev => prev.filter(p => p.id !== id));
  }, []);

  return (
    <ProdutosContext.Provider value={{ produtos, loading, fetchProdutos, updateProdutoLocal, removeProdutoLocal }}>
      {children}
    </ProdutosContext.Provider>
  );
}

export function useProdutos() {
  const ctx = useContext(ProdutosContext);
  if (!ctx) throw new Error("useProdutos must be used within ProdutosProvider");
  return ctx;
}
