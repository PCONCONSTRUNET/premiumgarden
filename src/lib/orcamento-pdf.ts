import { supabase } from '@/lib/supabase';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import premiumGardenLogo from "@/assets/premium-garden-logo.png";
import assinaturaOscar from "@/assets/assinatura-oscar.png";

export interface OrcamentoPdfData {
  id?: string;
  numero?: number | string | null;
  tipo?: string; // "DAV" | "VENDA" | "PDV"
  created_at?: string;
  // Cliente
  cliente_nome?: string | null;
  cliente_cnpj?: string | null;
  cliente_telefone?: string | null;
  cliente_endereco?: string | null;
  // Pagamento
  condicao_pagamento?: string | null;
  observacoes_pagamento?: string | null;
  observacoes?: string | null;
  // Vendedor / Emissor
  vendedor?: string | null;
  emissor_nome?: string | null;
  emissor_cnpj?: string | null;
  emissor_endereco?: string | null;
  emissor_telefone?: string | null;
  emissor_email?: string | null;
  emissor_whatsapp?: string | null;
  cidade_emissao?: string | null;
  // Financeiro
  subtotal?: number | null;
  desconto_percentual?: number | null;
  desconto_valor?: number | null;
  frete_valor?: number | null;
  valor_total?: number | null;
  total?: number | null;
  // Itens
  itens: Array<{
    codigo?: string | null;
    nome?: string | null;
    produto?: string | null;
    quantidade?: number | string | null;
    qtd?: number | string | null;
    valor_unitario?: number | string | null;
    subtotal?: number | string | null;
    total?: number | string | null;
    imagem?: string | null;
    marca?: string | null;
    unidade?: string | null;
  }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

/** Tenta extrair a cidade do endereço do emissor. Ex: "Sorocaba-SP" → "Sorocaba" */
function extractCity(endereco?: string | null): string {
  if (!endereco) return "Sorocaba";
  const match = endereco.match(/([A-Za-zÀ-ú\s]+)-[A-Z]{2}/);
  if (match) return match[1].trim();
  return "Sorocaba";
}

// ─── PDF Principal ─────────────────────────────────────────────────────────────

export async function createOrcamentoPdfDoc(data: OrcamentoPdfData): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PW = doc.internal.pageSize.getWidth();   // 210
  const PH = doc.internal.pageSize.getHeight();  // 297
  const M = 10;                                  // margem
  const CW = PW - M * 2;                         // 190

  // ── Pré-carregamento de imagens (logo + produtos) ──────────────────────────
  let logoBase64 = null;
  let assinaturaBase64 = null;
  try {
    logoBase64 = await toBase64(premiumGardenLogo);
    assinaturaBase64 = await toBase64(assinaturaOscar);
  } catch (err) {
    console.warn("Aviso: imagem não pôde ser carregada para PDF", err);
  }
  const productImages: (string | null)[] = await Promise.all(
    (data.itens || []).map((item) =>
      item.imagem ? toBase64(item.imagem).catch(() => null) : Promise.resolve(null)
    )
  );

  // ── Dados gerais ────────────────────────────────────────────────────────────
  const dataEmissao = data.created_at
    ? new Date(data.created_at).toLocaleDateString("pt-BR")
    : new Date().toLocaleDateString("pt-BR");
  const anoEmissao = data.created_at
    ? new Date(data.created_at).getFullYear()
    : new Date().getFullYear();

  const emissorNome = data.emissor_nome || "GARDEN PREMIUM LTDA";
  const emissorCnpj = data.emissor_cnpj || "46.595.008/0001-49";
  const emissorEmail = data.emissor_email || "oscarinobezerra71@gmail.com";
  const emissorWhatsapp = data.emissor_whatsapp || "+55 (15) 98105-4330";

  // Telefone: remove números internos antigos, usa fallback correto
  const fallbackPhone = "+55 (15) 99797-0059";
  const emissorTelefone = data.emissor_telefone
    ? data.emissor_telefone.replace(/99714-?1112|99733-?1112|997141112|997331112/g, fallbackPhone)
    : fallbackPhone;

  // Endereço do emissor (até 3 linhas)
  const emissorEndRaw = data.emissor_endereco || "Rua Octávio Borghi, 215\nJardim Bonsucesso, Sorocaba-SP\nCEP 18078-736";
  const emissorEndLines = emissorEndRaw.split(/\n|,\s*(?=[A-Z])/).slice(0, 4);

  const cidade = data.cidade_emissao || extractCity(data.emissor_endereco);

  let y = 8;

  // ══════════════════════════════════════════════════════════════════════════════
  // 1. CABEÇALHO
  // ══════════════════════════════════════════════════════════════════════════════

  // Logo (esquerda)
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", M, y, 40, 27);
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(22, 163, 74);
    doc.text("PREMIUM GARDEN", M, y + 14);
  }

  // Nome e dados da empresa (centro-esquerda)
  const infoX = M + 44;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(emissorNome, infoX, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  // Subtítulo / razão social completa (se o nome for curto, mostrar razão completa)
  doc.text("GARDEN PREMIUM PRODUTOS PARA JARDINAGEM LTDA", infoX, y + 10);
  doc.text(`CNPJ: ${emissorCnpj}`, infoX, y + 14.5);

  // Endereço (máx 3 linhas)
  emissorEndLines.slice(0, 3).forEach((line, i) => {
    doc.text(line.trim(), infoX, y + 19 + i * 4);
  });

  // Informações de contato (coluna direita)
  const contactX = 142;
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Email: ${emissorEmail}`, contactX, y + 12);
  doc.text(`Cel: ${emissorWhatsapp}`, contactX, y + 17);
  doc.text(`Tel: ${emissorTelefone}`, contactX, y + 22);

  // Caixa da data (topo direita)
  const dateBoxW = 28;
  const dateBoxX = PW - M - dateBoxW;
  doc.setDrawColor(180, 190, 200);
  doc.setLineWidth(0.3);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(dateBoxX, y, dateBoxW, 8, 1, 1, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(50, 60, 80);
  doc.text(`Data: ${dataEmissao}`, dateBoxX + 2, y + 5.3);

  y += 33;

  // Linha divisória
  doc.setDrawColor(210, 218, 228);
  doc.setLineWidth(0.4);
  doc.line(M, y, PW - M, y);
  y += 5;

  // ── Slogan ──────────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(80, 90, 100);
  doc.text("Tudo que se Planta colher ..", M, y);
  y += 7;

  // ══════════════════════════════════════════════════════════════════════════════
  // 2. BARRA DE TÍTULO DO PEDIDO
  // ══════════════════════════════════════════════════════════════════════════════

  const numDisplay = data.numero ? String(data.numero).padStart(4, "0") : "0001";
  const pedidoTitle = `Pedido ${numDisplay}-${anoEmissao}`;

  doc.setFillColor(15, 15, 15);
  doc.rect(M, y, CW, 11, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(pedidoTitle, M + 5, y + 7.5);

  y += 16;

  // ══════════════════════════════════════════════════════════════════════════════
  // 3. DADOS DO CLIENTE
  // ══════════════════════════════════════════════════════════════════════════════

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Cliente: ${data.cliente_nome || "Consumidor Final"}`, M, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(50, 60, 70);

  if (data.cliente_cnpj) {
    doc.text(`CNPJ: ${data.cliente_cnpj}`, M, y);
    y += 4;
  }

  if (data.cliente_endereco) {
    const endLines = data.cliente_endereco.split(/\n/).slice(0, 4);
    endLines.forEach((line) => {
      doc.text(line.trim(), M, y);
      y += 4;
    });
  }

  y += 6;

  // ══════════════════════════════════════════════════════════════════════════════
  // 4. SEÇÃO PRODUTOS
  // ══════════════════════════════════════════════════════════════════════════════

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Produtos", M, y);
  y += 2;
  doc.setDrawColor(200, 205, 215);
  doc.setLineWidth(0.5);
  doc.line(M, y, PW - M, y);
  y += 4;

  // Tabela de Produtos com imagens
  const IMG_COL_W = 22;

  const tableBody = (data.itens || []).map((item) => {
    const nome = item.nome || item.produto || "Produto";
    const marcaLine = item.marca ? `Marca : ${item.marca}` : "";
    const descCell = marcaLine ? `${nome}\n${marcaLine}` : nome;
    const unidade = item.unidade || "";
    const qtd = String(item.quantidade ?? item.qtd ?? 1);
    const unit = formatCurrency(item.valor_unitario);
    const tot = formatCurrency(item.subtotal ?? item.total);
    return ["", descCell, unidade, unit, qtd, tot];
  });

  autoTable(doc, {
    startY: y,
    head: [["", "Descrição", "Unidade", "Preço unitário", "Qtd.", "Preço"]],
    body: tableBody,
    theme: "plain",
    headStyles: {
      fillColor: [238, 240, 244],
      textColor: [90, 100, 115],
      lineWidth: { bottom: 0.3 },
      lineColor: [200, 205, 215],
      fontStyle: "normal",
      fontSize: 8,
      cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
      halign: "left",
      minCellHeight: 10,
    },
    styles: {
      fontSize: 8,
      cellPadding: { top: 3, left: 2, right: 2, bottom: 3 },
      lineWidth: { bottom: 0.2 },
      lineColor: [210, 215, 225],
      textColor: [35, 40, 50],
      valign: "middle",
      minCellHeight: 26,
    },
    columnStyles: {
      0: { cellWidth: IMG_COL_W, halign: "center" },
      1: { cellWidth: "auto", halign: "left" },
      2: { cellWidth: 15, halign: "center" },
      3: { cellWidth: 26, halign: "right" },
      4: { cellWidth: 13, halign: "center" },
      5: { cellWidth: 24, halign: "right", fontStyle: "bold" },
    },
    margin: { left: M, right: M },
    rowPageBreak: "avoid",
    didDrawCell: (hook) => {
      if (hook.section !== "body") return;
      // Imagem do produto na coluna 0
      if (hook.column.index === 0) {
        const imgData = productImages[hook.row.index];
        if (imgData) {
          const pad = 2;
          const iX = hook.cell.x + pad;
          const iY = hook.cell.y + pad;
          const iW = hook.cell.width - pad * 2;
          const iH = hook.cell.height - pad * 2;
          try {
            doc.addImage(imgData, "JPEG", iX, iY, iW, iH, undefined, "FAST");
          } catch {
            // Produto sem imagem válida — ignora silenciosamente
          }
        }
      }
    },
  });

  // @ts-ignore
  let finalY: number = (doc as any).lastAutoTable?.finalY ?? y + 40;
  finalY += 8;

  // ══════════════════════════════════════════════════════════════════════════════
  // 5. TOTAIS (alinhado à direita)
  // ══════════════════════════════════════════════════════════════════════════════

  // Calcula valores
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
  const descPct = Number(data.desconto_percentual ?? 0);
  const freteVal = Number(data.frete_valor ?? 0);

  let subtotal = dataSub > 0 ? dataSub : itemsSum > 0 ? itemsSum : 0;
  if (subtotal === 0 && totalGeral > 0) {
    subtotal = totalGeral + descVal - freteVal;
  }
  const displayTotal = totalGeral > 0 ? totalGeral : Math.max(0, subtotal - descVal + freteVal);

  const TOTAL_COL_W = 90;
  const totalX = PW - M - TOTAL_COL_W;
  const lineH = 5.5;
  let ty = finalY;

  // Verifica se precisa de nova página
  const estimatedTotalsHeight = 60;
  if (ty + estimatedTotalsHeight > PH - 20) {
    doc.addPage();
    ty = 16;
  }

  // Linha "Produtos"
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(60, 70, 80);
  doc.text("Produtos", totalX, ty);
  doc.text(formatCurrency(subtotal), PW - M, ty, { align: "right" });
  ty += lineH;

  // Linha "Subtotal" (bold)
  doc.setFont("helvetica", "bold");
  doc.text("Subtotal", totalX, ty);
  doc.text(formatCurrency(subtotal), PW - M, ty, { align: "right" });
  ty += lineH;

  // Desconto
  if (descVal > 0) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(220, 38, 38); // Vermelho
    const descLabel =
      descPct > 0 ? `Desconto sobre produtos (${descPct}%)` : "Desconto";
    doc.text(descLabel, totalX, ty);
    doc.text(`- ${formatCurrency(descVal)}`, PW - M, ty, { align: "right" });
    ty += lineH;
  }

  // Frete
  if (freteVal > 0) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 70, 80);
    doc.text("Frete", totalX, ty);
    doc.text(formatCurrency(freteVal), PW - M, ty, { align: "right" });
    ty += lineH;
  }

  ty += 2;

  // Barra Total (fundo preto)
  const totalBarH = 9;
  doc.setFillColor(15, 15, 15);
  doc.rect(totalX - 2, ty, TOTAL_COL_W + 2, totalBarH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("Total", totalX + 2, ty + 6);
  doc.text(formatCurrency(displayTotal), PW - M - 2, ty + 6, { align: "right" });

  ty += totalBarH + 10;

  // ══════════════════════════════════════════════════════════════════════════════
  // 6. SEÇÃO PAGAMENTO
  // ══════════════════════════════════════════════════════════════════════════════

  const PIX_PADRAO = "15981054330   ///   15997970059";
  const payMethod = data.condicao_pagamento || "PIX";
  const isPix = payMethod.toLowerCase().includes("pix");
  // Se for PIX e não tiver detalhe preenchido, usa a chave padrão da empresa
  const payDetail = data.observacoes_pagamento || (isPix ? PIX_PADRAO : "");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Pagamento", M, ty);
  ty += 2;
  doc.setDrawColor(200, 205, 215);
  doc.setLineWidth(0.5);
  doc.line(M, ty, PW - M, ty);
  ty += 6;

  const labelCol = M;
  const valueCol = M + 50;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 90, 105);
  doc.text("Meios de pagamento", labelCol, ty);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 35, 45);
  doc.text(payMethod, valueCol, ty);
  ty += 5.5;

  if (payDetail) {
    const payLabel = payMethod.toLowerCase().includes("pix") ? "Pix." : "Detalhes:";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 90, 105);
    doc.text(payLabel, labelCol, ty);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 35, 45);
    // quebra em várias linhas se necessário
    const payLines = doc.splitTextToSize(payDetail, CW - 50);
    doc.text(payLines, valueCol, ty);
    ty += Math.max(5.5, payLines.length * 4.5);
  }

  ty += 6;

  // ══════════════════════════════════════════════════════════════════════════════
  // 7. RODAPÉ — DEUS É FIEL + ASSINATURAS
  // ══════════════════════════════════════════════════════════════════════════════

  // Garante espaço mínimo para o rodapé
  const minFooterSpace = 38;
  const footerY = Math.max(ty, PH - minFooterSpace - 10);

  if (ty + minFooterSpace > PH - 5) {
    doc.addPage();
    ty = 20;
  } else {
    ty = footerY;
  }

  // "DEUS É FIEL" — centralizado, itálico
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(80, 90, 100);
  doc.text("DEUS É FIEL", PW / 2, ty, { align: "center" });
  ty += 5;

  // Cidade e data — alinhado à direita
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(50, 60, 75);
  doc.text(`${cidade}, ${dataEmissao}`, PW - M, ty, { align: "right" });
  ty += 10;

  // Linhas de assinatura (ambas no mesmo nível)
  const signW = 65;
  const leftSigX = M + 8;
  const rightSigX = PW - M - 8 - signW;

  doc.setDrawColor(130, 140, 155);
  doc.setLineWidth(0.4);
  doc.line(leftSigX, ty, leftSigX + signW, ty);
  doc.line(rightSigX, ty, rightSigX + signW, ty);

  // Assinatura do emissor (Oscar)
  if (assinaturaBase64) {
    const sigImgW = 35;
    const sigImgH = 10;
    const sX = leftSigX + signW / 2 - sigImgW / 2;
    const sY = ty - sigImgH - 1; // 1mm acima da linha
    doc.addImage(assinaturaBase64, "PNG", sX, sY, sigImgW, sigImgH);
  }
  ty += 4;

  // Texto assinatura esquerda (emissor)
  const leftCX = leftSigX + signW / 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(20, 25, 35);
  doc.text(emissorNome, leftCX, ty, { align: "center" });

  let leftTy = ty + 3.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(60, 70, 85);
  doc.text("GARDEN PREMIUM PRODUTOS", leftCX, leftTy, { align: "center" });
  leftTy += 3.5;
  doc.text("JARDINAGEM LTDA", leftCX, leftTy, { align: "center" });
  leftTy += 3.5;
  doc.text("Entrega 5 à 10 Dias", leftCX, leftTy, { align: "center" });

  // Texto assinatura direita (cliente)
  const rightCX = rightSigX + signW / 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(20, 25, 35);
  doc.text(data.cliente_nome || "CLIENTE", rightCX, ty, { align: "center" });

  if (data.cliente_cnpj) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(60, 70, 85);
    doc.text(`CNPJ ${data.cliente_cnpj}`, rightCX, ty + 3.5, { align: "center" });
  }

  return doc;
}

// ══════════════════════════════════════════════════════════════════════════════
// Funções públicas de compartilhamento / download
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Gera e compartilha o PDF via WhatsApp (mobile) ou faz download + abre WhatsApp Web (desktop).
 */
export async function shareOrcamentoPDF(data: OrcamentoPdfData): Promise<void> {
  const toastId = toast.loading("Gerando arquivo PDF...");
  try {
    const doc = await createOrcamentoPdfDoc(data);
    const numDisplay = data.numero
      ? String(data.numero)
      : data.id?.slice(0, 8).toUpperCase() || "0001";
    const fileName = `Pedido_${numDisplay}_Premium_Garden.pdf`;
    const pdfBlob = doc.output("blob");
    const file = new File([pdfBlob], fileName, { type: "application/pdf" });

    if (
      typeof navigator !== "undefined" &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      toast.dismiss(toastId);
      try {
        await navigator.share({
          files: [file],
          title: `Pedido #${numDisplay} - Premium Garden`,
          text: `Olá! Segue em anexo o arquivo PDF do Pedido #${numDisplay} da Premium Garden.`,
        });
        toast.success("PDF compartilhado!");
        return;
      } catch (err: any) {
        if (err.name === "AbortError") return;
      }
    }

    // Fallback: download + WhatsApp Web
    doc.save(fileName);
    toast.dismiss(toastId);
    toast.success("PDF baixado! Abrindo WhatsApp...");
    const whatsappText = `Olá! Segue em anexo o PDF do Pedido #${numDisplay} da Premium Garden.`;
    window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`, "_blank");
  } catch (error: any) {
    toast.dismiss(toastId);
    console.error("Erro ao gerar/compartilhar PDF:", error);
    toast.error("Erro ao gerar PDF: " + (error.message || "Tente novamente."));
  }
}

/**
 * Baixa o PDF diretamente para o dispositivo.
 */
export async function downloadOrcamentoPDF(data: OrcamentoPdfData): Promise<void> {
  const toastId = toast.loading("Preparando download do PDF...");
  try {
    const doc = await createOrcamentoPdfDoc(data);
    const numDisplay = data.numero
      ? String(data.numero)
      : data.id?.slice(0, 8).toUpperCase() || "0001";
    const fileName = `Pedido_${numDisplay}_Premium_Garden.pdf`;
    doc.save(fileName);
    toast.dismiss(toastId);
    toast.success("PDF baixado com sucesso!");
  } catch (error: any) {
    toast.dismiss(toastId);
    console.error("Erro ao baixar PDF:", error);
    toast.error("Erro ao baixar PDF: " + (error.message || "Tente novamente."));
  }
}

/** Imprime o PDF de Orçamento (abre em nova aba ou iframe) */
export async function printOrcamentoPDF(data: OrcamentoPdfData): Promise<void> {
  try {
    const doc = await createOrcamentoPdfDoc(data);
    doc.autoPrint();
    const pdfBlobUrl = doc.output("bloburl");
    
    const printWindow = window.open(pdfBlobUrl, "_blank");
    if (!printWindow) {
      toast.error("O navegador bloqueou a abertura da janela de impressão. Permita pop-ups para este site.");
    }
  } catch (err) {
    console.error("Erro ao imprimir PDF:", err);
    toast.error("Erro ao iniciar a impressão do PDF.");
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Conversores de dados da tabela vendas → OrcamentoPdfData
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Converte um registro da tabela vendas e seus itens para o formato OrcamentoPdfData.
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
      valor_unitario: unit > 0 ? unit : qtd > 0 && itSub > 0 ? itSub / qtd : 0,
      subtotal: itSub > 0 ? itSub : qtd * unit,
      total: itSub > 0 ? itSub : qtd * unit,
      // Campos enriquecidos — presentes quando a query inclui esses campos
      imagem: it.produtos?.imagem || it.imagem || null,
      marca: it.produtos?.marca || it.marca || null,
      unidade: it.produtos?.unidade || it.unidade || null,
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
 * Baixa diretamente o PDF de uma venda/orçamento, buscando os itens (com imagem) se necessário.
 */
export async function downloadVendaPdf(venda: any, itens?: any[]): Promise<void> {
  let finalItens = itens;
  if (!finalItens || finalItens.length === 0) {
    const { data } = await supabase
      .from("vendas_itens")
      .select("*, produtos(nome, codigo, imagem, marca, unidade)")
      .eq("venda_id", venda.id);
    finalItens = data || [];
  }
  const pdfData = vendaToPdfData(venda, finalItens);
  return downloadOrcamentoPDF(pdfData);
}

export async function printVendaPdf(venda: any, itens?: any[]): Promise<void> {
  let finalItens = itens;
  if (!finalItens || finalItens.length === 0) {
    const { data } = await supabase
      .from("vendas_itens")
      .select("*, produtos(nome, codigo, imagem, marca, unidade)")
      .eq("venda_id", venda.id);
    finalItens = data || [];
  }
  const pdfData = vendaToPdfData(venda, finalItens);
  return printOrcamentoPDF(pdfData);
}

/**
 * Compartilha o PDF de uma venda/orçamento no WhatsApp, buscando os itens (com imagem) se necessário.
 */
export async function shareVendaWhatsApp(venda: any, itens?: any[]): Promise<void> {
  let finalItens = itens;
  if (!finalItens || finalItens.length === 0) {
    const { data } = await supabase
      .from("vendas_itens")
      .select("*, produtos(nome, codigo, imagem, marca, unidade)")
      .eq("venda_id", venda.id);
    finalItens = data || [];
  }
  const pdfData = vendaToPdfData(venda, finalItens);
  return shareOrcamentoPDF(pdfData);
}
