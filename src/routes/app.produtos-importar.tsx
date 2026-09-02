import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Upload, Download, Info, Check, RotateCcw } from "lucide-react";
import { useState, useRef } from "react";
import * as xlsx from "xlsx";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/app/produtos-importar")({
  head: () => ({ meta: [{ title: "Importar Produtos — PREMIUM GARDEN" }] }),
  component: ImportarProdutos,
});

function ImportarProdutos() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [finalidade, setFinalidade] = useState("atualizar");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const startImport = async () => {
    if (!file) return;
    setStep(2);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = xlsx.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = xlsx.utils.sheet_to_json<any>(worksheet);

      if (json.length === 0) {
        toast.error("A planilha está vazia.");
        setStep(1);
        return;
      }

      // Format payload based on spreadsheet columns (assuming standard Portuguese names)
      const payloads = json.map((row) => ({
        codigo: row["Código"]?.toString() || row["codigo"]?.toString() || "",
        nome: row["Nome"]?.toString() || row["nome"]?.toString() || "Sem nome",
        categoria: row["Categoria"]?.toString() || row["categoria"]?.toString() || "",
        estoque: parseInt(row["Estoque"] || row["estoque"] || "0", 10),
        valor: parseFloat(row["Preço"]?.toString().replace(",", ".") || row["preco"]?.toString() || "0"),
        status: "Ativo", // Default value
        cores: [] // Default value
      })).filter(p => p.codigo !== ""); // Only insert items with code

      if (payloads.length === 0) {
        toast.error("Nenhum produto com código válido encontrado.");
        setStep(1);
        return;
      }

      // Upsert into Supabase based on the 'codigo' column
      const { error } = await supabase.from("produtos").upsert(payloads, { onConflict: "codigo" });

      if (error) {
        throw error;
      }

      toast.success(`${payloads.length} produtos atribuídos com sucesso!`);
      navigate({ to: "/app/produtos" });
      
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao importar a planilha: " + err.message);
      setStep(1);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <div className="bg-white border-b px-8 py-5">
        <h1 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
          IMPORTAR PRODUTOS
        </h1>
      </div>

      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        
        {/* Step 1 */}
        <div className={`bg-white rounded border ${step === 1 ? 'border-border/50 shadow-sm' : 'border-border/30 opacity-70'} overflow-hidden relative`}>
          <div className={`absolute right-4 top-4 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium ${step > 1 ? 'bg-[#4b2781] text-white border-[#4b2781]' : 'border-[#4b2781] text-[#4b2781] bg-[#4b2781]/10'}`}>
            {step > 1 ? <Check className="w-3 h-3"/> : "1"}
          </div>
          <div className="p-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">PASSO 1</p>
            <h2 className="text-sm font-semibold text-slate-800 mb-6">Envie as informações dos produtos</h2>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <Label className="text-xs font-normal text-slate-700">Indique a finalidade desta importação</Label>
                <RadioGroup value="atribuir" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-[#4b2781] p-4 rounded flex items-start space-x-3 bg-white">
                    <RadioGroupItem value="atribuir" id="r1" className="mt-1 text-[#4b2781] border-[#4b2781]" />
                    <div className="space-y-1">
                      <Label htmlFor="r1" className="font-semibold text-xs cursor-pointer">Atribuir produtos da lista aos produtos</Label>
                      <p className="text-xs text-muted-foreground">Adiciona novos produtos ao sistema. Produtos antigos devem ser removidos manualmente, caso necessário.</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <Label className="text-xs font-normal text-slate-700">Envie a planilha modelo preenchida</Label>
                <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
                  
                  <div className="bg-[#f8f9fa] border rounded flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <p className="text-xs text-slate-700">Baixe e preencha a planilha modelo</p>
                    <Button variant="outline" className="text-[#4b2781] border-slate-300 h-9 font-medium text-xs">
                      <Download className="w-4 h-4 mr-2" /> Baixar a planilha modelo
                    </Button>
                    <a href="#" className="text-xs text-[#4b2781] hover:underline">Ver instruções de preenchimento</a>
                    <p className="text-[10px] text-muted-foreground">Última atualização do modelo em 05/09/2023</p>
                  </div>

                  <div 
                    className="bg-[#f8f9fa] border rounded border-dashed flex flex-col items-center justify-center p-8 text-center"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        setFile(e.dataTransfer.files[0]);
                      }
                    }}
                  >
                    {!file ? (
                      <>
                        <Upload className="w-5 h-5 text-[#4b2781] mb-2" />
                        <p className="text-sm font-semibold text-[#4b2781] mb-4">Arraste e solte a planilha modelo preenchida aqui</p>
                        <p className="text-xs text-muted-foreground mb-4">ou</p>
                        <Button className="bg-[#4b2781] hover:bg-[#4b2781]/90 h-9 text-xs font-medium" onClick={() => fileInputRef.current?.click()}>
                          Escolha um arquivo do computador
                        </Button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center">
                        <p className="text-xs text-muted-foreground mb-1">Arquivo selecionado:</p>
                        <p className="text-sm font-medium text-slate-800 flex items-center gap-2 mb-4">
                          📄 {file.name}
                        </p>
                        <Button className="bg-[#4b2781] hover:bg-[#4b2781]/90 h-9 text-xs font-medium" onClick={() => setFile(null)}>
                          <RotateCcw className="w-3.5 h-3.5 mr-2" /> Desfazer
                        </Button>
                      </div>
                    )}
                    <input type="file" className="hidden" ref={fileInputRef} accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
                  </div>

                </div>
              </div>

              <div className="bg-[#f8f9fa] border rounded p-4 flex gap-3 text-xs text-slate-600">
                <Info className="w-5 h-5 flex-shrink-0 text-slate-500" />
                <div>
                  <strong className="text-slate-800 block mb-1">Sobre produtos com variações (Cor, Tamanho, Voltagem, etc.)</strong>
                  Todas variações de produto informadas na planilha devem estar previamente cadastradas no sistema. Desejando cadastrar novas variações de produto <a href="#" className="text-[#4b2781] hover:underline">clique aqui</a>. Sempre que a quantidade de variações em um produto mudar, o preço destas variações (quando for específico) será zerado automaticamente pelo sistema. Não será possível especificar estoque, nem preços, nem código para cada variação por meio da planilha, apenas preços e código para o produto pai destas variações.
                </div>
              </div>

              {step === 1 && (
                <div className="pt-4 border-t flex justify-between items-center">
                  <Button 
                    className="bg-[#4b2781] hover:bg-[#4b2781]/90 h-10 text-xs font-medium px-8"
                    onClick={startImport}
                    disabled={!file}
                  >
                    Ir para o próximo passo
                  </Button>
                  <Button variant="link" className="text-red-500 hover:text-red-600 text-xs font-medium" onClick={() => navigate({ to: "/app/produtos" })}>
                    Cancelar importação
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 2 */}
        {step === 2 && (
          <div className="bg-white rounded border border-border/50 shadow-sm overflow-hidden relative">
            <div className="absolute right-4 top-4 w-6 h-6 rounded-full border border-[#4b2781] text-[#4b2781] bg-[#4b2781]/10 flex items-center justify-center text-xs font-medium">2</div>
            <div className="p-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">PASSO 2</p>
              <h2 className="text-sm font-semibold text-slate-800 mb-8">Lendo as informações da planilha</h2>
              
              <div className="space-y-4 mb-8">
                {/* Simulated Loading Icon */}
                <div className="w-8 h-8 rounded-full border-2 border-[#4b2781] border-t-transparent animate-spin mb-6"></div>
                
                <p className="text-sm text-slate-800 font-medium">Estamos lendo as informações preenchidas em sua planilha.</p>
                <p className="text-sm text-slate-800 font-medium">Em breve exibiremos a próxima etapa do processo de importação.</p>
                <p className="text-xs text-muted-foreground mt-4">Você pode sair desta tela se precisar fazer outras tarefas no sistema e retornar aqui depois.</p>
              </div>

              <div className="pt-4 border-t text-right">
                <Button variant="outline" className="text-red-500 border-slate-300 hover:bg-red-50 hover:text-red-600 text-xs font-medium h-9" onClick={() => navigate({ to: "/app/produtos" })}>
                  Cancelar importação
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
