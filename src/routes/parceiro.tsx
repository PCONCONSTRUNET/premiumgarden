import { useState } from "react";
import { createFileRoute, Outlet, redirect, Link, useRouterState, isRedirect, useNavigate } from "@tanstack/react-router";
import { supabaseParceiro as supabase } from "@/lib/supabase";
import { Home, Calculator, LogOut, PackageSearch, Wallet, Menu, X, ShoppingCart } from "lucide-react";
import premiumGardenLogo from "@/assets/premium-garden-logo.png";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/parceiro")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;

    // Se a rota for o login ou cadastro, não faz a checagem restritiva
    if (location.pathname === "/parceiro/login" || location.pathname === "/parceiro/cadastro")
      return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        // Salva a URL destino para redirecionar após o login
        sessionStorage.setItem("parceiro_redirect", window.location.href);
        throw redirect({ to: "/parceiro/login" });
      }

      // Bloqueia o acesso de Administradores (Dono) ao portal de Parceiros
      const envAdmin = import.meta.env.VITE_ADMIN_EMAIL || "";
      const adminEmail = `${envAdmin},senalandia2@gmail.com,premiumgarden@gmail.com`;
      const ADMIN_EMAILS = adminEmail
        .split(",")
        .map((e: string) => e.trim().toLowerCase())
        .filter(Boolean);

      if (session.user.email && ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
        // Desloga o admin do cliente do parceiro para limpar o storage fantasma
        await supabase.auth.signOut();
        throw redirect({ to: "/app/dashboard" });
      }

      // Verifica se o parceiro está aprovado no sistema
      const { data: vendedor } = await supabase
        .from("vendedores")
        .select("status")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!vendedor) {
        // Se o vendedor não existe na tabela, pode ser que o admin deletou ele (vendedores e auth.users).
        // Validamos diretamente no servidor do Supabase se o login (auth) ainda existe e é válido.
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          // O usuário foi deletado! Desloga do local storage e expulsa para o login.
          await supabase.auth.signOut();
          throw redirect({ to: "/parceiro/login" });
        }
      }

      // Não bloqueia o acesso globalmente aqui para não deslogar o usuário.
    } catch (err: any) {
      // Se o erro é um redirect do TanStack Router, repassa normalmente
      if (isRedirect(err)) throw err;
      // Qualquer outro erro de rede/DB: deixa passar sem bloquear o acesso
      console.warn("[parceiro beforeLoad] erro ao verificar status:", err);
    }
  },
  component: ParceiroLayout,
});

const PARCEIRO_NAV = [
  { to: "/parceiro/dashboard", label: "Início", icon: Home },
  { to: "/parceiro/vendas", label: "Vendas", icon: ShoppingCart },
  { to: "/parceiro/pdv", label: "Vender", icon: Calculator },
  { to: "/parceiro/catalogo", label: "Catálogo", icon: PackageSearch },
  { to: "/parceiro/pagamentos", label: "Financeiro", icon: Wallet },
];

function ParceiroLayout() {
  const { pathname } = useRouterState({ select: (s) => s.location });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Se for a tela de login ou cadastro, não mostra o layout principal
  if (pathname === "/parceiro/login" || pathname === "/parceiro/cadastro") {
    return <Outlet />;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/parceiro/login";
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 h-screen hidden md:flex w-64 shrink-0 flex-col bg-white border-r border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-center">
          <img src={premiumGardenLogo} alt="Premium Garden" className="h-14 w-auto object-contain" />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-2">
          {PARCEIRO_NAV.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                pathname === it.to
                  ? "bg-gradient-brand text-primary-foreground shadow-md"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              <it.icon className="h-5 w-5" />
              {it.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sair da Conta
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[80%] max-w-sm bg-white p-5 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <img src={premiumGardenLogo} alt="Premium Garden" className="h-10 w-auto object-contain" />
              <Button
                size="icon"
                variant="ghost"
                className="text-slate-500 hover:text-slate-900"
                onClick={() => setOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <nav className="flex-1 space-y-2">
              {PARCEIRO_NAV.map((it) => (
                <Link
                  key={it.to}
                  to={it.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-4 rounded-xl px-4 py-3.5 text-base font-semibold transition-all",
                    pathname === it.to
                      ? "bg-gradient-brand text-primary-foreground shadow-md"
                      : "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  <it.icon className="h-5 w-5" />
                  {it.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto pt-6 border-t border-slate-100">
               <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Sair da Conta
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md md:hidden">
          <Button size="icon" variant="ghost" className="-ml-2" onClick={() => setOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex-1 flex justify-center mr-6">
             <img src={premiumGardenLogo} alt="Premium Garden" className="h-8 w-auto object-contain" />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
