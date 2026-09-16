import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env", "utf8");
const urlMatch = env.match(/VITE_SUPABASE_URL="(.*?)"/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY="(.*?)"/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function run() {
  const { data, error } = await supabase.storage.listBuckets();
  console.log("Buckets:", data);
  if (error) console.error("Error:", error);
  
  if (!data?.find(b => b.name === "produtos-imagens")) {
    console.log("Creating bucket 'produtos-imagens'...");
    const { data: bData, error: bError } = await supabase.storage.createBucket("produtos-imagens", { public: true });
    console.log("Create result:", bData, bError);
  }
}
run();
