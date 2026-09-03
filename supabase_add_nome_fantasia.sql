-- =============================================
-- Adicionar coluna nome_fantasia e recarregar cache
-- Execute este script no Supabase SQL Editor
-- =============================================

ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS nome_fantasia TEXT;

-- Força a atualização do cache da API (PostgREST)
NOTIFY pgrst, 'reload schema';
