-- Adicionando a coluna que faltou para o controle financeiro das comissões
ALTER TABLE public.vendas
ADD COLUMN IF NOT EXISTS status_pagamento_comissao TEXT DEFAULT 'Pendente';
