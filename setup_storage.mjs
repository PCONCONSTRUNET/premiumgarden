import { Client } from 'pg';

const connectionString = 'postgresql://postgres:Lucasduda28123@db.yzvesbpnbewpmnpkomic.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function setupStorage() {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL.");
    
    // Create bucket
    await client.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('produtos-imagens', 'produtos-imagens', true)
      ON CONFLICT (id) DO UPDATE SET public = true;
    `);
    console.log("Bucket 'produtos-imagens' created or verified.");

    // Create policies for anon access
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access'
        ) THEN
            CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'produtos-imagens');
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anon Insert'
        ) THEN
            CREATE POLICY "Anon Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'produtos-imagens');
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anon Update'
        ) THEN
            CREATE POLICY "Anon Update" ON storage.objects FOR UPDATE USING (bucket_id = 'produtos-imagens');
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anon Delete'
        ) THEN
            CREATE POLICY "Anon Delete" ON storage.objects FOR DELETE USING (bucket_id = 'produtos-imagens');
        END IF;
      END
      $$;
    `);
    
    console.log("Storage policies verified/created successfully.");
  } catch (error) {
    console.error("Error setting up storage:", error);
  } finally {
    await client.end();
  }
}

setupStorage();
