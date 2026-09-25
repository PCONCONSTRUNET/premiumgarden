const fs = require('fs');
const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:Lucasduda28123@db.axsnslxzctbzgdsgzruf.supabase.co:5432/postgres",
  });
  
  await client.connect();
  console.log("Conectado ao banco de dados.");
  
  const sql = fs.readFileSync('import_abc_ceramica.sql', 'utf8');
  
  console.log("Executando inserção dos produtos ABC Cerâmica...");
  
  try {
    await client.query(sql);
    console.log("Sucesso! Todos os 484 produtos foram inseridos com sucesso.");
  } catch (err) {
    console.error("Erro ao inserir produtos:", err.message);
  }

  await client.end();
}

main().catch(console.error);
