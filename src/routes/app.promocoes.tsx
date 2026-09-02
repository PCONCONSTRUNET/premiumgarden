import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Plus, PackageOpen } from "lucide-react";

export const Route = createFileRoute("/app/promocoes")({
  head: () => ({ meta: [{ title: "Promoções — PREMIUM GARDEN" }] }),
  component: Promocoes,
});

function Promocoes() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      {/* Top Tabs */}
      <div className="bg-white border-b px-6 pt-4 flex gap-6 text-sm font-semibold text-muted-foreground uppercase tracking-wide overflow-x-auto">
        <Link to="/app/produtos" className="pb-3 flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors whitespace-nowrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
          Produtos
        </Link>
        <Link to="/app/promocoes" className="border-b-2 border-brand text-brand pb-3 flex items-center gap-2 cursor-pointer whitespace-nowrap">
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

      <div className="p-4 md:p-6 max-w-full mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-border/50 min-h-[60vh] flex flex-col">
          <div className="p-4 border-b">
            <Button 
              className="bg-[#4b2781] hover:bg-[#4b2781]/90 text-white font-medium px-4 h-9" 
              onClick={() => navigate({ to: "/app/promocao-nova" })}
            >
              <Plus className="mr-2 h-4 w-4" /> Nova promoção
            </Button>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
            <div className="mb-6 relative">
              {/* Box Illustration (simplified using lucide icon for now to match style) */}
              <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center border-2 border-dashed border-[#a896bd]/30">
                <PackageOpen className="w-12 h-12 text-[#a896bd]" strokeWidth={1} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhum produto em promoção</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Crie promoções e veja os produtos contidos nela de um jeito especial no catálogo do aplicativo e no e-commerce. Vamos começar?
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
