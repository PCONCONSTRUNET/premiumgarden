-- =================================================================================
-- SCRIPT DE CORREÇÃO: "Table publicly accessible" (Row-Level Security is not enabled)
-- Execute este script no SQL Editor do seu projeto Supabase.
-- =================================================================================

DO $$ 
DECLARE 
  t text;
BEGIN
  -- Percorre todas as tabelas públicas do seu banco de dados
  FOR t IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
  LOOP
    -- 1. Ativa a segurança em nível de linha (RLS) para a tabela
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    
    -- 2. Remove políticas de segurança antigas (caso existam) para evitar duplicação
    EXECUTE format('DROP POLICY IF EXISTS "Acesso total para autenticados" ON public.%I;', t);
    EXECUTE format('DROP POLICY IF EXISTS "Acesso publico geral" ON public.%I;', t);

    -- 3. Cria uma política segura: Permite leitura, escrita, atualização e exclusão 
    -- APENAS para usuários autenticados (logados no sistema).
    EXECUTE format('CREATE POLICY "Acesso total para autenticados" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);', t);
    
  END LOOP;
END $$;
