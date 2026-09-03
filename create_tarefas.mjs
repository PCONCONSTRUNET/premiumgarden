import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((a,c)=>{
  const[k,...v]=c.split('=');
  if(k&&v.length)a[k.trim()]=v.join('=').replace(/['"\r]/g,'').trim();
  return a;
},{});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const query = `
    CREATE TABLE IF NOT EXISTS public.tarefas (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      data TIMESTAMP WITH TIME ZONE,
      meio_contato TEXT,
      cliente_id UUID REFERENCES public.clientes(id),
      cliente_nome TEXT,
      detalhes TEXT,
      vendedor_id UUID REFERENCES public.vendedores(id),
      status TEXT DEFAULT 'Pendente',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
    );
    ALTER TABLE public.tarefas DISABLE ROW LEVEL SECURITY;
  `;

  // Tenta criar pela anon_key (isso falha na maioria dos projetos se o RPC execute_sql nao existir, mas como vc ta rodando como admin em outras coisas talvez tenha).
  // Uma alternativa melhor para o frontend bypassar RLS eh ja desativar direto no SQL EDITOR da supabase.
  console.log("SQL QUERY TO RUN IN SUPABASE SQL EDITOR:\n\n" + query);
}

run();
