import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, token, Target-Path",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const targetPath = req.headers.get("Target-Path");
    if (!targetPath) {
      throw new Error("Missing Target-Path header");
    }

    const token = req.headers.get("token") || "";
    
    // Ler body apenas se houver
    let body = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await req.text();
    }

    console.log(`[Proxy] Repassando para ${targetPath}`);

    const response = await fetch(`https://api.brasilnfe.com.br${targetPath}`, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        "Token": token,
      },
      body: body || undefined,
    });

    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Proxy Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
