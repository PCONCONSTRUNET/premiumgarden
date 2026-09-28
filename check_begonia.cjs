const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:Lucasduda28123@db.axsnslxzctbzgdsgzruf.supabase.co:5432/postgres",
  });
  
  await client.connect();
  const { rows } = await client.query("SELECT nome, imagem FROM produtos WHERE nome LIKE '%BEG%'");
  console.log(rows);
  await client.end();
}

main().catch(console.error);
