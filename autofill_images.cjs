const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:Lucasduda28123@db.axsnslxzctbzgdsgzruf.supabase.co:5432/postgres",
  });
  
  await client.connect();
  
  const prefixes = [
    "PRATO", "COMUM", "PEZINHO", "SÃO PAULO", "TOSCANO", "TRIVIAL", "VIETNAM", 
    "REX SIMPLES", "REX", "TINA", "MINI COPO", "MINI BEGÔNIA", "MINI COMUM", 
    "MINI ITÁLIA", "MINI SUCULENTA", "MINI VIOLETA", "REDENTOR TORTO LISO", 
    "REDENTOR TORTO RÚST."
  ];

  let totalUpdated = 0;

  for (const prefix of prefixes) {
    // Acha a primeira imagem válida dessa família
    const res = await client.query(`
      SELECT imagem FROM produtos 
      WHERE nome LIKE $1 AND imagem IS NOT NULL AND imagem != ''
      LIMIT 1
    `, [prefix + '%']);

    if (res.rows.length > 0) {
      const url = res.rows[0].imagem;
      // Atualiza todos os outros dessa família que estão sem imagem
      const updateRes = await client.query(`
        UPDATE produtos 
        SET imagem = $1 
        WHERE nome LIKE $2 AND (imagem IS NULL OR imagem = '')
      `, [url, prefix + '%']);
      
      if (updateRes.rowCount > 0) {
        console.log(`Família ${prefix}: Copiou foto para ${updateRes.rowCount} produtos.`);
        totalUpdated += updateRes.rowCount;
      }
    }
  }

  console.log(`Total de produtos atualizados automaticamente: ${totalUpdated}`);
  
  await client.query("NOTIFY pgrst, 'reload schema'");
  await client.end();
}

main().catch(console.error);
