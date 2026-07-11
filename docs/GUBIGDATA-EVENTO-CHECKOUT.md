# GU BigData — Página de evento + checkout (30/07/2026)

Página de evento estilo marketplace (Sympla-like) + checkout com ingresso pago e gratuito
pro **Encontro Presencial GU Big Data & IA — 30 de julho** (18h30, IEP, Curitiba).
Evento do grupo de usuários (GU + Rede Sol + SUCESU PR) — a Azuris só processa a inscrição
e aparece discretamente no rodapé. Em produção desde 2026-07-11.

## Rotas

| Rota | O quê |
|---|---|
| `/gubigdata` | Página de EVENTO (tema claro, indexável, OG image do banner). Banner → título/data/local → descrição/programação/palestrantes/local/produtor à esquerda + card **Ingressos** sticky à direita (stepper 0/1, botão verde) |
| `/gubigdata/inscricao` | Checkout no MESMO tema claro (noindex). `?tipo=geral\|associado` pré-seleciona o ingresso vindo do card |
| `POST /api/gubigdata/inscricao` | Rota fina → `processarCheckout('gubigdata-2026-07', body)` |

Arquivos: `src/app/gubigdata/{page.tsx,TicketBox.tsx}`, `src/app/gubigdata/inscricao/{page.tsx,InscricaoGuForm.tsx}`,
assets em `public/gubigdata/` (logo, banner, fotos dos palestrantes — baixados do gubigdata.com.br).

## Checkout genérico (`lib/checkout-produto.ts`)

A lógica que era da rota DSSBR foi extraída e parametrizada pelo slug do registry
(`lib/produtos.ts`). As rotas `/api/dssbr-2026/inscricao` e `/api/gubigdata/inscricao`
são wrappers de ~15 linhas. Comportamento do DSSBR inalterado.

Fluxos:

- **PAGO**: validação (CPF obrigatório — exigência do Asaas) → preço SEMPRE derivado no
  servidor (tipo de ingresso do catálogo, ou preço único do registry) → `criarCobranca`
  (pipeline comum: dedupe → pending → Asaas → vínculo) → `{ invoiceUrl }`.
- **GRATUITO** (tipo com `preco_centavos = 0`): sem CPF e sem Asaas. Dedupe por
  `(curso_slug, email, tipo)` → INSERT direto confirmado (`status='paid'`,
  `billing_type='GRATIS'`, `valor_centavos=0`, `pago_em=NOW()`) → `{ gratuito: true }`.
  Reenvio devolve `{ gratuito: true, duplicada: true }` (idempotente).
  O select "sou associado de" do form vai em `como_conheceu` (conferência na porta).

`BillingType` ganhou `'GRATIS'` (coluna é TEXT). As rotas que falam com o Asaas foram
estreitadas pra `AsaasBillingType` — GRATIS não compila chegando lá.

## Tipos de ingresso — vendas_ate e limite_qtd

`tipos_ingresso` ganhou (migração aditiva, espelhada em `sql/admin-migration.sql`):

- `vendas_ate DATE` — último dia de venda **inclusive** (BRT via `hojeBRT()`); NULL = sem prazo.
- `limite_qtd INTEGER` — lotação do tipo; conta `paid+pending` sem `is_teste`
  (`contarInscritosPorTipo`); NULL = sem limite.

`disponibilidadeDoTipo(tipo, hoje, inscritos)` é pura (testes em
`lib/__tests__/tipos-ingresso.test.ts`): inativo/prazo → "encerrado", lotado → "esgotado",
encerrado tem precedência. Checada no server da página, do checkout E da API (o POST recusa
tipo indisponível mesmo com request forjado).

Seed idempotente na migração (`ON CONFLICT DO NOTHING` — NÃO sobrescreve edição do admin):
`geral` R$ 30 (3x) e `associado` grátis, ambos vendas até 2026-07-29.

## Admin

- Aba **GU BigData** em dashboard/vendas nasce do `curso_slug` (só labels em
  `admin-queries.ts`). Gratuitos aparecem como "Grátis" / R$ 0, status pago.
- `/admin/ingressos`: produto GU no select, campos "Vendas até" e "Limite de vagas",
  **preço R$ 0,00 = gratuito** (API valida: 0 ou ≥ R$ 1,00). Filtro de meio ganhou "Grátis".

## Gotchas descobertos

1. **SSR do Next 16 engole o espaço depois de `</strong>`** em certos casos
   (`IA</strong> é` renderizou `IAé`). Fix: string explícita `{' é o grupo…'}`.
2. **Widgets globais** (WhatsAppFab, CourseFloatingBanner) escondidos em `/gubigdata/*` —
   quebravam a cara de marketplace e cobriam o card de ingressos no mobile.
3. **Logo SVG largo** em flex com `shrink-0` estourava a largura no mobile (scroll
   horizontal + faixa escura). Fix: empilhar (`flex-col sm:flex-row`) + `max-w`.
4. `ADMIN_PASSWORD` do `web/.env.local` **funciona contra produção** — dá pra logar via
   curl e chamar `/api/admin/migrate`, `/api/admin/ingressos` etc. da CLI.
5. Descrição do tipo não deve repetir o subtítulo de parcelas do card (ficou "Aberto ao
   público" no geral).

## Verificação feita em prod (2026-07-11)

- Migração 36/36, integridade: 35 inscrições antes/depois, 2 tipos semeados.
- Fluxo gratuito E2E: inscrição #36 criada → duplicada → tipo inválido 400. Marcada `is_teste`.
- Screenshots desktop/mobile (playwright-core, receita na memória) — página e checkout ok.
- Fluxo PAGO ainda sem exercício real contra o Asaas (mesmo pipeline do DSSBR; falta 1 PIX de R$ 30).
