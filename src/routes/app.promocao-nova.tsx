import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export const Route = createFileRoute("/app/promocao-nova")({
  head: () => ({ meta: [{ title: "Nova Promoção — PREMIUM GARDEN" }] }),
  component: NovaPromocao,
});

function NovaPromocao() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nome: "",
    inicio: "",
    termino: "",
    buscaProduto: ""
  });

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      {/* Top Tabs */}
      <div className="bg-white border-b px-6 pt-4 flex gap-6 text-sm font-semibold text-muted-foreground uppercase tracking-wide overflow-x-auto">
        <Link to="/app/produtos" className="pb-3 flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors whitespace-nowrap text-muted-foreground">
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

      <div className="bg-white border-b px-8 py-5">
        <h1 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
          NOVA PROMOÇÃO
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Crie aqui uma ação promocional para incentivar a venda de produtos do seu catálogo.
        </p>
      </div>

      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        
        {/* Step 1 */}
        <div className={`bg-white rounded border ${step === 1 ? 'border-border/50 shadow-sm' : 'border-border/30 opacity-70'} overflow-hidden relative`}>
          <div className="absolute right-4 top-4 w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-xs font-medium text-slate-500">1</div>
          <div className="p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-6">CARACTERÍSTICAS</h2>
            
            <div className="space-y-6 max-w-xl">
              <div className="space-y-2">
                <Label className="text-xs font-normal text-slate-700">* Nome da promoção</Label>
                <Input 
                  placeholder="Informe o nome da promoção" 
                  className="border-slate-300 h-9"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  disabled={step !== 1}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-normal text-slate-700">* Início da exposição</Label>
                  <Input 
                    placeholder="___/___/___" 
                    className="border-slate-300 h-9"
                    value={formData.inicio}
                    onChange={(e) => setFormData({...formData, inicio: e.target.value})}
                    disabled={step !== 1}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-normal text-slate-700">* Término da exposição</Label>
                  <Input 
                    placeholder="___/___/___" 
                    className="border-slate-300 h-9"
                    value={formData.termino}
                    onChange={(e) => setFormData({...formData, termino: e.target.value})}
                    disabled={step !== 1}
                  />
                </div>
              </div>

              {step === 1 && (
                <div className="pt-2">
                  <Button 
                    className="bg-[#4b2781] hover:bg-[#4b2781]/90 h-9 text-xs font-medium px-6"
                    onClick={() => setStep(2)}
                  >
                    Ir para o próximo passo
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className={`bg-white rounded border ${step === 2 ? 'border-border/50 shadow-sm' : 'border-border/30 opacity-60 pointer-events-none'} overflow-hidden relative`}>
          <div className="absolute right-4 top-4 w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-xs font-medium text-slate-500">2</div>
          <div className="p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-6">PRODUTOS DA PROMOÇÃO</h2>
            
            <div className="flex items-center gap-4 mb-16">
              <Input 
                placeholder="Digite o código ou o nome do produto para adicionar à lista" 
                className="border-slate-300 bg-[#f8f9fa] flex-1 h-10"
                value={formData.buscaProduto}
                onChange={(e) => setFormData({...formData, buscaProduto: e.target.value})}
              />
              <Button variant="link" className="text-[#a896bd] hover:text-[#4b2781] font-normal text-sm p-0 h-auto">
                + Adicionar categoria
              </Button>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
              <Button 
                className={`${step === 2 ? 'bg-[#a896bd] hover:bg-[#4b2781]' : 'bg-[#a896bd]/50'} text-white h-9 px-6 font-medium text-xs`}
                disabled={step !== 2}
                onClick={() => navigate({ to: "/app/promocoes" })}
              >
                Salvar promoção
              </Button>
              <Button 
                variant="outline" 
                className="h-9 px-6 font-medium text-xs text-[#4b2781] border-slate-300"
                onClick={() => navigate({ to: "/app/promocoes" })}
                disabled={step !== 2}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
