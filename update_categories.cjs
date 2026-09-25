const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:Lucasduda28123@db.axsnslxzctbzgdsgzruf.supabase.co:5432/postgres",
  });
  
  await client.connect();
  
  const { rows } = await client.query("SELECT id, nome FROM produtos WHERE representante = 'ABC CERÂMICA'");
  
  let count = 0;
  for (const row of rows) {
    let categoria = 'Vasos de Cerâmica';
    const nome = row.nome.toLowerCase();
    
    if (nome.includes('casca de pinus') || nome.includes('terra vegetal') || nome.includes('argila') || nome.includes('substrato') || nome.includes('musgo') || nome.includes('pedrisco')) {
      categoria = 'Substratos e Solos';
    } else if (nome.includes('fonte') || nome.includes('manta geotextil') || nome.includes('limitador')) {
      categoria = 'Jardinagem e Decoração';
    } else if (nome.includes('passaro') || nome.includes('pássaro') || nome.includes('joão de barro') || nome.includes('cão') || nome.includes('cao')) {
      categoria = 'Linha Pet e Aves';
    } else if (nome.includes('prato')) {
      categoria = 'Pratos para Vasos';
    } else if (nome.includes('mini')) {
      categoria = 'Miniaturas e Lembrancinhas';
    }
    
    await client.query("UPDATE produtos SET categoria = $1 WHERE id = $2", [categoria, row.id]);
    count++;
  }
  
  console.log(`Atualizadas categorias de ${count} produtos.`);
  await client.end();
}

main().catch(console.error);
