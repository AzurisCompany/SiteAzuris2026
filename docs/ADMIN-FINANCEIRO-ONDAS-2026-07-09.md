# Admin financeiro — Upgrade em 4 ondas (2026-07-09)

Documenta a leva de features entregue em 2026-07-09 sobre a área `/admin`, além do
suporte a **boleto e múltiplos meios** na cobrança avulsa. Complementa:

- [ADMIN-VENDAS-COBRANCA-INGRESSOS.md](./ADMIN-VENDAS-COBRANCA-INGRESSOS.md) — leva anterior (cobrança avulsa, tipos de ingresso, dashboard).
- [CHECKOUT-ASAAS-REPRODUCAO.md](./CHECKOUT-ASAAS-REPRODUCAO.md) — pipeline base do checkout (customer → payment → inscrição → webhook).

Tudo aqui **reusa** aquele pipeline. Commits: `43255a7` (upgrade financeiro) + `791d9cc` (Lakehouse evergreen, à parte).

> **Status:** commitado em `main`, **não deployado**. Verificado com `tsc` + `eslint` + `next build`.
> **Não** exercitado contra Asaas/banco reais. Ver [Passos de deploy](#passos-de-deploy-manuais) e [Checklist de teste](#checklist-de-teste).

---

## Índice

- [0. Boleto + múltiplos meios (cobrança avulsa)](#0-boleto--múltiplos-meios)
- [Onda 1 — Confiabilidade](#onda-1--confiabilidade)
- [Onda 2 — Operação da cobrança](#onda-2--operação-da-cobrança)
- [Onda 3 — Visão financeira](#onda-3--visão-financeira)
- [Onda 4 — NF via Asaas + Assinaturas](#onda-4--nf-via-asaas--assinaturas)
- [Modelo de dados (novo)](#modelo-de-dados-novo)
- [Rotas de API (novas)](#rotas-de-api-novas)
- [Config editável no admin](#config-editável-no-admin)
- [Endpoints Asaas usados](#endpoints-asaas-usados)
- [Passos de deploy (manuais)](#passos-de-deploy-manuais)
- [Checklist de teste](#checklist-de-teste)
- [Limitações e ressalvas](#limitações-e-ressalvas)

---

## 0. Boleto + múltiplos meios

Na **cobrança avulsa** (`/admin/cobranca`), o antigo radio "PIX / Cartão" virou **checkboxes**: PIX · Boleto · Cartão.

- **1 meio marcado** → método fixo. Cartão mantém o seletor de parcelas (juros pré-fixados via `lib/parcelamento.ts`).
- **2+ meios** → `billingType: UNDEFINED`: o cliente escolhe na fatura do Asaas. Sem juros pré-fixados; se pagar no cartão, o parcelamento segue as regras da conta Asaas.

**Limitação do Asaas:** a API de pagamento aceita **um** método OU `UNDEFINED` (todos os ativos na conta). **Não** existe subconjunto curado por cobrança — com 2+ meios, o cliente vê todos os meios ativos na conta, não só os marcados. A UI avisa isso.

- `src/lib/billing.ts` — `BillingType`, `labelBilling()`, opções de filtro (módulo **puro**, client-safe).
- `src/lib/db.ts` — `BillingType = 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED'`.
- `CobrancaForm.tsx` — checkboxes; deriva o `billing_type` (1=fixo, 2+=UNDEFINED); `router.refresh()` no sucesso.
- Coluna `inscricoes.billing_type` é `TEXT` **sem CHECK** → sem migração pra guardar BOLETO/UNDEFINED.

**Lista de cobranças:** `/admin/cobranca` agora mostra, abaixo do form, a tabela "Cobranças geradas" (`ListaCobrancas.tsx`) com status, fatura, WhatsApp e **sync por linha** (`SyncRowButton.tsx`). Atualiza sozinha ao gerar uma nova.

Labels de meio propagados em `/admin/vendas`, no detalhe e no filtro (Boleto, "Cliente escolhe").

---

## Onda 1 — Confiabilidade

### 1.1 Validação CPF/CNPJ com dígito verificador
`src/lib/validacao-doc.ts` — `cpfValido`, `cnpjValido`, `cpfCnpjValido` (algoritmo dos 2 DVs, rejeita repetidos).
Ligado nos **3 checkouts**: `api/admin/cobranca`, `api/dssbr-2026/inscricao`, `api/inscricao`. Antes só contava 11/14 dígitos.

### 1.2 Anti-duplicação de cobrança
`db.buscarCobrancaDuplicada({ curso_slug, cpf_cnpj, valor_centavos, tipo_ingresso?, janelaMin=10 })`.
Procura uma cobrança idêntica **já criada** (com `asaas_payment_id`, não cancelada) na janela. Os 3 fluxos, antes de criar, chamam e — se achar — **devolvem a fatura existente** (`duplicada: true`) em vez de criar outra. Barra clique/submit duplicado (2 faturas / 2 reservas de vaga).

### 1.3 Conciliação automática diária (cron)
`GET /api/cron/reconciliar` — chama `sincronizarTodas(true)` (só não-finais: pending/overdue). Rede de segurança pra webhook perdido.
- Protegido: exige header `Authorization: Bearer ${CRON_SECRET}`. **Sem `CRON_SECRET` seteado, responde 500 de propósito** (não deixa endpoint aberto).
- `vercel.json` → cron `0 6 * * *` (06h UTC = 03h BRT). Hobby plan = 1×/dia.

### 1.4 Painel de Saúde/Reconciliação
`/admin/saude` (nav "Saúde"), `db.diagnosticoSaude()`. Cartões que ficam verdes quando zerados:
- **Pendentes já vencidos** (`due_date < hoje`, ainda pending) — webhook provável perdido → botão sync por linha.
- **Pendentes há +7 dias**.
- **Sem cobrança gerada** (`asaas_payment_id` nulo, não cancelada).
- **Possíveis duplicatas** (mesmo doc+produto+valor, 2+ linhas vivas).
- **Eventos órfãos** (`asaas_eventos` sem inscrição correspondente).
- Rodapé: **última conciliação** (`MAX(last_synced_at)`).

---

## Onda 2 — Operação da cobrança

Editar cobrança **pendente/vencida** + reenviar link, no detalhe da venda (`/admin/vendas/[id]`, bloco "Ações da cobrança", `AcoesCobranca.tsx`).

- `asaas.updatePayment(paymentId, { valueReais?, dueDate? })` → `PUT /payments/{id}`.
- `POST /api/admin/cobranca/atualizar` `{ id, due_date?, valor_reais? }`.
- `db.atualizarCobrancaEditada(id, {...})` reconcilia valor/líquido/taxa/vencimento a partir da resposta.
- **Guarda-corpos:** só `pending`/`overdue`; vencimento não pode ser passado; valor respeita mínimo R$5; **valor não editável em cobrança parcelada** (manda cancelar e refazer).
- **Reenviar:** botão WhatsApp com mensagem pronta + copiar link/mensagem.

---

## Onda 3 — Visão financeira

Página única `/admin/financeiro` (nav "Financeiro"), 3 seções + config.

1. **A receber por vencimento** — `db`/`admin-queries.recebiveisPorVencimento()`. Buckets: vencido · vence hoje · próx. 7 dias · próx. 30 dias · depois · sem vencimento. Card "Vencido" acende laranja.
2. **Vendas pagas — últimos 30 dias** — `vendasPorDia(30)` (por `pago_em`/`paid_at`). Gráfico de barras **SVG server-side** (`GraficoVendas.tsx`): série única emerald, tooltip nativo `<title>`, sem JS de cliente. + **barra de progresso da meta** do mês corrente.
3. **Fechamento mensal / DRE** — `faturamentoMensal(12)` (por competência de pagamento). Colunas: bruto − taxa Asaas − **imposto estimado** (`bruto × alíquota`) = **líquido pós-imposto**.

**Config editável** (sem env var, sem redeploy): `ConfigNumero` (meta em R$, alíquota em %) e `ConfigTexto` (descrição do serviço da NF). Gravam na tabela `config_financeiro` via `POST /api/admin/config`.

---

## Onda 4 — NF via Asaas + Assinaturas

### 4.1 Nota Fiscal (NFS-e via Asaas)
No detalhe de venda **paga** (`/admin/vendas/[id]`, bloco "Nota Fiscal", `NotaFiscal.tsx`):
- **Emitir** → `POST /invoices` (agenda a NFS-e), guarda `nf_id/status/número/pdf/xml` na inscrição.
- **Sincronizar** → puxa o estado atual (ou acha uma NF emitida direto no painel Asaas).
- **Cancelar** → cancela no Asaas.
- Erros do Asaas propagados crus (ex.: falta de config fiscal fica óbvia).

Helpers: `asaas.createInvoice / getInvoice / getInvoicesByPayment / cancelInvoice`. Persistência: `db.atualizarNf()`. Rota: `POST /api/admin/nf { id, action: 'emitir'|'sincronizar'|'cancelar' }`.
Descrição do serviço (+ cód/nome do serviço municipal, se o município exigir) vem de `config_financeiro`, editável em `/admin/financeiro`.

**Requer config fiscal NA CONTA Asaas** (inscrição municipal, serviço/CNAE, regime). Sem isso o Asaas rejeita a emissão.

### 4.2 Assinaturas (cobrança recorrente genérica)
`/admin/assinaturas` (nav "Assinaturas"). Cria assinatura pra **qualquer** cliente: valor + frequência + meio. Não amarra produto.
- Meios: **PIX / Boleto / Cliente escolhe** (cartão fora — exige tokenização).
- Frequências: mensal / trimestral / semestral / anual / semanal / quinzenal.
- `asaas.createSubscription / getSubscription / cancelSubscription`. Rota: `POST /api/admin/assinatura { action:'criar'|'cancelar', ... }`.
- Tabela `assinaturas` guarda o cadastro; `nextDueDate` = hoje+3.

**Materialização de ciclos:** o webhook (`/api/webhook/asaas`), ao receber um pagamento com `subscription`, chama `db.materializarCicloAssinatura(payment)` — insere (idempotente por `asaas_payment_id`) uma `inscricoes` com `curso_slug='assinatura'`. Assim **cada mês cobrado vira uma venda** e aparece em Vendas/Financeiro. O status real é ajustado logo depois pelo fluxo normal do webhook.

---

## Modelo de dados (novo)

Migração aditiva idempotente em `POST /api/admin/migrate` (espelhada em `sql/admin-migration.sql`).

**Colunas novas em `inscricoes`:**
```
nf_id TEXT · nf_status TEXT · nf_numero TEXT · nf_pdf_url TEXT · nf_xml_url TEXT
```

**Tabela `config_financeiro`** — chave/valor (texto), editável no admin:
```
chave TEXT PK · valor TEXT · updated_at TIMESTAMPTZ
```

**Tabela `assinaturas`:**
```
id · asaas_subscription_id (UNIQUE) · asaas_customer_id · nome · email · cpf_cnpj · telefone
billing_type · valor_centavos · cycle · descricao · status (active|cancelled) · is_teste · created_at · updated_at
```

Os ciclos cobrados **não** ficam em `assinaturas` — viram linhas em `inscricoes` (`curso_slug='assinatura'`).

---

## Rotas de API (novas)

| Rota | Método | O quê |
|---|---|---|
| `/api/cron/reconciliar` | GET | conciliação diária (Bearer CRON_SECRET) |
| `/api/admin/cobranca/atualizar` | POST | editar vencimento/valor de fatura pendente |
| `/api/admin/config` | POST | salvar meta / alíquota / config NF |
| `/api/admin/nf` | POST | emitir / sincronizar / cancelar NFS-e |
| `/api/admin/assinatura` | POST | criar / cancelar assinatura |

Todas (menos o cron) protegidas por `estaLogado()`. Páginas novas: `/admin/saude`, `/admin/financeiro`, `/admin/assinaturas`.

---

## Config editável no admin

Chaves de `config_financeiro` (setáveis em `/admin/financeiro`):

| Chave | Formato | Uso |
|---|---|---|
| `meta_mensal_centavos` | inteiro (centavos) | barra de progresso da meta |
| `aliquota_imposto_pct` | % (2 casas) | coluna de imposto no DRE |
| `nf_servico_descricao` | texto | descrição do serviço na NFS-e |
| `nf_municipal_service_code` | texto (opcional) | cód. serviço municipal |
| `nf_municipal_service_name` | texto (opcional) | nome serviço municipal |

---

## Endpoints Asaas usados

| Endpoint | Onde |
|---|---|
| `POST /customers`, `GET /customers?cpfCnpj` | findOrCreateCustomer |
| `POST /payments`, `GET /payments/{id}`, `PUT /payments/{id}` | criar / sincronizar / **editar** cobrança |
| `POST /invoices`, `GET /invoices?payment`, `GET /invoices/{id}`, `POST /invoices/{id}/cancel` | **NF** |
| `POST /subscriptions`, `GET /subscriptions/{id}`, `DELETE /subscriptions/{id}` | **assinaturas** |

Base URL e API key via `ASAAS_BASE_URL` / `ASAAS_API_KEY` (sandbox por padrão).

---

## Passos de deploy (manuais)

Na ordem:

1. **Push / deploy** (Vercel CLI).
2. **`POST /api/admin/migrate`** (logado no admin) → cria `config_financeiro`, `assinaturas` e colunas `nf_*`. Aditivo, idempotente, com snapshot de integridade (`GET /api/admin/migrate` dá baseline).
3. **`CRON_SECRET`** nas env vars da Vercel (valor secreto qualquer). Sem ele a conciliação diária responde 500.
4. Em `/admin/financeiro`: setar **meta**, **alíquota** e **descrição do serviço da NF**.
5. Na **conta Asaas**: preencher **dados fiscais** (inscrição municipal, serviço, regime) pra NF emitir.

---

## Checklist de teste

Rode em **sandbox** antes de valer. (Não foi exercitado nesta entrega.)

- [ ] Cobrança avulsa com 1 meio (PIX/Boleto/Cartão) e com 2+ meios (UNDEFINED) — fatura abre certa.
- [ ] Gerar 2 cobranças idênticas seguidas → a 2ª devolve a **mesma** fatura (anti-duplicação).
- [ ] CPF inválido é barrado no checkout.
- [ ] `GET /api/cron/reconciliar` com `Authorization: Bearer <CRON_SECRET>` retorna `{ ok, sincronizadas, total }`.
- [ ] `/admin/saude` lista as anomalias esperadas.
- [ ] Editar vencimento/valor de uma cobrança pendente → reflete no Asaas e no banco.
- [ ] `/admin/financeiro`: recebíveis, gráfico, meta e DRE batem; salvar meta/alíquota persiste.
- [ ] Emitir 1 NF de venda paga → status/PDF aparecem; sincronizar/cancelar funcionam.
- [ ] Criar 1 assinatura de teste → 1º ciclo materializa como venda "Assinatura"; cancelar para os ciclos.

---

## Limitações e ressalvas

- **Meios curados por cobrança:** impossível no Asaas (é 1 método OU todos). 2+ = todos os ativos na conta.
- **NF:** depende 100% da config fiscal **na conta Asaas**. O código só dispara/consulta.
- **Recorrência:** sem cartão (falta tokenização). Ciclos aparecem só **após** o webhook de cada pagamento.
- **Login admin:** ainda senha única, sem rate-limit nem log de auditoria de ações — **não** foi endurecido (estava fora do escopo selecionado). Recomendado pra uma próxima leva.
- **Export CSV:** não incluído (o fechamento mensal/DRE é on-screen). Recomendado junto do login hardening.
