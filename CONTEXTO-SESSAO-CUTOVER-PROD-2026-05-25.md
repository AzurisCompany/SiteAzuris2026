# Handoff — Cutover Produção Asaas (2026-05-25)

Sessão dedicada a fazer o **cutover do checkout Lakehouse de sandbox → produção** no Asaas. Substitui o handoff de 2026-05-22 (que documentava o sistema em sandbox).

---

## ✅ Resultado: sistema em produção, validado end-to-end

### Cutover executado

| Passo | Status |
|---|---|
| Gerar API key produção no painel Asaas | ✅ (feito pelo usuário) |
| Substituir `ASAAS_API_KEY` no Vercel (era sandbox `$aact_hmlg_...`) | ✅ via `vercel env rm` + `vercel env add` (interativo via stdin pra não expor) |
| Substituir `ASAAS_BASE_URL` pra `https://www.asaas.com/api/v3` | ✅ |
| Manter `ASAAS_WEBHOOK_TOKEN` (mesmo valor sandbox e prod) | ✅ confirmado batendo com `.webhook-token.txt` |
| Configurar webhook em produção no painel Asaas | ✅ (feito pelo usuário) — URL `/api/webhook/asaas`, 6 eventos, mesma token |
| Sanity check da API key (`/customers`, `/finance/balance`, `/myAccount`) | ✅ via `sql/check-asaas-prod.mjs` — conta AZURIS, CNPJ 14645365000188, 196 customers |
| Teste end-to-end **PIX** R$ 9,50 (lote temporariamente R$ 10) | ✅ inscrição 8 — webhook `PAYMENT_RECEIVED` capturado em 7s |
| Teste end-to-end **Cartão** R$ 10,00 (lote R$ 10) | ✅ inscrição 9 — webhook `PAYMENT_CONFIRMED` capturado em 6s |
| Estornar ambos no painel Asaas | ✅ PIX confirmado, cartão disparado (refund webhook async) |
| Reverter lote pra R$ 550 + redeploy | ✅ último deploy: `p608i4mdu` |
| Memória atualizada (`project_lakehouse_checkout.md`) | ✅ |

### Diferenças observadas: sandbox vs produção

- **Sequência de eventos cartão:** sandbox às vezes envia `PAYMENT_CONFIRMED` + `PAYMENT_RECEIVED` separados. Produção (VISA 1x) enviou apenas `PAYMENT_CONFIRMED`. Handler já é idempotente, então não afeta.
- **Estorno de cartão é assíncrono na produção** — Asaas só dispara `PAYMENT_REFUNDED` quando confirma estorno com a adquirente (pode levar horas). Sandbox dispara na hora.
- **PIX dispara `PAYMENT_RECEIVED` direto** (sem `PAYMENT_CONFIRMED` antes) tanto em sandbox quanto em prod.

---

## 🚀 Estado atual

- **URL pública:** https://azuris.com.br/lakehouse-comunidade/inscricao
- **Lote ativo:** Lote 1 — 15 vagas, R$ 550 (PIX = R$ 522,50 com 5% off, cartão até 12x sem juros)
- **Lote 2 latente:** 20 vagas, R$ 750 (ativa automaticamente quando lote 1 esgotar)
- **Modo:** PRODUÇÃO real — qualquer inscrição daqui em diante é cobrança válida.

### Vercel envs ativas em production

```
ASAAS_API_KEY        — chave produção $aact_prod_...
ASAAS_BASE_URL       — https://www.asaas.com/api/v3
ASAAS_WEBHOOK_TOKEN  — 32 hex chars (mesmo do sandbox)
POSTGRES_URL         — Neon (via Vercel Storage)
```

Todas marcadas como sensitive → `vercel env pull` não baixa o valor.

---

## 🎯 Próxima sessão — Anúncio e monitoramento

### Imediato (você)

1. **Anunciar / divulgar.** Compartilhar:
   - `https://azuris.com.br/lakehouse-comunidade` (landing)
   - `https://azuris.com.br/lakehouse-comunidade/inscricao` (form direto)

2. **Adicionar UTM nas postagens** pra rastrear conversão por canal:
   - LinkedIn: `?utm_source=linkedin&utm_campaign=lakehouse-may26`
   - WhatsApp: `?utm_source=whatsapp&utm_campaign=lakehouse-may26`
   - Email: `?utm_source=newsletter&utm_campaign=lakehouse-may26`
   - UTMs são preservados no DB (colunas `utm_*`).

### Monitorar inscrições reais

```bash
# Webhooks chegando em tempo real
vercel logs https://azuris.com.br --follow | grep -E "Webhook|inscricao"
```

Consultar DB via Neon Console (Vercel → Storage → Open in Neon → SQL Editor):

```sql
-- Últimas 20 inscrições
SELECT id, nome, email, lote, billing_type, status, valor_centavos/100.0 as valor,
       created_at, paid_at
FROM inscricoes
ORDER BY created_at DESC
LIMIT 20;

-- Vagas por lote
SELECT * FROM v_vagas_por_lote;

-- Conversão pendente → pago (>4 dias = provavelmente não vai pagar)
SELECT id, nome, email, billing_type, status, created_at
FROM inscricoes
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '4 days';
```

### Receita estimada (taxas Asaas)

Sistema cobra **valor cheio do cliente em parcelado sem juros**. Taxa por parcela cresce com nº de parcelas (você banca).

| Forma de pagamento | Líquido estimado em R$ 550 |
|---|---:|
| PIX (5% off → R$ 522,50) | ~R$ 521 (taxa ~R$ 1,49) |
| Cartão 1x (R$ 550) | ~R$ 533 (taxa ~2,99% + R$ 0,49) |
| Cartão 2-6x (R$ 550 total) | ~R$ 530 (taxa ~3,49% + R$ 0,49) |
| Cartão 7-12x (R$ 550 total) | ~R$ 527 (taxa ~3,99% + R$ 0,49) |

Valores reais variam por plano Asaas — conferir em **Configurações → Tarifas** ou via campo `netValue` retornado pela API.

---

## ⚠️ Pontos de atenção

1. **Webhook `PAYMENT_REFUNDED` da inscrição 9** ainda vai chegar (estorno cartão async). Quando chegar, `inscricoes.status` da id 9 vira `refunded` sozinho.

2. **`canReceiveTransfer: false`** no `/myAccount`. Conta recebe pagamentos OK, mas pode precisar completar verificação no painel Asaas pra **sacar** pra conta bancária. Conferir antes do primeiro saque.

3. **Conta Asaas em produção tem 196 customers** vindos da era antiga. Não interfere — `findOrCreateCustomer` busca por CPF/CNPJ; se não achar, cria novo.

4. **Limite de vagas é tolerante a abandono:** inscrições `pending` ocupam vaga até virarem `cancelled` (via PAYMENT_DELETED) ou `overdue` (3 dias após vencimento PIX). Pra um cleanup proativo, considerar cron que cancela `pending` antigas no Asaas.

5. **Não rodar `vercel env pull` esperando ver `ASAAS_*` ou `POSTGRES_*`** — vêm vazias (sensitive). Pra testar local, criar `.env.<algo>.tmp` manual com os valores.

---

## 📋 Melhorias pendentes (não bloqueiam — pra próximas sessões)

- [ ] Email transacional com marca Azuris via **Resend** (hoje usa template padrão Asaas)
- [ ] Página de **área do aluno** com login (material entregue por email hoje)
- [ ] **Painel admin** simples pra ver inscrições sem abrir Neon Console
- [ ] **Rate limiting** no `/api/inscricao` (anti-bot)
- [ ] **Captcha** (Cloudflare Turnstile / hCaptcha) no form
- [ ] **Dashboard de conversão** (PostHog ou simples query SQL: form aberto → checkout iniciado → pago)
- [ ] Limpar fila pendente do webhook **sandbox** (não afeta prod, mas higiene)
- [ ] **Cancelar `pending` antigas** automaticamente (cron diário)

---

## Arquivos relevantes pra essa sessão

```
src/lib/asaas.ts                                    # wrapper API Asaas
src/lib/db.ts                                       # Neon + determinarLoteAtivo()
src/app/api/inscricao/route.ts                      # POST cria customer + payment + grava DB
src/app/api/webhook/asaas/route.ts                  # POST recebe eventos Asaas, idempotente
src/app/lakehouse-comunidade/inscricao/page.tsx     # form
src/app/lakehouse-comunidade/inscricao/InscricaoForm.tsx
src/app/lakehouse-comunidade/inscricao/obrigado/page.tsx
sql/inscricoes-schema.sql                           # tabela inscricoes + view v_vagas_por_lote
sql/check-asaas-prod.mjs                            # sanity check API key
.webhook-token.txt                                  # webhook token (gitignored)
```

---

Última revisão: **2026-05-25 21:00**.
