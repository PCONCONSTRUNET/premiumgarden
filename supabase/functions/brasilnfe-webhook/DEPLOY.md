# Deploy da Edge Function — Brasil NFe Webhook

## Pré-requisitos

```bash
npm install -g supabase
supabase login
supabase link --project-ref <seu-project-ref>
```

## 1. Configurar o Secret do Webhook

No painel Brasil NFe (**Perfil → Webhooks → Adicionar webhook**):
- **Nome:** Integração VIVAVERDE ERP
- **URL:** `https://<seu-project-ref>.supabase.co/functions/v1/brasilnfe-webhook`
- Clique **Salvar** e **copie o secret gerado**

Depois, configure no Supabase:

```bash
supabase secrets set BRASILNFE_WEBHOOK_SECRET=<secret_copiado_do_brasilnfe>
```

## 2. Deploy da Edge Function

```bash
supabase functions deploy brasilnfe-webhook --no-verify-jwt
```

> `--no-verify-jwt` é necessário porque o Brasil NFe não envia JWT — a autenticação é feita pela assinatura HMAC no header `X-Webhook-Signature`.

## 3. Executar as Migrations SQL

No **SQL Editor do Supabase**, execute em ordem:

1. `supabase_notas_fiscais_brasilnfe.sql` — campos reais na tabela notas_fiscais
2. `supabase_webhook_deliveries.sql` — tabela de idempotência

## 4. URL final do Webhook

```
https://<seu-project-ref>.supabase.co/functions/v1/brasilnfe-webhook
```

Substitua `<seu-project-ref>` pelo ID do seu projeto Supabase (visível em **Project Settings → General**).

---

## Eventos Tratados

| Evento | O que faz |
|---|---|
| `test.ping` | Confirma que o webhook está ativo (retorna 200) |
| `nfe.lote.finalizado` | Atualiza `notas_fiscais` com chave, protocolo e status real da SEFAZ |
| `documento.entrada.recebida` | Registra NF-e/CT-e recebida na tabela `documentos_entrada` |
| `documento.entrada.cancelada` | Marca NF-e de entrada como cancelada |

## Segurança

- Assinatura **HMAC-SHA256** verificada em tempo constante antes de qualquer processamento
- Idempotência via `delivery_id` — retentativas do Brasil NFe não causam duplicatas
- Tabela `webhook_deliveries` protegida por RLS (somente `service_role`)
- Edge Function usa `SUPABASE_SERVICE_ROLE_KEY` (injetado automaticamente pelo Supabase)
