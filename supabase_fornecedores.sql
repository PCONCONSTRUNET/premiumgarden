-- =====================================================
-- Migration: Tabela de Fornecedores
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Cria a tabela caso não exista
CREATE TABLE IF NOT EXISTS public.fornecedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa TEXT NOT NULL,
  contato TEXT,
  telefone TEXT,
  cpf_cnpj TEXT,
  endereco TEXT,
  cidade TEXT,
  valor_total NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Adiciona colunas que podem estar faltando (seguro rodar mesmo se a tabela já existe)
ALTER TABLE public.fornecedores
  ADD COLUMN IF NOT EXISTS contato TEXT,
  ADD COLUMN IF NOT EXISTS telefone TEXT,
  ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT,
  ADD COLUMN IF NOT EXISTS endereco TEXT,
  ADD COLUMN IF NOT EXISTS cidade TEXT,
  ADD COLUMN IF NOT EXISTS valor_total NUMERIC DEFAULT 0;

-- 3. Permissões básicas
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow authenticated full access" ON public.fornecedores
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
