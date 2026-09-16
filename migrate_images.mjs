import { Client } from 'pg';
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env", "utf8");
const urlMatch = env.match(/VITE_SUPABASE_URL="(.*?)"/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY="(.*?)"/);
const supabase = createClient(urlMatch[1], keyMatch[1]);

const connectionString = 'postgresql://postgres:Lucasduda28123@db.yzvesbpnbewpmnpkomic.supabase.co:5432/postgres';

async function migrateImages() {
  const pgClient = new Client({ connectionString });
  
  try {
    await pgClient.connect();
    console.log("Connected to PostgreSQL for fetching images...");
    
    const result = await pgClient.query(`SELECT id, nome, imagem FROM produtos WHERE imagem IS NOT NULL AND imagem != '' AND length(imagem) > 100`);
    const validProducts = result.rows;

    console.log(`Found ${validProducts.length} products with potential images. Migrating Base64 images to Storage...`);

    let count = 0;
    for (const p of validProducts) {
      if (p.imagem && p.imagem.startsWith("data:image/")) {
        try {
          console.log(`[${count+1}/${validProducts.length}] Migrating image for product: ${p.nome}`);
          
          const matches = p.imagem.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (!matches || matches.length !== 3) {
            console.log(`  Invalid base64 format for ${p.nome}`);
            continue;
          }

          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, "base64");
          const ext = mimeType.split("/")[1] || "png";
          const fileName = `produto_${p.id}_${Date.now()}.${ext}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("produtos-imagens")
            .upload(fileName, buffer, {
              contentType: mimeType,
              upsert: true
            });

          if (uploadError) {
            console.error(`  Error uploading ${p.nome}:`, uploadError);
            continue;
          }

          const { data: publicUrlData } = supabase.storage
            .from("produtos-imagens")
            .getPublicUrl(fileName);

          const newUrl = publicUrlData.publicUrl;

          await pgClient.query('UPDATE produtos SET imagem = $1 WHERE id = $2', [newUrl, p.id]);
          console.log(`  Success -> ${newUrl}`);
          count++;
        } catch (err) {
          console.error(`  Unexpected error processing ${p.nome}:`, err);
        }
      } else {
        console.log(`[${count+1}/${validProducts.length}] Skipping ${p.nome} (already migrated or no base64)`);
      }
    }
    console.log(`Migration complete! Successfully migrated ${count} images.`);
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await pgClient.end();
  }
}

migrateImages();
