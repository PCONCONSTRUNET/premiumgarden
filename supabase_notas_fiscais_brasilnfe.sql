-- ============================================================
-- Migration: Suporte a campos reais Brasil NFe na tabela notas_fiscais
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- Adiciona colunas para dados reais da SEFAZ / Brasil NFe
ALTER TABLE notas_fiscais
  ADD COLUMN IF NOT EXISTS brasilnfe_id         BIGINT,
  ADD COLUMN IF NOT EXISTS cod_lote             TEXT,
  ADD COLUMN IF NOT EXISTS numero_protocolo     TEXT,
  ADD COLUMN IF NOT EXISTS tipo_ambiente        INT  DEFAULT 2,   -- 1=Produção, 2=Homologação
  ADD COLUMN IF NOT EXISTS cod_status           INT,              -- Ex: 100=Autorizado, 110=Denegado
  ADD COLUMN IF NOT EXISTS ds_status            TEXT,             -- Descrição do status SEFAZ
  ADD COLUMN IF NOT EXISTS xml_base64           TEXT,             -- XML da NF-e em Base64
  ADD COLUMN IF NOT EXISTS pdf_base64           TEXT,             -- DANFE em Base64
  ADD COLUMN IF NOT EXISTS error_message        TEXT,             -- Mensagem de erro se houver
  ADD COLUMN IF NOT EXISTS payload_enviado      JSONB,            -- Payload completo enviado para auditoria
  ADD COLUMN IF NOT EXISTS natureza_operacao    TEXT DEFAULT 'Venda de mercadoria',
  ADD COLUMN IF NOT EXISTS emitida_em           TIMESTAMPTZ DEFAULT now();

-- Comentários descritivos nas colunas
COMMENT ON COLUMN notas_fiscais.brasilnfe_id     IS 'ID interno da nota no sistema Brasil NFe';
COMMENT ON COLUMN notas_fiscais.cod_lote          IS 'Código do lote de transmissão';
COMMENT ON COLUMN notas_fiscais.numero_protocolo  IS 'Protocolo de autorização da SEFAZ';
COMMENT ON COLUMN notas_fiscais.tipo_ambiente     IS '1=Produção, 2=Homologação';
COMMENT ON COLUMN notas_fiscais.cod_status        IS 'Código de status retornado pela SEFAZ';
COMMENT ON COLUMN notas_fiscais.ds_status         IS 'Descrição do status SEFAZ';
COMMENT ON COLUMN notas_fiscais.xml_base64        IS 'XML autorizado em Base64';
COMMENT ON COLUMN notas_fiscais.pdf_base64        IS 'DANFE em PDF Base64';
COMMENT ON COLUMN notas_fiscais.payload_enviado   IS 'Payload JSON enviado para auditoria';

-- Garante que status pode representar estados reais da SEFAZ
-- (os status anteriores eram strings como 'Autorizada'; mantemos retrocompatibilidade)

-- Índice para busca rápida por chave de acesso
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_chave_acesso
  ON notas_fiscais (chave_acesso);

-- Índice para busca por ID Brasil NFe
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_brasilnfe_id
  ON notas_fiscais (brasilnfe_id);
