// Cache inteligente para produtos e dados do parceiro
// Evita recarregar a tela do catálogo do zero toda vez que o vendedor navega entre abas

let memoryCachedProdutos: any[] | null = null;
let lastFetchTimestamp = 0;
const CACHE_KEY = "pg_parceiro_catalogo_cache_v1";
const SCROLL_KEY = "pg_parceiro_catalogo_scroll_v1";
const BUSCA_KEY = "pg_parceiro_catalogo_busca_v1";

export function getCachedProdutos(): any[] | null {
  if (memoryCachedProdutos && memoryCachedProdutos.length > 0) {
    return memoryCachedProdutos;
  }
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryCachedProdutos = parsed;
          return parsed;
        }
      }
    } catch {}
  }
  return null;
}

export function setCachedProdutos(data: any[]) {
  memoryCachedProdutos = data;
  lastFetchTimestamp = Date.now();
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {}
  }
}

export function isCacheStale(maxAgeMs = 5 * 60 * 1000): boolean {
  if (!memoryCachedProdutos || memoryCachedProdutos.length === 0) return true;
  return Date.now() - lastFetchTimestamp > maxAgeMs;
}

export function getSavedScroll(): number {
  if (typeof window === "undefined") return 0;
  try {
    const val = sessionStorage.getItem(SCROLL_KEY);
    const num = val ? parseInt(val, 10) : 0;
    return isNaN(num) ? 0 : num;
  } catch {
    return 0;
  }
}

export function saveScroll(y: number) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SCROLL_KEY, String(Math.max(0, y)));
  } catch {}
}

export function getSavedBusca(): string {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem(BUSCA_KEY) || "";
  } catch {
    return "";
  }
}

export function saveBusca(busca: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(BUSCA_KEY, busca);
  } catch {}
}
