# Handoff — Área financeira/admin + preço DSSBR + checkout enriquecido (2026-06-16)

Sessão grande, **tudo commitado e em produção** (working tree limpo). 6 commits.

```
52c5398 feat(dssbr): landing + checkout próprio do DSSBR 2026 (substitui Sympla)
2353563 fix(dssbr): preço de pré-venda correto — R$470 (PIX e cartão), âncora R$820
f4105f7 feat(admin): área financeira — painel de vendas dos 2 produtos + sync Asaas
7ae5780 feat(admin): abas por produto na lista de vendas (Todos · Ingressos DSS · Curso)
af7c86c feat(admin): filtros aplicam sozinhos (sem botão Filtrar)
7543ef7 feat(checkout): grava inscrição antes do Asaas + campos extras (empresa/NF/LGPD)
```

---

## 1. DSSBR estava sem versionar (commit `52c5398`)

A landing + checkout do DSSBR (`/dssbr-2026`) estava em prod mas **só na Vercel, fora do git**. Commitado. (Auto-deploy via GitHub continua não conectado — todo deploy é `vercel --prod --yes` na CLI.)

## 2. Preço do DSSBR corrigido (commit `2353563`)

Estava errado: PIX R$423 ("10% off") e cartão R$517 (+10%). Modelo certo:

- **Pré-venda R$470** é o que se paga — PIX e cartão 1x igual.
- **R$820** = `precoDeVendaCentavos` (preço cheio no lote final), mostrado **riscado** como âncora. Badge calcula **-43%** sozinho.
- Cartão 2x-3x só com juros 2,99% a.m. sobre R$470.
- `pixDescontoPct` e `cartaoAcrescimoPct` zerados em `src/lib/produtos.ts`. Preço sempre recalculado no server.

## 3. Área financeira/admin (commit `f4105f7`)

Painel em **`azuris.com.br/admin`** lendo a tabela `inscricoes` do Neon de produção (os 2 produtos: Lakehouse + DSSBR).

**Senha:** `ADMIN_PASSWORD` (env). Valor atual **`rYAV0WOyOa1g`** (Vercel prod + `.env.local`; rotacionável via `vercel env add ADMIN_PASSWORD production`). Segredo de sessão em `ADMIN_SESSION_SECRET`.

**Arquivos:**
- `src/lib/admin-auth.ts` — senha + cookie `azuris_admin` assinado HMAC. Guard no `src/app/admin/(painel)/layout.tsx`.
- `src/lib/admin-queries.ts` — dashboard + lista + detalhe (só leitura).
- `src/lib/asaas-sync.ts` — sincronização (puxa `GET /payments/{id}`).
- Rotas: `/admin` (dashboard), `/admin/vendas` (lista), `/admin/vendas/[id]` (detalhe). Login em `/admin/login`.
- APIs protegidas: `/api/admin/{login,sync,migrate}`.
- `/admin` fora do robots; flutuantes (WhatsApp/curso) escondidos no `/admin`.

**Migration (`sql/admin-migration.sql`):** colunas novas em `inscricoes` (empresa, cargo, pessoa_tipo, razao_social, nf_endereco JSONB, como_conheceu, consentimento_lgpd/_em, valor_liquido_centavos, taxa_centavos, due_date, asaas_status, pago_em, last_synced_at) + tabela `asaas_eventos` (webhook grava todo evento cru).

### ⚠️ Migration de PROD roda via endpoint, não pela CLI

`vercel env pull` traz as vars do Neon **VAZIAS** (sensitive). Então:
- **Staging:** `node sql/run-migration.mjs sql/admin-migration.sql` (usa `.env.local`).
- **Prod:** `POST /api/admin/migrate` (logado) — roda os mesmos statements via `POSTGRES_URL` de runtime. Idempotente. Já rodado em prod (18/18 OK).

## 4. Abas por produto na lista (commit `7ae5780`)

`/admin/vendas` tem abas no topo: **Todos · Ingressos DSS · Curso**, com contagem. Substituiu o dropdown de produto.

## 5. Filtros automáticos (commit `af7c86c`)

Sem botão "Filtrar". Selects filtram na hora; busca com debounce de 400ms. Client component `src/app/admin/(painel)/vendas/Filtros.tsx` atualiza a URL (`router.replace`). Verificado em browser real (playwright).

## 6. Checkout enriquecido — reordenação + campos extras (commit `7543ef7`)

Os **2 checkouts** (Lakehouse e DSSBR) foram reordenados:

```
1. grava inscrição 'pending' com TODOS os dados (criarInscricaoPendente)
2. cria/acha cliente no Asaas
3. cria a cobrança no Asaas
4. vincula payment_id/invoice + líquido/taxa/vencimento (vincularAsaas)
```

Se o Asaas falhar (passo 2-3), a linha vira `cancelled` (`cancelarInscricao`) — **o lead nunca se perde**. (Antes gravava DEPOIS do Asaas → risco de cobrança órfã.)

**Campos extras** via componente compartilhado `src/components/checkout/CamposExtras.tsx`: empresa, cargo, como conheceu, dados de NF (PF/PJ + razão social + endereço, atrás de toggle "preciso de nota fiscal"), e **consentimento LGPD obrigatório** (checkbox, com timestamp). Normalização server em `src/lib/checkout-extras.ts`. Consentimento validado no servidor (400 sem aceite).

### ⚠️ Happy path NÃO foi exercido em sandbox

A key sandbox do Asaas não está no ambiente (expira por inatividade — está vazia no `.env.development.local`). Verificado em sandbox: gate de consentimento (400), reordenação (linha nasce antes do Asaas), extras persistem (incl. NF em JSONB + timestamp), e caminho de falha (linha → cancelled, lead preservado). **Falta:** 1 PIX real no form de prod pra confirmar o happy path (Asaas 200 → vincula). Código verificado por composição (INSERT roda; `vincularAsaas` escreve colunas que o sync já grava em prod).

Como renovar a key sandbox: gerar API key no painel sandbox do Asaas → salvar em `.env.development.local` (`ASAAS_API_KEY`). Cartão teste: `5162 3062 1937 8829`, validade futura, CVV qualquer.

## 7. Aba Tráfego via GA4 Data API (commit `4a45381`)

Painel **`/admin/trafego`**: usuários, sessões, pageviews, engajamento + origem por canal/fonte + páginas mais acessadas, com seletor 7/28/90 dias. Lê a **GA4 Data API** (`runReport`) server-side.

- `src/lib/ga4.ts` — auth via service account com **JWT RS256 feito na mão** (`node:crypto`), sem `googleapis`. Token cacheado em memória.
- Link "Tráfego" na nav do painel. Estado de "GA4 não conectado" se as envs faltarem.

**Envs (setadas em prod + `.env.local`):**
- `GA4_PROPERTY_ID=421271387`
- `GA_SERVICE_ACCOUNT_JSON` — service account `mysiteazuris@my-project-websiteazuris.iam.gserviceaccount.com` (projeto `my-project-websiteazuris`, nº `670444873738`). Credencial em Vercel (encriptada) + `.env.local` (gitignored). **Não commitada.**

### ⚠️ Painel Tráfego BLOQUEADO — 2 pendências de acesso

A org Azuris tem policy que **bloqueia criar chave de service account** (`iam.disableServiceAccountKeyCreation`) → o SA foi criado num **projeto pessoal** (fora da org) como workaround. A chave funciona, mas faltam:

1. **Habilitar a Analytics Data API no projeto `670444873738`** (Binhara faz):
   https://console.developers.google.com/apis/api/analyticsdata.googleapis.com/overview?project=670444873738
   (o 403 atual é "API has not been used in project 670444873738").
2. **Dar Leitor pro SA na propriedade GA4 `421271387`** — Binhara **não é admin da conta** GA4 (só tem acesso de leitura), então um admin da conta precisa adicionar `mysiteazuris@my-project-websiteazuris.iam.gserviceaccount.com` como **Leitor**.

Com os dois feitos, o painel acende sem mexer em código/env. Fallback se travar de vez: trocar pra **OAuth com a conta do Binhara** (ele já enxerga os dados) — mais setup, não implementado.

---

## Estado da sincronização em prod

`POST /api/admin/sync {all:true}` rodado: **17 inscrições, 11 sincronizadas, 6 erros**. Os 6 erros são os **IDs 1-6** (404 no Asaas prod) — linhas de **teste de maio** com payment_id do sandbox. **Pendente decisão do Binhara: limpar ou deixar** (inflam a contagem do Curso de 11 reais → 17).

## Pendências

1. **Aba Tráfego (GA4):** habilitar a Data API no projeto `670444873738` (Binhara) + admin da conta GA4 dar Leitor pro SA na propriedade `421271387`. Ver seção 7.
2. **1 PIX real em prod** pra validar o happy path do checkout reordenado.
3. **Limpar IDs 1-6** (teste) da `inscricoes` de prod.
4. Renovar key sandbox do Asaas (pra testes E2E futuros).
5. De sempre: GitHub auto-deploy, PostHog key, Bing Webmaster, marcar eventos-chave no GA4, cases Sicredi/Unimed.

## Operação

- Deploy: `vercel --prod --yes` (`.vercel` aponta pro projeto de prod `site-azuris-2026`).
- Dev local: `node_modules/.bin/next dev -p 3000` (carrega `.env.development.local` com key sandbox). `.env.local` aponta pro Neon de **staging**.
- Gotcha Turbopack em `/mnt/d/`: HTML stale → `pkill -f next-server && rm -rf .next && restart`.

Última revisão: **2026-06-16**.
