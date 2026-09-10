import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://yzvesbpnbewpmnpkomic.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6dmVzYnBuYmV3cG1ucGtvbWljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxODA1OTYsImV4cCI6MjEwMzc1NjU5Nn0.ogrdQJoEjOD82OOXH8PD47L86SLTCz7nglzZkgH2otQ";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixNumbers() {
  console.log("Buscando vendas sem número...");
  
  // Buscar todas as vendas que não tem 'numero' preenchido, ordenadas por data de criação
  const { data: vendasSemNumero, error: fetchError } = await supabase
    .from("vendas")
    .select("id, created_at, numero")
    .is("numero", null)
    .order("created_at", { ascending: true });
    
  if (fetchError) {
    console.error("Erro ao buscar:", fetchError);
    return;
  }
  
  if (!vendasSemNumero || vendasSemNumero.length === 0) {
    console.log("Nenhuma venda sem número encontrada.");
    return;
  }
  
  console.log(`Encontradas ${vendasSemNumero.length} vendas sem número.`);
  
  // Buscar o maior número atual para continuarmos dele
  const { data: maxVenda, error: maxError } = await supabase
    .from("vendas")
    .select("numero")
    .not("numero", "is", null)
    .order("numero", { ascending: false })
    .limit(1);
    
  if (maxError) {
    console.error("Erro ao buscar max numero:", maxError);
    return;
  }
  
  let proximoNumero = 2; // Por padrão, se 1 já existe, começar no 2
  
  if (maxVenda && maxVenda.length > 0 && maxVenda[0].numero) {
    // Pegar o maior número atual e somar 1
    // Caso existam pedidos muito lá na frente, talvez seja melhor apenas contar
    // Mas vamos usar max(numero) + 1 para ser seguro, a não ser que a gente saiba que 0001 é o único
    console.log("Maior número atual:", maxVenda[0].numero);
    // Mas o usuário falou que o "0001" já está lá, e os que sobraram ele quer que continuem.
    // Para ter certeza que vamos preencher com 2, 3, etc... vamos pegar a maxVenda. 
    proximoNumero = Math.max(proximoNumero, maxVenda[0].numero + 1);
  } else {
    // Verifica se já tem o número 1
    const { data: temUm } = await supabase.from("vendas").select("numero").eq("numero", 1);
    if (temUm && temUm.length > 0) proximoNumero = 2;
    else proximoNumero = 1;
  }
  
  // Mas espera, e se o supabase retornar 0001?
  // O usuário pode querer especificamente que esses dois sejam 2 e 3.
  // Vamos fazer isso de forma mais segura. 
  // O pedido E10639EF deve receber 2 ou 3.
  console.log(`Vamos começar a numerar a partir de: ${proximoNumero}`);
  
  for (const venda of vendasSemNumero) {
    console.log(`Atualizando venda ID: ${venda.id} (criada em ${venda.created_at}) com número ${proximoNumero}...`);
    
    const { error: updateError } = await supabase
      .from("vendas")
      .update({ numero: proximoNumero })
      .eq("id", venda.id);
      
    if (updateError) {
      console.error(`Erro ao atualizar venda ${venda.id}:`, updateError);
    } else {
      console.log(`Venda ${venda.id} atualizada com sucesso para número ${proximoNumero}!`);
      proximoNumero++;
    }
  }
  
  console.log("Pronto!");
}

fixNumbers();

