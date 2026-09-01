-- Adicionando colunas de especificações do catálogo Sura Vasos na tabela produtos
ALTER TABLE produtos
ADD COLUMN IF NOT EXISTS numero text,
ADD COLUMN IF NOT EXISTS dimensao text,
ADD COLUMN IF NOT EXISTS volume text,
ADD COLUMN IF NOT EXISTS comprimento text,
ADD COLUMN IF NOT EXISTS cores text[] DEFAULT '{}';

-- Atualizando o cache da API do Supabase imediatamente após a criação
NOTIFY pgrst, 'reload schema';
