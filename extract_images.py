"""
Extrai imagens do PDF do pedido Garden Premium e atualiza os produtos no Supabase.
O PDF tem imagens de produtos embutidas - este script as extrai e faz upload como base64
diretamente na coluna 'imagem' da tabela 'produtos'.
"""

import fitz  # PyMuPDF
import base64
import os
import re
import sys
from supabase import create_client

# ── Config ───────────────────────────────────────────────────────────────────
PDF_PATH = r"C:\Users\Lucas\Desktop\Pedido n. 3276-2026 (GARDEN PREMIUM PRODUTOS JARDINAGEM LTDA ).pdf"
SUPABASE_URL = "https://yzvesbpnbewpmnpkomic.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6dmVzYnBuYmV3cG1ucGtvbWljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxODA1OTYsImV4cCI6MjEwMzc1NjU5Nn0.ogrdQJoEjOD82OOXH8PD47L86SLTCz7nglzZkgH2otQ"

# ── Mapeamento: nome-do-produto -> nomes-parciais para busca no banco ─────────
# O script vai extrair pares (texto_proximo, imagem) do PDF e tentar fazer match
# com os produtos existentes no banco.

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def img_to_base64_webp(pixmap):
    """Converte um PyMuPDF Pixmap para string base64 WebP."""
    # Salva como PNG em memória depois converte
    png_bytes = pixmap.tobytes("png")
    # Retorna como data URI base64 PNG (o frontend já aceita assim)
    b64 = base64.b64encode(png_bytes).decode("utf-8")
    return f"data:image/png;base64,{b64}"

def extract_images_with_context(pdf_path):
    """
    Extrai imagens do PDF junto com o texto mais próximo acima delas.
    Retorna lista de dicts: {image_b64, nearby_text, page}
    """
    doc = fitz.open(pdf_path)
    results = []

    for page_num, page in enumerate(doc):
        # Pega todos os blocos de texto e suas posições
        text_blocks = page.get_text("blocks")  # (x0, y0, x1, y1, text, block_no, block_type)
        text_blocks = [(b[0], b[1], b[2], b[3], b[4].strip()) for b in text_blocks if b[6] == 0 and b[4].strip()]

        # Pega todas as imagens da página
        img_list = page.get_images(full=True)

        for img_info in img_list:
            xref = img_info[0]
            # Pega a posição da imagem na página
            img_rects = page.get_image_rects(xref)
            if not img_rects:
                continue
            img_rect = img_rects[0]

            # Ignora imagens muito pequenas (logos, ícones)
            if img_rect.width < 50 or img_rect.height < 50:
                continue
            # Ignora imagens muito grandes (que provavelmente são backgrounds/logos)
            if img_rect.width > 400 or img_rect.height > 300:
                # Skip the very large background/logo images
                continue

            # Pega o texto mais próximo ACIMA ou AO LADO da imagem
            nearby_text = ""
            best_dist = float("inf")
            for (x0, y0, x1, y1, text) in text_blocks:
                # Texto que está acima ou na mesma linha da imagem
                if y1 <= img_rect.y1 + 20:  # texto está acima ou levemente abaixo do topo da imagem
                    dist = abs(img_rect.y0 - y1) + abs(img_rect.x0 - x0) * 0.1
                    if dist < best_dist:
                        best_dist = dist
                        nearby_text = text

            # Extrai a imagem como pixmap
            try:
                base_img = doc.extract_image(xref)
                img_bytes = base_img["image"]
                img_ext = base_img["ext"]
                b64 = base64.b64encode(img_bytes).decode("utf-8")
                img_b64 = f"data:image/{img_ext};base64,{b64}"

                results.append({
                    "image_b64": img_b64,
                    "nearby_text": nearby_text,
                    "page": page_num + 1,
                    "rect": img_rect,
                    "width": img_rect.width,
                    "height": img_rect.height,
                })
            except Exception as e:
                print(f"  ⚠️  Erro ao extrair imagem xref={xref}: {e}")

    doc.close()
    return results

def match_product(nearby_text, produtos_db):
    """
    Tenta encontrar o produto no banco de dados com base no texto próximo.
    """
    if not nearby_text:
        return None

    # Normaliza o texto
    nearby_lower = nearby_text.lower().strip()

    best_match = None
    best_score = 0

    for prod in produtos_db:
        nome = prod["nome"].lower()
        # Pontuação: quantas palavras do nome aparecem no texto próximo
        words = [w for w in nome.split() if len(w) > 2]
        if not words:
            continue
        matches = sum(1 for w in words if w in nearby_lower)
        score = matches / len(words)

        if score > best_score and score >= 0.4:
            best_score = score
            best_match = prod

    return best_match

def main():
    print("=" * 60)
    print("Extrator de Imagens do PDF — Garden Premium")
    print("=" * 60)

    # Busca todos os produtos sem imagem no banco
    print("\n📦 Buscando produtos no Supabase...")
    resp = supabase.table("produtos").select("id,nome,imagem").execute()
    produtos_db = resp.data
    sem_imagem = [p for p in produtos_db if not p.get("imagem")]
    print(f"   Total de produtos: {len(produtos_db)}")
    print(f"   Sem imagem:        {len(sem_imagem)}")

    # Extrai imagens do PDF
    print(f"\n📄 Abrindo PDF: {PDF_PATH}")
    imagens = extract_images_with_context(PDF_PATH)
    print(f"   Imagens encontradas: {len(imagens)}")

    if not imagens:
        print("\n❌ Nenhuma imagem encontrada no PDF.")
        return

    # Mostra o que foi encontrado
    print("\n🔍 Imagens extraídas (primeiras 10):")
    for i, img in enumerate(imagens[:10]):
        print(f"   [{i+1}] Pág {img['page']} | {img['width']:.0f}x{img['height']:.0f}px | Texto: {img['nearby_text'][:60]!r}")

    # Faz o matching e atualiza
    print("\n🔗 Associando imagens aos produtos...")
    atualizados = 0
    sem_match = 0

    # Evita atualizar o mesmo produto duas vezes
    atualizados_ids = set()

    for img in imagens:
        match = match_product(img["nearby_text"], sem_imagem)
        if match and match["id"] not in atualizados_ids:
            print(f"   ✅ '{match['nome']}' ← texto: {img['nearby_text'][:50]!r}")
            try:
                supabase.table("produtos").update({"imagem": img["image_b64"]}).eq("id", match["id"]).execute()
                atualizados_ids.add(match["id"])
                atualizados += 1
            except Exception as e:
                print(f"   ❌ Erro ao atualizar {match['nome']}: {e}")
        else:
            if not match:
                print(f"   ⚠️  Sem match | Pág {img['page']} | texto: {img['nearby_text'][:50]!r}")
                sem_match += 1

    print("\n" + "=" * 60)
    print(f"✅ Produtos atualizados com imagem: {atualizados}")
    print(f"⚠️  Imagens sem match:               {sem_match}")
    print("=" * 60)

if __name__ == "__main__":
    main()
