-- Criação da tabela de configurações
CREATE TABLE public.configuracoes (
  id INTEGER PRIMARY KEY DEFAULT 1,
  razao_social TEXT,
  cnpj TEXT,
  inscricao_estadual TEXT,
  regime_tributario TEXT,
  endereco TEXT,
  telefone TEXT,
  email_contato TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Garantir que a tabela possa ser lida e gravada (Se usar Row Level Security, ajuste as políticas)
-- Se o projeto usar permissão pública por enquanto:
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública" ON public.configuracoes FOR SELECT USING (true);
CREATE POLICY "Permitir inserção autenticada" ON public.configuracoes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização autenticada" ON public.configuracoes FOR UPDATE USING (auth.role() = 'authenticated');
