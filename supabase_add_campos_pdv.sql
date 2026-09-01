-- Adiciona os campos de descontos e condição de pagamento na tabela de vendas
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS desconto_percentual numeric DEFAULT 0;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS desconto_valor numeric DEFAULT 0;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS condicao_pagamento text;

-- (Opcional) Caso davs seja uma tabela separada e não apenas tipo='DAV' em vendas
-- ALTER TABLE public.davs ADD COLUMN IF NOT EXISTS desconto_percentual numeric DEFAULT 0;
-- ALTER TABLE public.davs ADD COLUMN IF NOT EXISTS desconto_valor numeric DEFAULT 0;
-- ALTER TABLE public.davs ADD COLUMN IF NOT EXISTS condicao_pagamento text;
