import { supabase } from '@/lib/supabase';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import premiumGardenLogo from "@/assets/premium-garden-logo.png";

export interface OrcamentoPdfData {
  id?: string;
  numero?: number | string | null;
  tipo?: string; // "DAV" | "VENDA"
  created_at?: string;
  cliente_nome?: string | null;
  cliente_cnpj?: string | null;
  cliente_telefone?: string | null;
  cliente_endereco?: string | null;
  condicao_pagamento?: string | null;
  observacoes_pagamento?: string | null;
  observacoes?: string | null;
  vendedor?: string | null;
  emissor_nome?: string | null;
  emissor_cnpj?: string | null;
  emissor_endereco?: string | null;
  emissor_telefone?: string | null;
  subtotal?: number | null;
  desconto_percentual?: number | null;
  desconto_valor?: number | null;
  frete_valor?: number | null;
  valor_total?: number | null;
  total?: number | null;
  itens: Array<{
    codigo?: string | null;
    nome?: string | null;
    produto?: string | null;
    quantidade?: number | string | null;
    qtd?: number | string | null;
    valor_unitario?: number | string | null;
    subtotal?: number | string | null;
    total?: number | string | null;
  }>;
}

const formatCurrency = (val: number | string | null | undefined): string => {
  const num = Number(val) || 0;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const toBase64 = (url: string): Promise<string | null> =>
  fetch(url)
    .then((r) => r.blob())
    .then(
      (blob) =>
        new Promise<string | null>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        }),
    )
    .catch(() => null);

export async function createOrcamentoPdfDoc(data: OrcamentoPdfData): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  let y = 14;

  // 1. Logo & Cabeçalho da Empresa
  try {
    const logoData = await toBase64(premiumGardenLogo);
    if (logoData) {
      doc.addImage(logoData, "PNG", margin, y, 42, 14);
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(22, 163, 74);
      doc.text("PREMIUM GARDEN", margin, y + 8);
    }
  } catch {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(22, 163, 74);
    doc.text("PREMIUM GARDEN", margin, y + 8);
  }

  // Dados da Empresa Emissora
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(
    data.emissor_nome || "GARDEN PREMIUM PRODUTOS PARA JARDINAGEM LTDA",
    margin,
    y + 20,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const fallbackPhone = "(15) 98105-4330 / (15) 99797-0059";
  const displayPhone = data.emissor_telefone 
    ? data.emissor_telefone.replace(/99714-?1112|99733-?1112|997141112|997331112/g, fallbackPhone)
    : fallbackPhone;

  doc.text(
    `CNPJ: ${data.emissor_cnpj || "46.595.008/0001-49"}   Tel: ${displayPhone}`,
    margin,
    y + 24,
  );
  if (data.emissor_endereco) {
    doc.text(data.emissor_endereco, margin, y + 28);
  }

  // Bloco Direito: Título do Documento e Número
  const isVenda = data.tipo === "VENDA";
  const docTitle = isVenda ? "COMPROVANTE DE VENDA" : "ORÇAMENTO";
  const numDisplay = data.numero
    ? String(data.numero).padStart(4, "0")
    : data.id?.slice(0, 8).toUpperCase() || "0001";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(docTitle, pageWidth - margin, y + 6, { align: "right" });

  doc.setFontSize(10);
  doc.setTextColor(22, 163, 74);
  doc.text(`Nº ${numDisplay}`, pageWidth - margin, y + 12, { align: "right" });

  const dataEmissao = data.created_at
    ? new Date(data.created_at).toLocaleDateString("pt-BR")
    : new Date().toLocaleDateString("pt-BR");
  const horaEmissao = data.created_at
    ? new Date(data.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Emissão: ${dataEmissao} às ${horaEmissao}`, pageWidth - margin, y + 17, { align: "right" });

  if (data.vendedor) {
    doc.text(`Vendedor: ${data.vendedor}`, pageWidth - margin, y + 21, { align: "right" });
  }

  // Linha divisória do cabeçalho
  y += 33;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // 2. Caixas: Dados do Cliente e Condições Comerciais
  const boxW = (contentWidth - 4) / 2;
  const boxH = 28;

  // Caixa Cliente
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, boxW, boxH, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("DADOS DO CLIENTE", margin + 3, y + 5);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  const clienteNome = data.cliente_nome || "Consumidor";
  doc.text(clienteNome.length > 38 ? clienteNome.slice(0, 36) + "..." : clienteNome, margin + 3, y + 10);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  if (data.cliente_cnpj) {
    doc.text(`CPF/CNPJ: ${data.cliente_cnpj}`, margin + 3, y + 14.5);
  }
  if (data.cliente_telefone) {
    doc.text(`Telefone: ${data.cliente_telefone}`, margin + 3, y + 19);
  }
  if (data.cliente_endereco) {
    const endStr = data.cliente_endereco.length > 44
      ? data.cliente_endereco.slice(0, 42) + "..."
      : data.cliente_endereco;
    doc.text(`End: ${endStr}`, margin + 3, y + 23.5);
  }

  // Caixa Condições
  const boxX2 = margin + boxW + 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(boxX2, y, boxW, boxH, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("CONDIÇÕES COMERCIAIS", boxX2 + 3, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`Pagamento: ${data.condicao_pagamento || "À vista"}`, boxX2 + 3, y + 10);

  if (data.observacoes_pagamento) {
    const obsStr = data.observacoes_pagamento.length > 40
      ? data.observacoes_pagamento.slice(0, 38) + "..."
      : data.observacoes_pagamento;
    doc.setTextColor(71, 85, 105);
    doc.text(`Obs. Pagamento: ${obsStr}`, boxX2 + 3, y + 15);
  }

  y += boxH + 4;

  // 3. Tabela de Produtos (autoTable)
  const tableRows = (data.itens || []).map((item, idx) => {
    const cod = item.codigo || "—";
    const nome = item.nome || item.produto || "Produto";
    const qtd = String(item.quantidade ?? item.qtd ?? 1);
    const unit = formatCurrency(item.valor_unitario);
    const tot = formatCurrency(item.subtotal ?? item.total);
    return [String(idx + 1), cod, nome, qtd, unit, tot];
  });

  autoTable(doc, {
    startY: y,
    head: [["#", "Cód.", "Descrição do Produto", "Qtd", "Vlr. Unitário", "Total"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: [15, 23, 42], // Slate 900
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "left",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 8 },
      1: { halign: "center", cellWidth: 16 },
      2: { halign: "left" },
      3: { halign: "center", cellWidth: 14 },
      4: { halign: "right", cellWidth: 26 },
      5: { halign: "right", cellWidth: 26, fontStyle: "bold" },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
  });

  // 4. Totais e Observações
  // @ts-ignore
  let finalY = (doc as any).lastAutoTable?.finalY || y + 40;

  // Quebra de página se estiver muito no final
  if (finalY > pageHeight - 50) {
    doc.addPage();
    finalY = 20;
  } else {
    finalY += 4;
  }

  // Calcula a soma real dos itens para garantir subtotal exato e evitar 0,00
  const itemsSum = (data.itens || []).reduce((acc, it) => {
    const itSub = Number(it.subtotal ?? it.total ?? 0);
    if (itSub > 0) return acc + itSub;
    const qtd = Number(it.quantidade ?? it.qtd ?? 1);
    const unit = Number(it.valor_unitario ?? 0);
    return acc + qtd * unit;
  }, 0);

  const totalGeral = Number(data.total ?? data.valor_total ?? 0);
  const dataSub = Number(data.subtotal || 0);
  const descVal = Number(data.desconto_valor ?? 0);
  const freteVal = Number(data.frete_valor ?? 0);

  let subtotal = dataSub > 0 ? dataSub : itemsSum > 0 ? itemsSum : 0;
  if (subtotal === 0 && totalGeral > 0) {
    subtotal = totalGeral + descVal - freteVal;
  }

  // Bloco de Totais à Direita
  const totalBoxW = 75;
  const totalBoxX = pageWidth - margin - totalBoxW;
  const totalBoxH = 26;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(totalBoxX, finalY, totalBoxW, totalBoxH, 2, 2, "FD");

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Subtotal:", totalBoxX + 4, finalY + 6);
  doc.text(formatCurrency(subtotal), pageWidth - margin - 4, finalY + 6, { align: "right" });

  if (descVal > 0) {
    doc.setTextColor(220, 38, 38);
    doc.text(`Desconto (${data.desconto_percentual || 0}%):`, totalBoxX + 4, finalY + 11);
    doc.text(`- ${formatCurrency(descVal)}`, pageWidth - margin - 4, finalY + 11, { align: "right" });
  }

  if (freteVal > 0) {
    doc.setTextColor(71, 85, 105);
    doc.text("Frete:", totalBoxX + 4, finalY + 16);
    doc.text(formatCurrency(freteVal), pageWidth - margin - 4, finalY + 16, { align: "right" });
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(totalBoxX + 2, finalY + totalBoxH - 8, pageWidth - margin - 2, finalY + totalBoxH - 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("TOTAL:", totalBoxX + 4, finalY + totalBoxH - 2.5);
  doc.setTextColor(22, 163, 74);
  doc.text(formatCurrency(totalGeral), pageWidth - margin - 4, finalY + totalBoxH - 2.5, { align: "right" });

  // Bloco de Observações à Esquerda
  if (data.observacoes) {
    const obsW = totalBoxX - margin - 4;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, finalY, obsW, totalBoxH, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("OBSERVAÇÕES ADICIONAIS", margin + 3, finalY + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const splitObs = doc.splitTextToSize(data.observacoes, obsW - 6);
    doc.text(splitObs.slice(0, 4), margin + 3, finalY + 9.5);
  }

  // 5. Linhas de Assinatura no Rodapé
  const signY = Math.max(finalY + totalBoxH + 16, pageHeight - 25);
  const signWidth = 65;

  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 10, signY, margin + 10 + signWidth, signY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Assinatura do Vendedor", margin + 10 + signWidth / 2, signY + 4, { align: "center" });

  const sign2X = pageWidth - margin - signWidth - 10;
  doc.line(sign2X, signY, sign2X + signWidth, signY);
  doc.text("Assinatura do Cliente", sign2X + signWidth / 2, signY + 4, { align: "center" });

  // Mensagem legal
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Documento Auxiliar de Venda (DAV) - Não possui valor fiscal.",
    pageWidth / 2,
    pageHeight - 6,
    { align: "center" },
  );

  return doc;
}

/**
 * Gera e compartilha o PDF do orçamento diretamente via WhatsApp no modo arquivo/documento.
 * Se o navegador suportar navigator.share com arquivos (celulares Android/iOS), abre o WhatsApp
 * com o PDF já anexado em modo documento.
 * Se for computador/desktop sem suporte a Web Share com arquivos, faz o download automático do PDF
 * e abre o WhatsApp Web para o usuário anexar diretamente.
 */
export async function shareOrcamentoPDF(data: OrcamentoPdfData): Promise<void> {
  const toastId = toast.loading("Gerando arquivo PDF do orçamento...");
  try {
    const doc = await createOrcamentoPdfDoc(data);
    const numDisplay = data.numero
      ? String(data.numero).padStart(4, "0")
      : data.id?.slice(0, 8).toUpperCase() || "0001";
    const fileName = `Orcamento_${numDisplay}_Premium_Garden.pdf`;

    const pdfBlob = doc.output("blob");
    const file = new File([pdfBlob], fileName, { type: "application/pdf" });

    // Verifica se o navegador suporta compartilhamento nativo de arquivos (Android/iOS/Chrome mobile)
    if (
      typeof navigator !== "undefined" &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      toast.dismiss(toastId);
      try {
        await navigator.share({
          files: [file],
          title: `Orçamento #${numDisplay} - Premium Garden`,
          text: `Olá! Segue em anexo o arquivo em PDF do Orçamento #${numDisplay} da Premium Garden.`,
        });
        toast.success("Orçamento compartilhado!");
        return;
      } catch (err: any) {
        if (err.name === "AbortError") {
          // Usuário apenas cancelou a seleção do app
          return;
        }
        // Se der outro erro no share, faz fallback para download
      }
    }

    // Fallback: Computador ou navegador sem Web Share de arquivos
    doc.save(fileName);
    toast.dismiss(toastId);
    toast.success("PDF baixado! Abrindo WhatsApp...");

    const whatsappText = `Olá! Segue em anexo o arquivo PDF do Orçamento #${numDisplay} da Premium Garden.`;
    window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`, "_blank");
  } catch (error: any) {
    toast.dismiss(toastId);
    console.error("Erro ao gerar/compartilhar PDF:", error);
    toast.error("Erro ao gerar PDF: " + (error.message || "Tente novamente."));
  }
}

/**
 * Baixa o PDF do orçamento diretamente para o dispositivo.
 */
export async function downloadOrcamentoPDF(data: OrcamentoPdfData): Promise<void> {
  const toastId = toast.loading("Preparando download do PDF...");
  try {
    const doc = await createOrcamentoPdfDoc(data);
    const numDisplay = data.numero
      ? String(data.numero).padStart(4, "0")
      : data.id?.slice(0, 8).toUpperCase() || "0001";
    const fileName = `Orcamento_${numDisplay}_Premium_Garden.pdf`;
    doc.save(fileName);
    toast.dismiss(toastId);
    toast.success("PDF baixado com sucesso!");
  } catch (error: any) {
    toast.dismiss(toastId);
    console.error("Erro ao baixar PDF:", error);
    toast.error("Erro ao baixar PDF: " + (error.message || "Tente novamente."));
  }
}


/**
 * Converte um registro da tabela vendas e seus itens para o formato OrcamentoPdfData
 */
export function vendaToPdfData(venda: any, itens: any[] = []): OrcamentoPdfData {
  const clienteNome =
    venda.clientes?.nome || venda.cliente?.nome || venda.cliente_nome || "Consumidor";
  const clienteCnpj =
    venda.clientes?.cpf_cnpj || venda.cliente?.cpf_cnpj || venda.cliente_cnpj || null;
  const clienteTel =
    venda.clientes?.telefone || venda.cliente?.telefone || venda.cliente_telefone || null;

  const rawItens = itens && itens.length > 0 ? itens : (venda.vendas_itens || venda.itens || []);
  const mappedItens = rawItens.map((it: any) => {
    const qtd = Number(it.quantidade ?? it.qtd ?? 1);
    const unit = Number(it.valor_unitario ?? 0);
    const itSub = Number(it.subtotal ?? it.total ?? 0);
    return {
      codigo: it.produtos?.codigo || it.produto?.codigo || it.codigo || "—",
      nome: it.produtos?.nome || it.produto?.nome || it.nome || it.produto_nome || "Produto",
      quantidade: qtd,
      valor_unitario: unit > 0 ? unit : (qtd > 0 && itSub > 0 ? itSub / qtd : 0),
      subtotal: itSub > 0 ? itSub : qtd * unit,
      total: itSub > 0 ? itSub : qtd * unit,
    };
  });

  const sumItens = mappedItens.reduce((acc: number, it: any) => acc + Number(it.subtotal || 0), 0);
  const rawSub = Number(venda.subtotal || 0);
  const orderTotal = Number(venda.valor_total ?? venda.total ?? 0);
  const descVal = Number(venda.desconto_valor || 0);
  const freteVal = Number(venda.frete_valor || 0);

  let subtotal = rawSub > 0 ? rawSub : sumItens > 0 ? sumItens : 0;
  if (subtotal === 0 && orderTotal > 0) {
    subtotal = orderTotal + descVal - freteVal;
  }

  return {
    id: venda.id,
    numero: venda.numero ?? venda.numero_venda ?? null,
    tipo: venda.tipo || "VENDA",
    created_at: venda.created_at,
    cliente_nome: clienteNome,
    cliente_cnpj: clienteCnpj,
    cliente_telefone: clienteTel,
    cliente_endereco: venda.cliente_endereco || null,
    condicao_pagamento: venda.condicao_pagamento || null,
    observacoes_pagamento: venda.observacoes_pagamento || null,
    observacoes: venda.observacoes || null,
    vendedor: venda.vendedor?.nome || venda.vendedores?.nome || venda.vendedor_nome || null,
    subtotal: subtotal,
    desconto_percentual: Number(venda.desconto_percentual || 0),
    desconto_valor: descVal,
    frete_valor: freteVal,
    valor_total: orderTotal > 0 ? orderTotal : Math.max(0, subtotal - descVal + freteVal),
    total: orderTotal > 0 ? orderTotal : Math.max(0, subtotal - descVal + freteVal),
    itens: mappedItens,
  };
}

/**
 * Baixa diretamente o PDF de uma venda/orçamento buscando os itens se necessário
 */
export async function downloadVendaPdf(venda: any, itens?: any[]): Promise<void> {
  let finalItens = itens;
  if (!finalItens || finalItens.length === 0) {
    const { data } = await supabase
      .from("vendas_itens")
      .select("*, produtos(nome, codigo)")
      .eq("venda_id", venda.id);
    finalItens = data || [];
  }
  const pdfData = vendaToPdfData(venda, finalItens);
  return downloadOrcamentoPDF(pdfData);
}

/**
 * Compartilha o PDF de uma venda/orçamento direto no WhatsApp buscando os itens se necessário
 */
export async function shareVendaWhatsApp(venda: any, itens?: any[]): Promise<void> {
  let finalItens = itens;
  if (!finalItens || finalItens.length === 0) {
    const { data } = await supabase
      .from("vendas_itens")
      .select("*, produtos(nome, codigo)")
      .eq("venda_id", venda.id);
    finalItens = data || [];
  }
  const pdfData = vendaToPdfData(venda, finalItens);
  return shareOrcamentoPDF(pdfData);
}
