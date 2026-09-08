-- ====================================================================
-- SCRIPT DE AJUSTE GERAL DO BANCO DE DADOS (SUPABASE) - PREMIUM GARDEN
-- Execute no Supabase SQL Editor para garantir 100% de compatibilidade
-- ====================================================================

-- 1. Clientes
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT;

-- 2. Vendas
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS rota_id UUID;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS metodo_pagamento TEXT;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS observacoes_pagamento TEXT;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- 3. Tabela de Rotas (Logística e Entregas)
CREATE TABLE IF NOT EXISTS public.rotas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  motorista TEXT,
  veiculo TEXT,
  status TEXT DEFAULT 'Ativa',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.rotas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso público rotas" ON public.rotas;
CREATE POLICY "Acesso público rotas" ON public.rotas FOR ALL USING (true) WITH CHECK (true);

-- 4. Tabela de Movimentações de Estoque (Histórico de Entradas e Saídas)
CREATE TABLE IF NOT EXISTS public.movimentacoes_estoque (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  quantidade NUMERIC NOT NULL,
  motivo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso público movimentações" ON public.movimentacoes_estoque;
CREATE POLICY "Acesso público movimentações" ON public.movimentacoes_estoque FOR ALL USING (true) WITH CHECK (true);

-- 5. DAVs e Itens de DAV (Orçamentos)
ALTER TABLE public.davs ADD COLUMN IF NOT EXISTS numero NUMERIC;
ALTER TABLE public.davs ADD COLUMN IF NOT EXISTS emissor_nome TEXT;
ALTER TABLE public.davs ADD COLUMN IF NOT EXISTS emissor_cnpj TEXT;
ALTER TABLE public.davs ADD COLUMN IF NOT EXISTS emissor_endereco TEXT;
ALTER TABLE public.davs ADD COLUMN IF NOT EXISTS emissor_telefone TEXT;
ALTER TABLE public.davs ADD COLUMN IF NOT EXISTS vendedor TEXT;
ALTER TABLE public.davs ADD COLUMN IF NOT EXISTS frete_tipo TEXT;
ALTER TABLE public.davs ADD COLUMN IF NOT EXISTS prazo_entrega TEXT;
ALTER TABLE public.davs ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.davs ADD COLUMN IF NOT EXISTS desconto_percentual NUMERIC(5,2) DEFAULT 0;
ALTER TABLE public.davs ADD COLUMN IF NOT EXISTS desconto_valor NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.davs ADD COLUMN IF NOT EXISTS frete_valor NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.davs ADD COLUMN IF NOT EXISTS total NUMERIC(12,2) DEFAULT 0;

ALTER TABLE public.dav_items ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.dav_items ADD COLUMN IF NOT EXISTS quantidade NUMERIC DEFAULT 1;
ALTER TABLE public.dav_items ADD COLUMN IF NOT EXISTS imagem TEXT;

-- 6. Fornecedores
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS razao_social TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS nome_fantasia TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS logradouro TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS complemento TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS uf TEXT;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Ativo';
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- 7. Compras
ALTER TABLE public.compras ADD COLUMN IF NOT EXISTS numero_pedido TEXT;
ALTER TABLE public.compras ADD COLUMN IF NOT EXISTS numero NUMERIC;
ALTER TABLE public.compras ADD COLUMN IF NOT EXISTS data_emissao DATE;
ALTER TABLE public.compras ADD COLUMN IF NOT EXISTS previsao_entrega DATE;
ALTER TABLE public.compras ADD COLUMN IF NOT EXISTS total NUMERIC(12,2);
ALTER TABLE public.compras ADD COLUMN IF NOT EXISTS condicao_pagamento TEXT;
ALTER TABLE public.compras ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- 8. Notificações
ALTER TABLE public.notificacoes ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'info';
ALTER TABLE public.notificacoes ADD COLUMN IF NOT EXISTS texto TEXT;
ALTER TABLE public.notificacoes ADD COLUMN IF NOT EXISTS user_id TEXT;

-- 9. Tarefas
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS titulo TEXT;
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'Média';
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS data_limite DATE;
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS responsavel TEXT;

-- 10. Notas Fiscais
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS numero_nf TEXT;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS serie TEXT;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS chave TEXT;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS xml TEXT;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS danfe_url TEXT;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- 11. Recarregar o cache do PostgREST
NOTIFY pgrst, 'reload schema';
