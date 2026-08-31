-- Migration: Adicionar colunas de emissor e demais campos na tabela davs
-- Execute este script no SQL Editor do Supabase

-- Adicionar colunas do emissor (fornecedor)
ALTER TABLE public.davs
  ADD COLUMN IF NOT EXISTS emissor_nome TEXT,
  ADD COLUMN IF NOT EXISTS emissor_cnpj TEXT,
  ADD COLUMN IF NOT EXISTS emissor_endereco TEXT,
  ADD COLUMN IF NOT EXISTS emissor_telefone TEXT;

-- Adicionar colunas de condições comerciais (caso não existam)
ALTER TABLE public.davs
  ADD COLUMN IF NOT EXISTS vendedor TEXT,
  ADD COLUMN IF NOT EXISTS condicao_pagamento TEXT,
  ADD COLUMN IF NOT EXISTS frete_tipo TEXT,
  ADD COLUMN IF NOT EXISTS prazo_entrega TEXT;

-- Adicionar colunas financeiras (caso não existam)
ALTER TABLE public.davs
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS desconto_percentual NUMERIC(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS desconto_valor NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS frete_valor NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total NUMERIC(12, 2) DEFAULT 0;

-- Adicionar colunas de texto livre e validade (caso não existam)
ALTER TABLE public.davs
  ADD COLUMN IF NOT EXISTS observacoes TEXT,
  ADD COLUMN IF NOT EXISTS validade TIMESTAMP WITH TIME ZONE;
