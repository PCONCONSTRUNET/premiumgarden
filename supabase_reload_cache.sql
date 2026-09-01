-- Rode este comando no SQL Editor do Supabase para forçar a atualização do cache da API (PostgREST).
-- Isso resolve o erro "Could not find the 'coluna' column in the schema cache".

NOTIFY pgrst, 'reload schema';
