# Integração Asaas — especificação completa para reimplementação

> **Objetivo:** dar a outra LLM (ou dev) tudo que precisa pra reimplementar a integração de
> pagamentos com o **Asaas** do zero: chaves, configurações do painel, endpoints, contratos,
> fluxos e armadilhas. Documento derivado da implementação em produção do site Azuris
> (Next.js 16, App Router, Node runtime, banco Neon/Postgres, deploy Vercel).
>
> ⚠️ **Segredos NÃO estão aqui.** Só nomes, formatos e onde vivem. Os valores reais moram nas
> **env vars do Vercel** (produção) e nos `.env*` locais (dev). Pegue as chaves no painel Asaas:
> `Configurações → Integrações → API` (produção e sandbox têm chaves distintas).

---

## 1. Visão geral da arquitetura

```
Cliente (checkout na nossa UI)
   │  seleciona PIX / cartão (com nº de parcelas) / boleto
   ▼
POST /api/inscricao  (ou /api/dssbr-2026/inscricao, ou /api/admin/cobranca)
   │  valida → deriva preço → criarCobranca()  [pipeline único]
   ▼
lib/cobranca-pipeline.ts
   1) anti-duplicação (fatura idêntica recente → devolve a existente)
   2) grava inscrição 'pending' no banco ANTES do Asaas (garante lead/vaga)
   3) findOrCreateCustomer + createPayment no Asaas
   4) vincularAsaas (grava payment_id, invoice_url, líquido/taxa)
   ▼
Cliente paga no invoiceUrl (checkout hospedado do Asaas)
   ▼
Asaas → POST /api/webhook/asaas   (idempotente, valida token)
   │  event → status; consolida líquido/taxa; materializa ciclo de assinatura
   ▼
banco atualizado (status='paid', pago_em, valor_liquido_centavos)

Redes de segurança:
 - Cron diário GET /api/cron/reconciliar → puxa estado real de cobranças não-finais
 - /admin/saude → diagnóstico + reconciliação de caixa (saldo Asaas × banco)
```

**Princípio central:** o banco é a fonte da verdade do *negócio* (leads, vagas, receita
reconhecida); o Asaas é a fonte da verdade do *dinheiro*. Eles reconciliam por webhook + cron.

---

## 2. Variáveis de ambiente

| Variável | Onde | Formato / exemplo (redigido) | Para quê |
|---|---|---|---|
| `ASAAS_API_KEY` | Vercel (prod) · `.env.sandbox` (dev) | `$aact_...` (string longa; **prod e sandbox diferentes**) | Autentica todas as chamadas à API. Enviada no header `access_token`. |
| `ASAAS_BASE_URL` | Vercel · `.env.sandbox` | prod: `https://api.asaas.com/v3` · sandbox: `https://sandbox.asaas.com/api/v3` | Alterna produção ↔ sandbox **só pela URL**. Default no código = sandbox. |
| `ASAAS_WEBHOOK_TOKEN` | Vercel · `.env.sandbox` | string aleatória (~49 chars) que **você define** e cadastra no painel Asaas | Segredo compartilhado. Chega no header `asaas-access-token`; a rota rejeita se não bater. |
| `CRON_SECRET` | Vercel | string aleatória | O Vercel Cron injeta `Authorization: Bearer <CRON_SECRET>`. A rota do cron exige. |
| `DATABASE_URL` / `POSTGRES_URL` | Vercel · `.env.local` | `postgresql://…` (Neon; pooled e unpooled) | Banco. **Dev local aponta pra um banco de TESTE, não o de prod.** |
| `ADMIN_PASSWORD` | Vercel · `.env.local` | string | Senha única do `/admin`. |
| `ADMIN_SESSION_SECRET` | Vercel · `.env.local` | string aleatória | Assina o cookie de sessão do admin. |

**Contrato do código** (`lib/asaas.ts`):
```ts
const BASE_URL = process.env.ASAAS_BASE_URL ?? 'https://sandbox.asaas.com/api/v3'
const API_KEY  = process.env.ASAAS_API_KEY   // sem ela → 401 do Asaas → 502 nas rotas
```
> **Sandbox × produção é só a URL + a chave.** Nunca misture: chave de prod só funciona com
> `api.asaas.com`, chave de sandbox só com `sandbox.asaas.com`. Um `asaas_payment_id` criado
> no sandbox **não existe** em prod (causa clássica de erro de conciliação).

---

## 3. Configuração no painel Asaas (fora do código)

Sem isso o código roda mas o fluxo não fecha:

1. **Chave de API** — `Configurações → Integrações → API`. Copie a de produção pro Vercel e a
   de sandbox pro `.env.sandbox`.
2. **Webhook** — `Configurações → Integrações → Notificações/Webhooks`:
   - URL: `https://SEU_DOMINIO/api/webhook/asaas`
   - Token de autenticação: o mesmo valor de `ASAAS_WEBHOOK_TOKEN` (o Asaas envia no header
     `asaas-access-token`).
   - Eventos: habilite ao menos `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`,
     `PAYMENT_DELETED`, `PAYMENT_REFUNDED`, `PAYMENT_CHARGEBACK_REQUESTED`. Habilitar todos é ok
     (os não mapeados viram `noop` com 200).
   - Fila: mantenha "reenviar em caso de falha" (o webhook é idempotente).
3. **Configuração fiscal (só se for emitir NFS-e)** — `Configurações → Notas Fiscais`: inscrição
   municipal, código/descrição do serviço, regime tributário, certificado. Sem isso `POST /invoices`
   retorna erro.
4. **Antecipação de recebíveis (opcional)** — `Financeiro → Antecipação`. Cartão parcelado cai
   parcela a parcela (D+30 por parcela); a antecipação adianta o caixa (com deságio). Passa por
   aprovação do Asaas. **Isso muda o SALDO mas não a receita reconhecida** — ver §9.

---

## 4. Cliente HTTP (`lib/asaas.ts`)

Um único `asaasFetch` centraliza base URL, auth e tratamento de erro:

```ts
async function asaasFetch(path: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      access_token: API_KEY ?? '',          // ← auth do Asaas é header 'access_token'
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Asaas ${res.status} ${path}: ${text}`)  // falha ALTO
  return text ? JSON.parse(text) : {}
}
```

**Validação de boundary:** o Asaas é externo — não confie no shape. Guards (`reqStr`) **lançam**
se um campo obrigatório (ex.: `id`, `invoiceUrl`) vier ausente, em vez de gravar `undefined` no
banco. Toda função de escrita valida antes de persistir o vínculo.

**Seam de teste:** `__setAsaasFetch(fakeFetch)` injeta um fetch fake nos testes (DIP), sem tocar
nas rotas.

---

## 5. Modelo de dados (Postgres)

### Tabela `inscricoes` (uma linha por cobrança/venda)
```
id                SERIAL PK
curso_slug        TEXT      -- 'lakehouse-comunidade' | 'dss-2026' | 'proposta' | 'assinatura' | ...
lote              TEXT      -- 'lote1' | 'lote2' (controle de vagas; produtos sem lote usam fixo)
tipo_ingresso     TEXT NULL -- variante do produto (ver tabela tipos_ingresso)

-- aluno
nome, email, cpf_cnpj (só dígitos), telefone
empresa, cargo, pessoa_tipo ('PF'|'PJ'), razao_social, nf_endereco (JSONB)
como_conheceu, consentimento_lgpd (bool), consentimento_em

-- pagamento
billing_type      TEXT      -- 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED'
valor_centavos    INTEGER   -- valor cobrado (já com desconto PIX / acréscimo cartão)
installments      INTEGER   -- 1 = à vista; 2..5 = parcelado com juros
status            TEXT      -- pending | paid | overdue | cancelled | refunded

-- vínculo Asaas
asaas_customer_id TEXT
asaas_payment_id  TEXT UNIQUE   -- chave de idempotência do webhook/sync
asaas_invoice_url TEXT          -- URL do checkout hospedado (pra onde mandamos o cliente)

-- financeiro consolidado (vem do Asaas)
valor_liquido_centavos INTEGER  -- netValue*100 (após taxa do Asaas)
taxa_centavos          INTEGER  -- value - netValue
due_date               DATE
asaas_status           TEXT     -- status cru do Asaas (RECEIVED, CONFIRMED, OVERDUE…)
pago_em                TIMESTAMPTZ  -- data real do pagamento (clientPaymentDate)
paid_at                TIMESTAMPTZ  -- quando marcamos pago
last_synced_at         TIMESTAMPTZ

-- nota fiscal (NFS-e via Asaas)
nf_id, nf_status, nf_numero, nf_pdf_url, nf_xml_url

-- tracking
utm_source/medium/campaign/content/term
is_teste           BOOLEAN   -- esconde teste/sandbox dos KPIs sem apagar
created_at, updated_at
```

### Tabelas de apoio
- **`asaas_eventos`** — auditoria: todo webhook cru (`asaas_payment_id, event, payload JSONB, received_at`). Serve pra detectar "eventos órfãos" (pagamento sem inscrição).
- **`tipos_ingresso`** — catálogo de variantes por produto (preço base, âncora "de", `pix_desconto_pct`, `cartao_acrescimo_pct`, `max_parcelas`, `ativo`, `ordem`). O checkout lê os ativos; se não houver, cai no preço fixo de `lib/produtos.ts`.
- **`config_financeiro`** — chave/valor (meta mensal, alíquota de imposto, descrição-NF).
- **`assinaturas`** — cobrança recorrente (`asaas_subscription_id`, `cycle`, `status`). Cada ciclo cobrado é materializado como uma linha em `inscricoes` (`curso_slug='assinatura'`).

---

## 6. Fluxos

### 6.1 Cliente (`findOrCreateCustomer`)
Procura por CPF/CNPJ (`GET /customers?cpfCnpj=`); se existir, reusa; senão cria
(`POST /customers`). **Sempre reusar por documento** evita duplicar cliente e "comer vaga" de novo.

**O cadastro do cliente é o que emite a nota.** A NFS-e (`POST /invoices`) NÃO recebe
endereço: o Asaas monta a nota a partir do cadastro do cliente. Por isso mandamos aqui
o endereço do tomador e a razão social — sem isso a nota não sai, por mais completo que
esteja o nosso `nf_endereco`. Mapa dos campos (de [[checkout-extras]] `enderecoParaAsaas`):

| nosso        | Asaas          |
|--------------|----------------|
| cep          | `postalCode`   |
| logradouro   | `address`      |
| numero       | `addressNumber`|
| complemento  | `complement`   |
| bairro       | `province`     |
| razao_social | `company` + `name` (PJ) |

`cidade`/`uf` ficam de fora de propósito — o Asaas resolve as duas pelo `postalCode`.

Cliente **reusado** com endereço novo é atualizado via `PUT /customers/{id}` (patch parcial,
só os campos com valor). Sem isso, quem já comprou antes ficaria preso ao cadastro incompleto
da primeira compra e a nota nunca sairia. Falha nesse PUT é logada e engolida: cadastro é
acessório, cobrança é o negócio — um não derruba o outro.

### 6.2 Criar cobrança (`createPayment`, `POST /payments`)
```ts
billingType ∈ 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED'  // UNDEFINED = cliente escolhe no checkout
```
- **PIX / BOLETO / UNDEFINED:** manda `value` (à vista).
- **CREDIT_CARD parcelado (`installmentCount > 1`):** manda `installmentCount` + `installmentValue`
  (**não** `value`). O Asaas cria um **parcelamento** (`installment`) que agrupa N pagamentos.
- Retorno essencial: `{ id, invoiceUrl, value, netValue, status, dueDate }`. Mandamos o cliente
  pro `invoiceUrl`.

### 6.3 Parcelamento com juros (`lib/parcelamento.ts`)
O checkout hospedado do Asaas **não** mostra seletor de parcelas numa cobrança avulsa, então o
seletor fica na **nossa** UI e **pré-fixamos** o valor de cada parcela (juros embutido):
```ts
MAX_PARCELAS = 5
TAXA_JUROS_AM = 0.0299   // 2,99% a.m. — AJUSTE se a taxa do Asaas mudar
// Tabela Price:
valorParcela(total, n) = n<=1 ? total : (total*i) / (1 - (1+i)^-n)
```
Regra de negócio: **1x = à vista sem juros; 2x–5x = com juros do cliente.** PIX = desconto à vista.

### 6.4 Pipeline de criação (`lib/cobranca-pipeline.ts`) — usado pelos 3 checkouts
1. **Anti-duplicação:** `buscarCobrancaDuplicada` — fatura idêntica recente (mesmo doc/produto/valor com `asaas_invoice_url`) → devolve a existente, não cria outra.
2. **Inscrição 'pending' ANTES do Asaas** — garante o lead/vaga mesmo se a cobrança falhar.
3. **`findOrCreateCustomer` + `createPayment`.** Se o Asaas falhar → `cancelarInscricao` (preserva o lead, libera a vaga) e retorna `erro_asaas`.
4. **`vincularAsaas`** grava `payment_id`, `invoice_url`, `netValue`/`taxa`/`dueDate`. Não-fatal: se falhar, webhook/cron reconciliam.

Resultados possíveis: `duplicada | criada | erro_db | erro_asaas`.

### 6.5 Webhook (`POST /api/webhook/asaas`) — a consolidação real
```ts
// 1. valida header 'asaas-access-token' === ASAAS_WEBHOOK_TOKEN (senão 401)
// 2. registrarEvento (auditoria crua, não bloqueia)
// 3. se payload.payment.subscription → materializarCicloAssinatura (idempotente)
// 4. mapeia event → status:
EVENT_TO_STATUS = {
  PAYMENT_CONFIRMED: 'paid',   PAYMENT_RECEIVED: 'paid',
  PAYMENT_OVERDUE: 'overdue',  PAYMENT_DELETED: 'cancelled',
  PAYMENT_REFUNDED: 'refunded', PAYMENT_CHARGEBACK_REQUESTED: 'refunded',
}
// eventos não mapeados → 200 noop (Asaas não reenvia)
// 5. atualizarStatusPorAsaasId(paymentId, status, paidAt)  ← idempotente pela chave asaas_payment_id
// 6. atualizarFinanceiroPorAsaasId → consolida netValue/taxa/dueDate/asaas_status
// 7. sempre responde 200 (mesmo 'not_found') pra Asaas não martelar reenvio
```
**Idempotência:** chave = `asaas_payment_id` (UNIQUE). Reprocessar o mesmo evento é seguro.
**Ordem:** o webhook pode chegar antes da inscrição existir (raro) → loga `not_found` e 200; o
cron corrige depois.

### 6.6 Reconciliação (redes de segurança)
- **Sync de uma cobrança** (`lib/asaas-sync.ts::sincronizarInscricao`): `getPayment(id)` →
  `mapAsaasStatus` → `consolidarAsaas`. Botão no detalhe da venda + backfill.
- **Cron diário** (`GET /api/cron/reconciliar`, `vercel.json`: `0 6 * * *`): `sincronizarTodas(true)`
  re-puxa as **não-finais** (`pending`/`overdue`) e as pagas sem taxa consolidada. Exige
  `Authorization: Bearer <CRON_SECRET>`.
- **Painel `/admin/saude`**: diagnóstico (pendentes vencidos, sem cobrança, duplicatas, eventos
  órfãos) + **reconciliação de caixa** (§9).

### 6.7 Nota Fiscal (NFS-e) — `lib/asaas.ts` + `/invoices`
`createInvoice` (`POST /invoices`) agenda a NF vinculada a um `paymentId`. Depende da config fiscal
no painel. `getInvoicesByPayment`, `getInvoice`, `cancelInvoice` (`POST /invoices/{id}/cancel`).
Status: `SCHEDULED | SYNCHRONIZED | AUTHORIZED | CANCELED | ERROR…`. Persistidos em `inscricoes.nf_*`.

### 6.8 Assinaturas (recorrência) — `/subscriptions`
`createSubscription` (`POST /subscriptions`, com `cycle` MONTHLY/…). Cada ciclo cobrado gera um
`payment` com `subscription` preenchido; o webhook **materializa** esse ciclo como uma linha
`inscricoes` (`curso_slug='assinatura'`). `getSubscription`, `cancelSubscription` (DELETE).

---

## 7. Referência de endpoints usados

| Função | Método + path | Observação |
|---|---|---|
| `findOrCreateCustomer` | `GET /customers?cpfCnpj=` / `POST /customers` | reusa por documento |
| `createPayment` | `POST /payments` | PIX/BOLETO usam `value`; cartão parcelado usa `installmentCount`+`installmentValue` |
| `updatePayment` | `PUT /payments/{id}` | só valor/vencimento/descrição de **não-paga** |
| `getPayment` | `GET /payments/{id}` | detalhe + `installment` (id do parcelamento) |
| `deletePayment` | `DELETE /payments/{id}` | cobrança simples não-paga |
| `deleteInstallment` | `DELETE /installments/{id}` | apaga o parcelamento **inteiro** (todas as parcelas) |
| `getBalance` | `GET /finance/balance` | `{ balance }` em reais |
| `getFinanceTransactions` | `GET /financialTransactions?limit=&offset=&order=desc` | extrato; `value` sinalizado |
| `createInvoice` / `getInvoice` / `cancelInvoice` | `POST /invoices` · `GET /invoices/{id}` · `POST /invoices/{id}/cancel` | NFS-e |
| `getInvoicesByPayment` | `GET /invoices?payment={id}` | |
| `createSubscription` / `getSubscription` / `cancelSubscription` | `POST/GET/DELETE /subscriptions[/{id}]` | recorrência |

**Auth:** header `access_token: <ASAAS_API_KEY>` em tudo. **Webhook:** header `asaas-access-token`.

---

## 8. Convenções de dinheiro e datas

- **Tudo em centavos (INTEGER)** no banco. Asaas fala em **reais (float)** → converta com
  `Math.round(reais * 100)` na entrada e `/100` na saída. Nunca faça aritmética de dinheiro em float.
- **`netValue`** = líquido após taxa do Asaas. **`taxa` = `value − netValue`.** O líquido só é
  confiável **após** o pagamento (na criação pode vir estimado ou ausente → COALESCE preserva).
- **Fronteiras de dia em BRT.** A sessão do Neon é UTC; usar `CURRENT_DATE` erraria à noite. Use
  `(NOW() AT TIME ZONE 'America/Sao_Paulo')::date`. Vale pra recebíveis, DRE, séries diárias.
- Funções puras de dinheiro têm testes (Vitest, `lib/__tests__/`). Mantenha-os.

---

## 9. Reconciliação de caixa (saldo Asaas × receita do banco)

**São métricas diferentes — divergir é o esperado, não é bug:**
- **Saldo disponível** (`GET /finance/balance`) = caixa pra saque *agora*. Embute saques (−),
  antecipações (+) e taxas.
- **"Líquido recebido"** (banco) = `Σ valor_liquido_centavos WHERE status='paid'` = receita líquida
  *acumulada* de vendas confirmadas.

**Ponte:** `Saldo = Σ(pagamentos liberados líq.) + Σ(antecipações creditadas) − Σ(saques) − taxas`.
O que reconcilia com o "líquido recebido" **não é o saldo**, é o total *recebido* do **Extrato**
(`GET /financialTransactions`). O painel `/admin/saude` mostra os dois lado a lado + o extrato
agrupado por tipo (Recebimentos / Antecipações / Taxas / Saques / Estornos) — ver
`lib/reconciliacao.ts`.

Direção típica: saldo **>** líquido → antecipação de parcelas futuras e/ou webhook perdido;
saldo **<** líquido → cartão CONFIRMED ainda não liberado (D+30) e/ou saques.

---

## 10. Armadilhas (aprendidas em produção)

1. **Sandbox ≠ produção.** Chave + URL têm que casar. Um `asaas_payment_id` de sandbox some em
   prod → `getPayment` 404 → conta como "erro de conciliação". Marque essas linhas `is_teste`.
2. **`PAYMENT_CONFIRMED` vs `PAYMENT_RECEIVED`.** Ambos viram `'paid'` aqui. Mas *confirmed* (cartão
   autorizado) ≠ *received* (dinheiro liberado). Cartão confirmado entra no "líquido recebido" antes
   de estar no saldo. Se você precisar separar "reconhecido" de "em caixa", trate-os diferente.
3. **Parcelado de cartão cai parcela a parcela.** Cada parcela é um `payment` com id próprio,
   agrupado por `installment`. O webhook casa pela cobrança-mãe; parcelas 2..N com id novo podem não
   casar com nenhuma inscrição. Considere isso ao reconciliar receita de parcelado.
4. **Cancelar parcelado:** use `DELETE /installments/{id}`, não `DELETE /payments/{id}` (esse só
   apaga uma parcela). Trocar o meio de pagamento = **cancela + regera** (o Asaas não converte
   `billingType` de uma cobrança existente).
5. **Webhook fora de ordem / duplicado:** idempotência via `asaas_payment_id` UNIQUE resolve.
   **Sempre responda 200** (mesmo quando não achou a inscrição) pra evitar tempestade de reenvio.
6. **Nunca deixe `undefined` do Asaas virar vínculo.** Valide o shape (guards que lançam) antes de
   gravar. Um vínculo com id nulo quebra o webhook silenciosamente.
7. **`getFinanceTransactions` usa `order=desc`** (assumido). Confirme contra a sua conta que o
   extrato vem do mais novo pro mais velho; se o default for asc, pagine pelo fim.
8. **Banco de dev ≠ banco de prod.** Não valide números de venda com query local.

---

## 11. Checklist de reimplementação

- [ ] Criar conta Asaas; pegar chaves de **sandbox** e **produção** (`Integrações → API`).
- [ ] Env vars: `ASAAS_API_KEY`, `ASAAS_BASE_URL`, `ASAAS_WEBHOOK_TOKEN`, `CRON_SECRET`, `DATABASE_URL`.
- [ ] Cliente `asaasFetch` (header `access_token`, falha alto, cache no-store) + guards de boundary.
- [ ] Schema: `inscricoes` (+ `asaas_payment_id UNIQUE`), `asaas_eventos`, e o resto conforme features.
- [ ] `findOrCreateCustomer` (reusa por CPF/CNPJ).
- [ ] `createPayment` (PIX/boleto = `value`; cartão parcelado = `installmentCount`+`installmentValue`).
- [ ] Parcelamento Price com juros na sua UI (o checkout hospedado não parcela cobrança avulsa).
- [ ] Pipeline: dedup → pending → customer+payment → vínculo → rollback no erro.
- [ ] Webhook: valida token, `event→status`, consolida `netValue`/taxa, idempotente, 200 sempre.
- [ ] Cadastrar o webhook no painel (URL + token + eventos).
- [ ] Cron diário de reconciliação (`sincronizarTodas` das não-finais) + `Bearer CRON_SECRET`.
- [ ] (Opcional) NFS-e: config fiscal no painel + `POST /invoices`.
- [ ] (Opcional) Assinaturas: `POST /subscriptions` + materialização de ciclo no webhook.
- [ ] (Opcional) Reconciliação de caixa: `getBalance` + `getFinanceTransactions` num painel.
- [ ] Testes das funções puras de dinheiro (parcelamento, líquido/taxa, fronteiras BRT).
- [ ] Testar em **sandbox** ponta a ponta (PIX pago, cartão parcelado, webhook, refund) antes de prod.

---

## 12. Arquivos-fonte de referência

| Arquivo | Papel |
|---|---|
| `src/lib/asaas.ts` | cliente HTTP + todas as chamadas (customer, payment, installment, balance, extrato, invoice, subscription) + tipos de evento |
| `src/lib/cobranca-pipeline.ts` | orquestrador comum dos checkouts (dedup → pending → Asaas → vínculo → rollback) |
| `src/lib/parcelamento.ts` | tabela Price / juros do cartão |
| `src/lib/asaas-sync.ts` | reconciliação de uma/todas cobranças (`getPayment` → banco) |
| `src/lib/reconciliacao.ts` | saldo × líquido + extrato agrupado |
| `src/lib/db.ts` | escrita/leitura no Postgres (vincularAsaas, atualizarStatus…, materializarCicloAssinatura) |
| `src/app/api/webhook/asaas/route.ts` | recebe eventos do Asaas |
| `src/app/api/cron/reconciliar/route.ts` | cron diário |
| `src/app/api/inscricao/route.ts` · `api/dssbr-2026/inscricao/route.ts` · `api/admin/cobranca/route.ts` | os 3 checkouts |
| `sql/inscricoes-schema.sql` · `sql/admin-migration.sql` | schema completo |
| `docs/CHECKOUT-ASAAS-REPRODUCAO.md` | guia de reprodução do checkout (complementar) |

---

*Gerado a partir da implementação em produção (azuris.com.br). Ajuste nomes de produto/slug e a
taxa de juros conforme o seu caso.*
