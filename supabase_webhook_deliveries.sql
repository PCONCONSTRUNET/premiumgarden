-- ============================================================
-- Migration: Tabela de idempotência para webhooks Brasil NFe
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- Tabela para registrar deliveryIds já processados (evita reprocessar retentativas)
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id     TEXT        NOT NULL UNIQUE,   -- X-Webhook-Delivery header
  event           TEXT        NOT NULL,           -- ex: "nfe.lote.finalizado"
  attempt         INT         DEFAULT 1,
  payload         JSONB,                          -- Payload completo para auditoria
  processado_em   TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE webhook_deliveries IS 'Registro de webhooks recebidos do Brasil NFe para idempotência';
COMMENT ON COLUMN webhook_deliveries.delivery_id IS 'ID único de entrega (X-Webhook-Delivery). Idêntico em todas as retentativas do mesmo evento.';

-- Índice para lookup rápido por deliveryId
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_delivery_id
  ON webhook_deliveries (delivery_id);

-- Índice por evento para auditoria/análise
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event
  ON webhook_deliveries (event);

-- Política de limpeza: remover registros com mais de 30 dias
-- (opcional - pode ser executado via pg_cron)
-- DELETE FROM webhook_deliveries WHERE processado_em < now() - interval '30 days';

-- ─────────────────────────────────────────────────────────────────
-- Row Level Security: somente service_role pode acessar
-- (a Edge Function usa service_role_key, não a anon key)
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Nenhuma política pública: apenas service_role tem acesso irrestrito
-- (service_role bypassa RLS automaticamente)
