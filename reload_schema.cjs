const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:Lucasduda28123@db.axsnslxzctbzgdsgzruf.supabase.co:5432/postgres",
  });
  
  await client.connect();
  console.log("Connected. Reloading PostgREST schema cache...");
  await client.query("NOTIFY pgrst, 'reload schema';");
  console.log("Schema reloaded!");
  await client.end();
}

main().catch(console.error);
