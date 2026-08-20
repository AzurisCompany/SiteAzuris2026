# GU BigData — Página de evento + checkout

Página de evento estilo marketplace (Sympla-like) + checkout com ingresso pago e gratuito
pros encontros presenciais do **GU Big Data & IA** (18h30, IEP, Curitiba). Evento do grupo
de usuários (GU + Rede Sol + SUCESU PR) — a Azuris só processa a inscrição e aparece
discretamente no rodapé. Em produção desde 2026-07-11.

**Encontro em cartaz: 26 de agosto de 2026** — DSSBR ao Vivo (Alessandro Binhara) e Process
Mining na Saúde (Marcelo Dallagassa). Geral R$ 30 · associado grátis.

## Um encontro, um produto

`/gubigdata` é **sempre o próximo encontro**, nunca um arquivo de eventos passados. Cada
encontro é um produto próprio no registry (`gubigdata-AAAA-MM`), e é isso que mantém
receita, lotação e aba do painel separadas de um mês pro outro — o `curso_slug` gravado na
venda é o que o painel usa pra agrupar.

Quem manda no encontro corrente é **`src/app/gubigdata/evento.ts`** (`EVENTO_GU`): título,
data, local, agenda, palestrantes, banner e o slug. Página, checkout, rota de API e o card
da `/comunidade` leem de lá — nenhum deles tem data escrita à mão.

### Trocar de encontro (a receita)

1. `src/app/gubigdata/evento.ts` — novo `EVENTO_GU_SLUG` + conteúdo do encontro.
2. `src/lib/produtos.ts` — entrada nova `gubigdata-AAAA-MM` (fallback R$ 30, 3x, PJ sem endereço).
3. `src/lib/admin-queries.ts` — `PRODUTO_LABEL`, `PRODUTO_TAB`, `CHECKOUT_URL`; e o encontro
   que saiu de cartaz entra em **`PRODUTOS_ENCERRADOS`** (sai do `CHECKOUT_URL` e do seletor
   da cobrança avulsa, mantendo rótulo e aba pro histórico).
4. `src/lib/email/conteudo.ts` — mais um `case` no `switch` (o texto não cita data, então é
   só encaixar o slug novo junto dos antigos).
5. Seed dos dois tipos na migração (`sql/admin-migration.sql` + `api/admin/migrate/route.ts`),
   **sem `vendas_ate`** — ver o incidente de 30/07 mais abaixo. Rodar `POST /api/admin/migrate`
   depois do deploy.
6. Banner e fotos em `public/gubigdata/` (o canário do teste reprova caminho que não existe).

O canário `src/lib/__tests__/gubigdata-evento.test.ts` cobre os passos 1–6: esquecer um deles
não quebra build nenhum — o site sobe bonito e a venda cai no balde errado.

## Rotas

| Rota | O quê |
|---|---|
| `/gubigdata` | Página de EVENTO (tema claro, indexável, OG image do banner). Banner → título/data/local → descrição/programação/palestrantes/local/produtor à esquerda + card **Ingressos** sticky à direita (stepper 0/1, botão verde) |
| `/gubigdata/inscricao` | Checkout no MESMO tema claro (noindex). `?tipo=geral\|associado` pré-seleciona o ingresso vindo do card |
| `POST /api/gubigdata/inscricao` | Rota fina → `processarCheckout(EVENTO_GU_SLUG, body)` — a rota não sabe a data |

Arquivos: `src/app/gubigdata/{evento.ts,page.tsx,TicketBox.tsx}`, `src/app/gubigdata/inscricao/{page.tsx,InscricaoGuForm.tsx}`,
assets em `public/gubigdata/` (logo, banner, fotos dos palestrantes — baixados do gubigdata.com.br;
as fotos de 26/08 saíram recortadas do próprio banner com `ffmpeg`).

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
`geral` R$ 30 (3x) e `associado` grátis, por encontro. O seed de 30/07 nasceu com
`vendas_ate = 2026-07-29` e **fechou o checkout à meia-noite do dia do evento**; o de 26/08
nasce com `vendas_ate` NULL, que é a regra da casa desde 01/08 — nada expira sozinho. O vigia
de vendas (`lib/vigilancia.ts`) existe por causa desse incidente.

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

## Verificação do encontro de 26/08 (local, 2026-08-20)

- Migração local 44/44 (era 43); os dois tipos novos semeados.
- `/gubigdata`: card mostra **Geral R$ 30,00 em até 3x** e **Associado grátis**, ambos com
  "Vagas limitadas" (sem prazo). Selo "Nova data" no banner e no cabeçalho.
- `/gubigdata/inscricao?tipo=associado` já abre com o gratuito marcado → botão "Confirmar
  inscrição gratuita" (sem CPF, sem Asaas).
- Fluxo gratuito E2E: inscrição criada → reenvio devolve `duplicada` → `?tipo=associadoo`
  responde 400 antes de gravar qualquer coisa.
- Screenshots desktop/mobile conferidos (playwright-core).
- Fluxo PAGO segue sem exercício real contra o Asaas — mesmo pipeline do DSS, que já tem
  venda paga de verdade.

⚠️ A peça de divulgação do GU anuncia "Entrada gratuita". A decisão (20/08) é manter
**R$ 30 no geral e gratuito pra associado**, como em 30/07.

## Verificação feita em prod (2026-07-11)

- Migração 36/36, integridade: 35 inscrições antes/depois, 2 tipos semeados.
- Fluxo gratuito E2E: inscrição #36 criada → duplicada → tipo inválido 400. Marcada `is_teste`.
- Screenshots desktop/mobile (playwright-core, receita na memória) — página e checkout ok.
- Fluxo PAGO ainda sem exercício real contra o Asaas (mesmo pipeline do DSSBR; falta 1 PIX de R$ 30).

Última revisão: **2026-08-20**.
