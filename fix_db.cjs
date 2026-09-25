const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:Lucasduda28123@db.axsnslxzctbzgdsgzruf.supabase.co:5432/postgres",
  });
  
  await client.connect();
  console.log("Connected to the database.");
  
  // Atualiza todos os produtos existentes para o representante 'Premium Garden'
  const updateRes = await client.query(`
    UPDATE produtos 
    SET representante = 'Premium Garden' 
    WHERE representante IS NULL OR representante = ''
  `);
  
  console.log(`Atualizados ${updateRes.rowCount} produtos com o representante 'Premium Garden'.`);

  // Mostrar como ficou
  const res3 = await client.query("SELECT DISTINCT representante FROM produtos;");
  console.log("Representantes distintos agora no DB:", res3.rows.map(r => r.representante));

  await client.end();
}

main().catch(console.error);
