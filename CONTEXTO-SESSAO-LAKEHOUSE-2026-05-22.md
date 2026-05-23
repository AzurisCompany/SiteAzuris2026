# Handoff — Lakehouse Inscrição & Pagamento (2026-05-22)

Sessão dedicada a construir o sistema de inscrição + pagamento do curso
**Lakehouse: Pipeline na Prática** dentro de `/lakehouse-comunidade`.
Próxima sessão: **ativar produção**.

---

## ✅ Que foi feito

### Sistema completo no ar (SANDBOX)

| Componente | Status |
|---|---|
| `/lakehouse-comunidade/inscricao` (form) | ✅ 200 em prod |
| `/lakehouse-comunidade/inscricao/obrigado` | ✅ 200 em prod |
| `/api/inscricao` (POST) | ✅ Funcionando |
| `/api/webhook/asaas` (POST) | ✅ Funcionando, token validado |
| Tabela `inscricoes` no Postgres | ✅ Aplicado via Neon Console |
| Webhook configurado no Asaas Sandbox | ✅ Ativo, 6 eventos |
| Teste end-to-end (form → checkout → webhook → DB) | ✅ Passou (cartão sandbox) |

### Arquivos criados

```
sql/inscricoes-schema.sql
sql/run-schema.mjs
src/lib/db.ts
src/lib/asaas.ts
src/app/api/inscricao/route.ts
src/app/api/webhook/asaas/route.ts
src/app/lakehouse-comunidade/inscricao/page.tsx
src/app/lakehouse-comunidade/inscricao/InscricaoForm.tsx
src/app/lakehouse-comunidade/inscricao/obrigado/page.tsx
```

Commits:
- `30f5466` — feat(lakehouse): inscrição com pagamento via Asaas

### Env vars configuradas no Vercel

**Production + Development:**

| Var | Valor atual |
|---|---|
| `POSTGRES_URL` etc. | Sensitive (via Vercel Storage / Neon) |
| `ASAAS_API_KEY` | `$aact_hmlg_...` (SANDBOX) |
| `ASAAS_BASE_URL` | `https://sandbox.asaas.com/api/v3` |
| `ASAAS_WEBHOOK_TOKEN` | (32 hex chars) — também salvo em `web/.webhook-token.txt` |

### CTAs do landing atualizados

4 botões em `public/lakehouse-comunidade/index.html` passaram de
`/contato?utm_*` para `/lakehouse-comunidade/inscricao?utm_*`.

### Regras de negócio implementadas

- Lote ativo determinado em runtime via view `v_vagas_por_lote`:
  - Lote 1 (R$ 550, 15 vagas) → ativo até esgotar
  - Lote 2 (R$ 750, 20 vagas) → ativa quando Lote 1 esgotar
  - "Esgotado" = ≥ capacidade de inscrições com status `pending` ou `paid`
- PIX: 5% off do valor do lote, à vista, vencimento +3 dias
- Cartão: valor cheio, até 12x sem juros
- UTMs do landing são preservados e salvos no DB

---

## 🎯 Plano pra próxima sessão — Ativar Produção

### Passo 1: Pegar credenciais de produção no Asaas (você, ~5 min)

No painel Asaas, **modo Produção**:

1. **Integrações → API** → copiar API key produção (começa com algo tipo `$aact_prod_...` ou `$aact_YT...`, **sem** `hmlg`)
2. Anotar (vai me passar)

### Passo 2: Trocar env vars no Vercel (eu, ~5 min)

```bash
# No diretório /mnt/d/2026/siteAzuris2026/web/

# Remove a sandbox key
vercel env rm ASAAS_API_KEY production --yes
vercel env rm ASAAS_BASE_URL production --yes

# Adiciona a produção
vercel env add ASAAS_API_KEY production --value "<PROD_KEY>" --yes
vercel env add ASAAS_BASE_URL production --value "https://www.asaas.com/api/v3" --yes

# Redeploy pra Vercel pegar novas envs
vercel deploy --prod --yes
```

### Passo 3: Criar webhook em PRODUÇÃO no Asaas (você, ~3 min)

Webhook **produção é diferente do sandbox** — precisa criar de novo no modo Produção:

1. Painel Asaas → modo Produção → **Integrações → Notificações → Webhooks**
2. Adicionar Webhook:
   - **Nome:** `azuris-lakehouse-prod`
   - **URL:** `https://azuris.com.br/api/webhook/asaas`
   - **Versão:** v3
   - **Tipo de envio:** Não sequencial
   - **Token de autenticação:** (mesmo do sandbox — leio em `web/.webhook-token.txt` na hora)
   - **Email pra falhas:** `binhara@azuris.com.br`
   - **Eventos:** PAYMENT_CONFIRMED, PAYMENT_RECEIVED, PAYMENT_OVERDUE, PAYMENT_DELETED, PAYMENT_REFUNDED, PAYMENT_CHARGEBACK_REQUESTED
3. **Ativar:**
   - "Este Webhook ficará ativo?" → **Sim**
   - "Fila de sincronização ativada?" → **Sim**
4. Salva

### Passo 4: Teste real com R$ 1,00 (~5 min)

Fluxo final de validação:

1. Eu altero temporariamente o lote pra R$ 1,00 (1 linha em `src/lib/db.ts`, depois reverto)
   - OU criamos inscrição com valor mínimo via API direto
2. Abre `https://azuris.com.br/lakehouse-comunidade/inscricao`
3. Faz inscrição com SEU cartão real (não de teste)
4. Confirma cobrança no app do banco
5. Aguarda webhook chegar (~5s)
6. Eu valido no DB que inscrição está `paid`
7. **Cancela/estorna** no painel Asaas imediatamente
8. Reverto o valor pra R$ 550

### Passo 5: Anunciar / divulgar (você)

Sistema pronto pra receber inscrições reais. Compartilha:
- `https://azuris.com.br/lakehouse-comunidade`
- `https://azuris.com.br/lakehouse-comunidade/inscricao` (direto)

---

## ⚠️ Riscos / cuidados pra produção

1. **Conta sandbox vs produção** são separadas no Asaas. Webhook precisa ser configurado em AMBOS (já está em sandbox, falta produção).

2. **PIX ainda pode dar erro em produção** se a conta de produção não tiver verificação completa específica pra PIX. Validamos isso no Passo 4 — se o teste com cartão funcionar mas PIX falhar, mesmo tratamento da sandbox (verificar status da conta no painel Asaas).

3. **Política de reembolso** — pensar antes de divulgar. Asaas suporta reembolso direto pelo painel, mas é bom ter uma política escrita pro aluno.

4. **Limite de vagas** funciona automaticamente — quando 15 inscrições estiverem com status `paid` ou `pending` no Lote 1, o sistema vai pro Lote 2. Mas inscrições **expiradas/canceladas** continuam ocupando vaga até serem marcadas como `cancelled` via webhook (PAYMENT_DELETED) ou `overdue` (PAYMENT_OVERDUE depois de 3 dias).

5. **Backlog de webhooks pendentes do sandbox** — se ele estiver acumulado, podemos ter eventos antigos chegando depois. Idempotente, mas vale verificar o painel Asaas sandbox e descartar fila pendente antes de avançar pra produção.

---

## 🔧 Configurações úteis pra debug

### Ver inscrições no DB

Via Neon Console (painel Vercel → Storage → Open in Neon → SQL Editor):

```sql
-- Últimas 20 inscrições
SELECT id, nome, email, lote, billing_type, status, valor_centavos/100.0 as valor, created_at, paid_at
FROM inscricoes
ORDER BY created_at DESC
LIMIT 20;

-- Vagas por lote
SELECT * FROM v_vagas_por_lote;

-- Inscrições pendentes há mais de 4 dias (provável que não vão pagar)
SELECT id, nome, email, status, created_at
FROM inscricoes
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '4 days';
```

### Cancelar inscrição manualmente

Via Neon Console:

```sql
UPDATE inscricoes
SET status = 'cancelled', updated_at = NOW()
WHERE id = <ID>;
```

Lembrar de também cancelar a cobrança no painel Asaas se ainda não foi paga.

### Forçar webhook simulado pra testar local

```bash
curl -X POST https://azuris.com.br/api/webhook/asaas \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: $(cat .webhook-token.txt)" \
  -d '{
    "event":"PAYMENT_RECEIVED",
    "payment":{
      "id":"<ID DO ASAAS>",
      "customer":"<CUSTOMER_ID>",
      "value":522.50,
      "netValue":518.00,
      "status":"RECEIVED",
      "billingType":"PIX",
      "dueDate":"2026-05-25",
      "invoiceUrl":"https://...",
      "description":"Teste"
    }
  }'
```

---

## 📋 Pendências de melhorias (não bloqueiam produção)

- [ ] Email com marca Azuris via Resend (hoje usa email padrão Asaas)
- [ ] Página de área do aluno com login (hoje material entregue por email)
- [ ] Painel admin pra ver inscrições sem precisar abrir Neon Console
- [ ] Rate limiting no `/api/inscricao` (anti-bot)
- [ ] Captcha no form (Cloudflare Turnstile / hCaptcha)
- [ ] Métricas / dashboard de conversão (quantos abriram form vs pagaram)
- [ ] Reativar/limpar fila pendente do webhook sandbox

---

## Memória atualizada

A memória persistente do Claude (`reference_azuris-site.md`) foi atualizada
com tudo: stack, env vars, lotes, sandbox→prod migration path, eventos
webhook, queries de debug.

Próxima sessão do Claude já vai ter contexto completo. Basta dizer
"vamos ativar a produção do lakehouse" que ele pega aqui de onde parou.

Última revisão: **2026-05-22**.
