-- =====================================================================
-- Cria a tabela vendas_itens (itens de cada pedido de venda)
-- Execute este script no Supabase SQL Editor
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.vendas_itens (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id    UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  produto_id  UUID REFERENCES public.produtos(id) ON DELETE SET NULL,
  quantidade  NUMERIC(12,3) NOT NULL DEFAULT 1,
  valor_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal    NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_vendas_itens_venda_id  ON public.vendas_itens(venda_id);
CREATE INDEX IF NOT EXISTS idx_vendas_itens_produto_id ON public.vendas_itens(produto_id);

-- Row Level Security (acesso publico igual as demais tabelas do projeto)
ALTER TABLE public.vendas_itens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso publico vendas_itens" ON public.vendas_itens;
CREATE POLICY "Acesso publico vendas_itens"
  ON public.vendas_itens FOR ALL
  USING (true) WITH CHECK (true);

-- Recarrega o cache do PostgREST para a tabela aparecer imediatamente
NOTIFY pgrst, 'reload schema';
