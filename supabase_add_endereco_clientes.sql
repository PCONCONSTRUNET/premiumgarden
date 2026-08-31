-- =============================================
-- Adicionar colunas de endereço separadas na tabela clientes
-- Execute este script no Supabase SQL Editor
-- =============================================

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS numero TEXT,
  ADD COLUMN IF NOT EXISTS bairro TEXT,
  ADD COLUMN IF NOT EXISTS cep    TEXT;

-- Verificar resultado
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'clientes'
  AND column_name  IN ('endereco', 'numero', 'bairro', 'cidade', 'uf', 'cep')
ORDER BY column_name;
