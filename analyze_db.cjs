const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:Lucasduda28123@db.axsnslxzctbzgdsgzruf.supabase.co:5432/postgres",
  });
  
  await client.connect();
  
  const res = await client.query("SELECT id, nome, categoria, representante FROM produtos WHERE representante IS NULL OR representante = 'Premium Garden' OR representante = '' LIMIT 20;");
  
  console.log("Produtos Premium Garden / Vazio:");
  console.table(res.rows);
  
  const res2 = await client.query("SELECT DISTINCT categoria FROM produtos;");
  console.log("Categorias distintas no DB:", res2.rows.map(r => r.categoria));

  const res3 = await client.query("SELECT DISTINCT representante FROM produtos;");
  console.log("Representantes distintos no DB:", res3.rows.map(r => r.representante));

  await client.end();
}

main().catch(console.error);
