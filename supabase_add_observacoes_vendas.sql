-- =======================================================
-- Adicionar campos de observações na tabela vendas
-- Execute este script no SQL Editor do Supabase
-- =======================================================

ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS observacoes_pagamento TEXT;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Recarregar o cache da API (PostgREST)
NOTIFY pgrst, 'reload schema';
