const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://axsnslxzctbzgdsgzruf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4c25zbHh6Y3Riemdkc2d6cnVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQ1OTQyODAsImV4cCI6MjAyMDE3MDI4MH0.fKE6B9L9A2V2_0R8S_wT2_0lA" // Need to find the real anon key for axsnslxz...
);
