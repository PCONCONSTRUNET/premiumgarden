// Supabase Edge Function — Brasil NFe Webhook Receiver
// Deploy: npx supabase functions deploy brasilnfe-webhook --no-verify-jwt
// URL:    https://mpbmssohpjwijkyhtucm.supabase.co/functions/v1/brasilnfe-webhook

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Verificação de assinatura HMAC-SHA256 ───────────────────────────────────

async function verificarAssinatura(
  body: string,
  headerRecebido: string,
  secret: string,
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const msgData = encoder.encode(body);

    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signature = await crypto.subtle.sign("HMAC", key, msgData);
    const hashHex = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const esperada = `sha256=${hashHex}`;

    if (esperada.length !== headerRecebido.length) return false;

    let diff = 0;
    for (let i = 0; i < esperada.length; i++) {
      diff |= esperada.charCodeAt(i) ^ headerRecebido.charCodeAt(i);
    }
    return diff === 0;
  } catch (err) {
    console.error("Erro ao verificar assinatura:", err);
    return false;
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Ler body raw antes de qualquer parse
  let bodyRaw = "";
  try {
    bodyRaw = await req.text();
  } catch {
    return new Response(JSON.stringify({ error: "Erro ao ler body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verificar assinatura HMAC (só se o secret estiver configurado)
  const webhookSecret = Deno.env.get("BRASILNFE_WEBHOOK_SECRET") ?? "";
  const signatureHeader = req.headers.get("x-webhook-signature") ?? "";
  const deliveryId = req.headers.get("x-webhook-delivery") ?? crypto.randomUUID();
  const attempt = req.headers.get("x-webhook-attempt") ?? "1";
  const event = req.headers.get("x-webhook-event") ?? "";

  if (webhookSecret && signatureHeader) {
    const valida = await verificarAssinatura(bodyRaw, signatureHeader, webhookSecret);
    if (!valida) {
      console.error(`Assinatura inválida para delivery ${deliveryId}`);
      return new Response(JSON.stringify({ error: "Assinatura inválida" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  console.log(`[BrasilNFe] event=${event || "?"} delivery=${deliveryId} attempt=${attempt}`);

  // Parse do payload
  let envelope: { event: string; deliveryId: string; timestamp: string; data: Record<string, unknown> };
  try {
    envelope = JSON.parse(bodyRaw);
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Inicializar cliente Supabase (service_role bypassa RLS)
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceKey);

  // ── Idempotência — verificar se já processamos este delivery ────────────────
  try {
    const { data: existente } = await supabase
      .from("webhook_deliveries")
      .select("id")
      .eq("delivery_id", deliveryId)
      .maybeSingle();

    if (existente) {
      console.log(`Delivery ${deliveryId} já processado — ignorando.`);
      return new Response(JSON.stringify({ ok: true, idempotent: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Registrar o delivery para idempotência futura
    await supabase.from("webhook_deliveries").insert({
      delivery_id: deliveryId,
      event: envelope.event,
      attempt: Number(attempt),
      payload: envelope,
      processado_em: new Date().toISOString(),
    });
  } catch (err) {
    // Tabela não existe ainda? Apenas loga e continua
    console.warn("Idempotência indisponível:", err);
  }

  // ── Processar por tipo de evento ────────────────────────────────────────────

  try {
    switch (envelope.event) {

      // Teste de conectividade
      case "test.ping": {
        console.log("✅ test.ping recebido — webhook funcionando!");
        break;
      }

      // Lote de NF-e finalizado
      case "nfe.lote.finalizado": {
        const data = envelope.data as {
          codLote: string;
          tipoAmbiente: number;
          qtdEmitida: number;
          qtdTotal: number;
          notas: Array<{
            id: number;
            numero: number;
            chaveAcesso: string;
            numeroProtocolo: string;
            codStatus: number;
            dsStatus: string;
            error: string | null;
          }>;
        };

        console.log(`Lote ${data.codLote}: ${data.qtdEmitida}/${data.qtdTotal} emitidas`);

        for (const nota of data.notas ?? []) {
          const statusStr =
            nota.codStatus === 100 || nota.codStatus === 150 ? "Autorizada"
            : nota.codStatus === 101 ? "Cancelada"
            : nota.codStatus === 110 ? "Denegada"
            : "Erro";

          const { error: upErr } = await supabase
            .from("notas_fiscais")
            .update({
              numero: String(nota.numero),
              chave_acesso: nota.chaveAcesso || "",
              numero_protocolo: nota.numeroProtocolo || null,
              cod_status: nota.codStatus,
              ds_status: nota.dsStatus || null,
              error_message: nota.error || null,
              status: statusStr,
              tipo_ambiente: data.tipoAmbiente,
            })
            .eq("brasilnfe_id", nota.id);

          if (upErr) {
            console.error(`Erro ao atualizar nota ${nota.id}:`, upErr.message);
          } else {
            console.log(`Nota ${nota.id} → ${statusStr}`);
          }
        }
        break;
      }

      // NF-e de entrada recebida
      case "documento.entrada.recebida": {
        const data = envelope.data as Record<string, unknown>;
        console.log(`Documento entrada recebido: ${data.Chave}`);

        await supabase.from("documentos_entrada").upsert(
          {
            chave_acesso: data.Chave,
            numero: data.Numero,
            modelo: data.ModeloDocumento,
            valor: data.Valor,
            cnpj_emissor: data.CnpjEmissor,
            nome_emissor: data.NomeEmissor,
            cnpj_destinatario: data.CnpjDestinatario,
            numero_protocolo: data.NumeroProtocolo,
            status: data.Status,
            dt_emissao: data.DtEmissao,
            dt_recebimento: data.DtRecebimento,
            webhook_delivery_id: deliveryId,
          },
          { onConflict: "chave_acesso" },
        );
        break;
      }

      // NF-e de entrada cancelada
      case "documento.entrada.cancelada": {
        const data = envelope.data as Record<string, unknown>;
        console.log(`Documento entrada cancelado: ${data.Chave}`);
        await supabase
          .from("documentos_entrada")
          .update({ status: 2 })
          .eq("chave_acesso", data.Chave);
        break;
      }

      default:
        console.warn(`Evento não tratado: ${envelope.event}`);
    }
  } catch (err) {
    console.error("Erro ao processar evento:", err);
    // Retornar 200 mesmo assim para evitar retentativas desnecessárias
    // (o erro foi logado para investigação)
  }

  return new Response(
    JSON.stringify({ ok: true, event: envelope.event, deliveryId }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
