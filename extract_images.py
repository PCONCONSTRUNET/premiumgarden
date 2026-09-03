"""
Versão 2 — extrai imagens buscando texto ao redor (esquerda, direita, acima, abaixo).
Focada nos produtos que ficaram sem foto.
"""

import pymupdf
import base64
import os

SUPABASE_URL = "https://yzvesbpnbewpmnpkomic.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6dmVzYnBuYmV3cG1ucGtvbWljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxODA1OTYsImV4cCI6MjEwMzc1NjU5Nn0.ogrdQJoEjOD82OOXH8PD47L86SLTCz7nglzZkgH2otQ"
PDF_PATH = r"C:\Users\Lucas\Desktop\Pedido n. 3276-2026 (GARDEN PREMIUM PRODUTOS JARDINAGEM LTDA ).pdf"

# Produtos que ainda faltam imagem
TARGETS = [
    "UREIA",
    "TERRA VEGETAL 25 KILOS",
    "TERRA GARDEN PREMIUM 2 KILOS",
    "SUPORTE CORAÇÃO 4",
    "SUPORTE CORAÇÃO 3",
    "SUPORTE CORAÇÃO 2",
    "SUPORTE CORAÇÃO 1",
    "SUPORTE A4",
    "SUPORTE A3",
    "SUPORTE A1",
    "ROSAS DESERTO & BROMELLIAS FARDO 10 UNIDADES",
    "PEDRA SEIXO 10 KILOS",
    "PEDRA SEIXO 1 KILOS",
    "PEDRA DE RIO AREIA 1KG",
    "HUMUS 20 KILOS",
    "ESTERCO CURRAL ORGANICO",
    "ESTERCO CURRAL ORGÂNICO",
    "ESTACA COCO 60/CM",
    "CORRENTE 74",
    "CORRENTE 64",
    "CORRENTE 54",
    "CORRENTE 44",
    "CORRENTAO 64",
    "CALCARIO 1/5 KILOS",
    "CALCÁRIO 1/5 KILOS",
    "04/14/08 FERTILIZANTES",
]

from supabase import create_client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def normalize(text):
    import unicodedata
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return text.upper().strip()

def get_nearby_text(page, img_rect, radius=200):
    """Pega todo texto ao redor da imagem (expanded bbox)."""
    expanded = pymupdf.Rect(
        img_rect.x0 - 10,
        img_rect.y0 - 10,
        img_rect.x1 + radius,   # texto à direita é o nome do produto
        img_rect.y1 + 50,
    )
    return page.get_text("text", clip=expanded).strip()

def score_match(nearby_text, product_name):
    """Pontuação de match entre texto próximo e nome do produto."""
    nearby_norm = normalize(nearby_text)
    prod_norm = normalize(product_name)
    words = [w for w in prod_norm.split() if len(w) > 2]
    if not words:
        return 0
    hits = sum(1 for w in words if w in nearby_norm)
    return hits / len(words)

def main():
    print("=" * 60)
    print("Extrator v2 — produtos sem imagem")
    print("=" * 60)

    # Busca produtos do banco
    resp = supabase.table("produtos").select("id,nome,imagem").execute()
    todos = resp.data
    # Filtra só os que faltam E estão na lista de targets
    sem_foto = [p for p in todos if not p.get("imagem")]
    print(f"\nProdutos sem foto no banco: {len(sem_foto)}")

    # Abre o PDF
    doc = pymupdf.open(PDF_PATH)
    print(f"Paginas no PDF: {len(doc)}\n")

    # Extrai todas as imagens com contexto expandido
    imagens = []
    for page_num, page in enumerate(doc):
        img_list = page.get_images(full=True)
        for img_info in img_list:
            xref = img_info[0]
            img_rects = page.get_image_rects(xref)
            if not img_rects:
                continue
            rect = img_rects[0]
            # Filtra: ignora imagens muito pequenas, muito largas (logo/banner)
            if rect.width < 40 or rect.height < 40:
                continue
            if rect.width > 400 or rect.height > 300:
                continue

            nearby = get_nearby_text(page, rect)

            try:
                base_img = doc.extract_image(xref)
                img_bytes = base_img["image"]
                ext = base_img["ext"]
                b64 = base64.b64encode(img_bytes).decode("utf-8")
                img_b64 = f"data:image/{ext};base64,{b64}"
                imagens.append({
                    "b64": img_b64,
                    "text": nearby,
                    "page": page_num + 1,
                    "rect": rect,
                })
            except Exception as e:
                print(f"  Erro xref={xref}: {e}")

    doc.close()
    print(f"Total de imagens extraidas: {len(imagens)}\n")

    # Para cada produto sem foto, acha a melhor imagem
    atualizados = 0
    usadas = set()

    for produto in sem_foto:
        best_score = 0
        best_img = None
        best_idx = -1

        for idx, img in enumerate(imagens):
            if idx in usadas:
                continue
            s = score_match(img["text"], produto["nome"])
            if s > best_score:
                best_score = s
                best_img = img
                best_idx = idx

        if best_img and best_score >= 0.5:
            print(f"  OK [{best_score:.2f}] '{produto['nome']}'")
            print(f"       texto: {best_img['text'][:80]!r}")
            try:
                supabase.table("produtos").update({"imagem": best_img["b64"]}).eq("id", produto["id"]).execute()
                usadas.add(best_idx)
                atualizados += 1
            except Exception as e:
                print(f"  ERRO ao atualizar {produto['nome']}: {e}")
        else:
            print(f"  SEM MATCH [{best_score:.2f}] '{produto['nome']}'")
            if best_img:
                print(f"       melhor texto: {best_img['text'][:60]!r}")

    print(f"\n{'='*60}")
    print(f"Produtos atualizados: {atualizados}/{len(sem_foto)}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
