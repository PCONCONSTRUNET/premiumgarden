import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Download, Info, Check, RotateCcw } from "lucide-react";
import { useState, useRef } from "react";
import * as xlsx from "xlsx";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/app/clientes-importar")({
  head: () => ({ meta: [{ title: "Importar Clientes — PREMIUM GARDEN" }] }),
  component: ImportarClientes,
});

function ImportarClientes() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadModelo = () => {
    const ws = xlsx.utils.aoa_to_sheet([
      [
        "Razão Social (obrigatório)",
        "Nome fantasia (opcional)",
        "CNPJ (opcional)",
        "Telefone (opcional)",
        "Endereço (opcional)",
        "Número (opcional)",
        "Bairro (opcional)",
        "Cidade (opcional)",
        "UF (opcional)",
        "CEP (opcional)"
      ],
      [
        "Empresa Exemplo LTDA",
        "Empresa Exemplo",
        "00.000.000/0001-00",
        "11999999999",
        "Rua das Flores",
        "123",
        "Centro",
        "São Paulo",
        "SP",
        "01000-000"
      ]
    ]);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, 
      { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 20 }, 
      { wch: 10 }, { wch: 15 }
    ];

    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Clientes");
    xlsx.writeFile(wb, "modelo_importacao_clientes.xlsx");
  };

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

      // Map columns
      const payloads = json.map((row) => ({
        nome: row["Razão Social (obrigatório)"]?.toString() || row["Razão Social"]?.toString() || row["nome"]?.toString() || "",
        nome_fantasia: row["Nome fantasia (opcional)"]?.toString() || row["Nome fantasia"]?.toString() || "",
        cpf_cnpj: row["CNPJ (opcional)"]?.toString() || row["CNPJ"]?.toString() || row["cpf_cnpj"]?.toString() || null,
        telefone: row["Telefone (opcional)"]?.toString() || row["Telefone"]?.toString() || null,
        endereco: row["Endereço (opcional)"]?.toString() || row["Endereço"]?.toString() || null,
        numero: row["Número (opcional)"]?.toString() || row["Número"]?.toString() || null,
        bairro: row["Bairro (opcional)"]?.toString() || row["Bairro"]?.toString() || null,
        cidade: row["Cidade (opcional)"]?.toString() || row["Cidade"]?.toString() || null,
        uf: row["UF (opcional)"]?.toString() || row["UF"]?.toString() || null,
        cep: row["CEP (opcional)"]?.toString() || row["CEP"]?.toString() || null,
        status: "Ativo"
      })).filter(p => p.nome !== ""); // Only insert items with a name

      if (payloads.length === 0) {
        toast.error("Nenhum cliente com Razão Social válida encontrado na planilha.");
        setStep(1);
        return;
      }

      // Bulk insert into Supabase
      const { error } = await supabase.from("clientes").insert(payloads);

      if (error) {
        throw error;
      }

      toast.success(`${payloads.length} clientes cadastrados com sucesso!`);
      navigate({ to: "/app/clientes" });
      
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao importar a planilha: " + err.message);
      setStep(1);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <div className="bg-white border-b px-8 py-5 flex items-center justify-between">
        <h1 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
          IMPORTAÇÃO DE CLIENTES
        </h1>
      </div>

      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        
        {/* Step 1 */}
        <div className={`bg-white rounded border ${step === 1 ? 'border-border/50 shadow-sm' : 'border-border/30 opacity-70'} overflow-hidden relative`}>
          <div className={`absolute right-4 top-4 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium ${step > 1 ? 'bg-[#4b2781] text-white border-[#4b2781]' : 'border-[#4b2781] text-[#4b2781] bg-[#4b2781]/10'}`}>
            {step > 1 ? <Check className="w-3 h-3"/> : "1"}
          </div>
          <div className="p-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">ETAPAS DA IMPORTAÇÃO</p>
            <h2 className="text-sm font-semibold text-slate-800 mb-6">Prepare o arquivo</h2>
            
            <div className="space-y-6">
              
              <div className="flex items-start gap-3 border-b pb-6">
                <div className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-xs font-medium text-slate-500 shrink-0 mt-0.5">1</div>
                <div>
                  <p className="text-sm text-slate-700 mb-2">Faça o download do modelo de importação de clientes;</p>
                  <Button variant="outline" className="text-[#4b2781] hover:text-[#4b2781] hover:bg-slate-50 font-medium h-9 border-slate-300" onClick={downloadModelo}>
                    <Download className="mr-2 h-4 w-4" /> Download do modelo de importação
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3 pb-2">
                <div className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-xs font-medium text-slate-500 shrink-0 mt-0.5">2</div>
                <div>
                  <p className="text-sm text-slate-700">
                    Insira os clientes que deseja importar na planilha <span className="text-red-500 font-medium">sem excluir nenhuma coluna</span> e salve em seu computador.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className={`bg-white rounded border ${step === 1 ? 'border-border/50 shadow-sm' : 'border-border/30 opacity-70'} overflow-hidden relative`}>
          <div className={`absolute right-4 top-4 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium ${step > 1 ? 'bg-[#4b2781] text-white border-[#4b2781]' : 'border-[#4b2781] text-[#4b2781] bg-[#4b2781]/10'}`}>
            {step > 1 ? <Check className="w-3 h-3"/> : "2"}
          </div>
          <div className="p-6">
            <h2 className="text-sm font-semibold text-slate-800 mb-6">Selecione a tabela preenchida</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-xs font-medium text-slate-500 shrink-0 mt-0.5">1</div>
                <div className="w-full">
                  <p className="text-sm text-slate-700 mb-2">Selecione o modelo preenchido com seus clientes.</p>
                  
                  <div className="flex flex-col gap-2">
                    <input type="file" className="hidden" ref={fileInputRef} accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
                    <div className="flex items-center gap-3">
                      <Button variant="outline" className="h-9 font-medium" onClick={() => fileInputRef.current?.click()}>
                        Escolher ficheiro
                      </Button>
                      <span className={`text-sm ${file ? 'text-slate-800' : 'text-red-500 font-medium'}`}>
                        {file ? file.name : "! Nenhum arquivo selecionado!"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {step === 1 && (
              <div className="mt-8 pt-6 border-t flex items-center gap-3">
                <Button 
                  className="bg-[#4b2781] hover:bg-[#3a1d63] text-white font-medium h-10 px-8"
                  onClick={startImport}
                  disabled={!file}
                >
                  Próxima etapa
                </Button>
                <Button variant="outline" className="h-10 px-6 font-medium" onClick={() => navigate({ to: "/app/clientes" })}>
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Step 3 */}
        {step === 2 && (
          <div className="bg-white rounded border border-[#4b2781]/30 shadow-sm overflow-hidden p-8 flex flex-col items-center justify-center text-center space-y-4">
            <RotateCcw className="h-8 w-8 text-[#4b2781] animate-spin" />
            <div>
              <h2 className="text-base font-semibold text-slate-800 mb-1">Processando a planilha...</h2>
              <p className="text-sm text-slate-600">Estamos lendo as informações e cadastrando seus clientes. Aguarde um momento.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
