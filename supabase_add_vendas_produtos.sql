-- Adicionar a coluna quantidade_vendas na tabela produtos
-- Essa coluna guardará o número total de vendas e permitirá edição manual
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS quantidade_vendas INTEGER DEFAULT 0;
