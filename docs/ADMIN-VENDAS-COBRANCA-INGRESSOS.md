# Admin — Cobrança avulsa, Tipos de ingresso e Dashboard por tipo

> **Continua em** [ADMIN-FINANCEIRO-ONDAS-2026-07-09.md](./ADMIN-FINANCEIRO-ONDAS-2026-07-09.md) —
> boleto/multi-meio, conciliação/saúde, editar cobrança, página financeiro (recebíveis/DRE), NF via Asaas e assinaturas.

Documenta a leva de features da área `/admin` entregue em 2026-07-09, em 3 ondas.
Complementa [CHECKOUT-ASAAS-REPRODUCAO.md](./CHECKOUT-ASAAS-REPRODUCAO.md) (pipeline base do checkout) —
tudo aqui **reusa** aquele pipeline (customer → payment → inscrição pending → vínculo Asaas → webhook).

> **Antes de tudo:** depois de deployar, rode a migration em produção com
> `POST /api/admin/migrate` (logado no admin). Ela é aditiva e idempotente. Sem ela,
> as queries que usam as colunas/tabelas novas degradam pro banner de erro (ou pro
> fallback de preço único, no checkout) — **não quebram** as telas.

---

## Onda A — Cobrança avulsa (link de proposta customizada)

Gera um link de pagamento Asaas pra uma proposta já fechada, com **valor e descrição livres**.
Serve pra qualquer coisa: lote corporativo de ingressos, curso in-company, consultoria.

- **Tela:** `/admin/cobranca` (nav "Cobrança") — `page.tsx` + `CobrancaForm.tsx`.
- **API:** `POST /api/admin/cobranca` (protegida por `estaLogado()`).
- **Campos:** nome, e-mail, CPF/CNPJ, telefone, descrição, **valor livre**, PIX ou cartão (1–5x),
  vencimento em N dias (1–60, default 3).
- **Preço:** PIX/1x = valor cheio; 2x+ = juros repassados via `lib/parcelamento.ts` (Price, 2,99% a.m.).
- **Armazenamento:** grava uma `inscricoes` com `curso_slug='proposta'` (label "Proposta customizada",
  aba "Propostas" em /vendas). A descrição fica em `como_conheceu` (`"Proposta customizada: …"`),
  visível no detalhe da venda. `pessoa_tipo` é inferido pelo tamanho do documento (14 díg = PJ).
- **Envio:** manual. O painel de resultado mostra **link + copiar link + WhatsApp do cliente
  (wa.me com mensagem pronta) + copiar mensagem + abrir fatura**.
- **Status:** o webhook compartilhado (`/api/webhook/asaas`) fecha o status sozinho quando o cliente
  paga — nenhum código novo no webhook.

**Não muda schema.** É 100% aditivo em cima do que já existia.

---

## Onda B — Coluna `tipo_ingresso`, dashboard por tipo e filtros novos

### Schema
- Coluna `inscricoes.tipo_ingresso TEXT` (nullable) + índice `(curso_slug, tipo_ingresso)`.
- Retrocompatível: linhas antigas ficam `NULL` = "sem tipo". Nenhum checkout existente quebra
  (`NovaInscricaoPendente.tipo_ingresso` é opcional, default NULL).

### Dashboard (`/admin`)
- `resumoPorTipo()` agrupa por `curso_slug, tipo_ingresso`.
- Cada card de produto **abre em "Por tipo"**: linhas com pagas · ticket médio · líquido,
  cada uma clicável → leva pra `/vendas` já filtrado por aquele tipo.
- Só aparece quando há mais de um tipo ou um tipo nomeado (produto de preço único não polui).

### Filtros em `/vendas`
Novos, além dos que já existiam (status, forma de pgto, busca):
- **Tipo de ingresso** (select populado dinamicamente do banco via `opcoesFiltro()`)
- **PF/PJ** (`pessoa_tipo`)
- **Origem/UTM** (`utm_source`, select dinâmico)
- **Período** (`created_at` de/até, inclusive)

Implementados em `FiltrosVendas` + `listarVendas` (WHERE parametrizado, mesmo padrão seguro dos
antigos) e no client `Filtros.tsx`. O helper `baseParams()` na `vendas/page.tsx` preserva todos os
filtros ativos nas abas, paginação e no toggle de testes.

### Lakehouse escreve o tipo
`/api/inscricao` passou a gravar `tipo_ingresso = perfil` (`membro` | `nao-membro`), então o
breakdown do curso acende com dado real (Membro R$550 vs Não-membro R$750). `labelTipo()` mapeia
esses ids pra rótulos amigáveis. Inscrições Lakehouse **antigas** ficam `NULL` (opcional: backfill
`UPDATE ... SET tipo_ingresso = CASE lote WHEN 'lote1' THEN 'membro' WHEN 'lote2' THEN 'nao-membro' END`).

---

## Onda C — Tipos de ingresso **cadastráveis** no admin

Em vez de hardcodar os tipos do DSSBR, eles viram **dado no banco**, gerenciados numa tela.
Assim você cria/edita tipo e preço **sem deploy**.

### Tabela `tipos_ingresso` (fonte da verdade do preço por tipo)
| coluna | o que é |
|---|---|
| `produto_slug` | a que produto pertence (ex.: `dss-2026`) |
| `tipo_id` | slug do tipo, gravado em `inscricoes.tipo_ingresso` (ex.: `estudante`) — chave lógica, fixa |
| `nome` | rótulo exibido (ex.: "Estudante") |
| `descricao` | linha curta opcional |
| `preco_centavos` | preço cobrado (base) |
| `preco_de_centavos` | âncora "de" riscada (0 = sem âncora) |
| `pix_desconto_pct` | % off no PIX (10 = 10%) |
| `cartao_acrescimo_pct` | % a mais no cartão sobre a base |
| `max_parcelas` | teto de parcelas (cap 5x, teto do site) |
| `ativo` | aparece no checkout? |
| `ordem` | ordem de exibição |

Unique `(produto_slug, tipo_id)`. Percentuais em **% inteiro** (não fração).

### Camadas
- **Lib** `src/lib/tipos-ingresso.ts` — `listarTipos` / `listarTiposAtivos` / `getTipo` /
  `upsertTipo` / `deletarTipo` + cálculo de preço server-side (`precosDoTipo`, `valorCobradoDoTipo`).
  Mesma regra de PIX/cartão do `lib/produtos.ts`.
- **Admin** `/admin/ingressos` (nav "Ingressos") — `page.tsx` + `IngressosManager.tsx` (CRUD com
  preview de preço ao vivo). API `/api/admin/ingressos`:
  - `GET ?produto=slug` — lista (todos ou de um produto)
  - `POST { ...tipo }` — cria/atualiza (upsert por `produto_slug`+`tipo_id`; `tipo_id` derivado do nome)
  - `DELETE { id }` — remove (não afeta vendas já feitas)
- **Checkout DSSBR** (`/dssbr-2026/inscricao/page.tsx` + `InscricaoForm.tsx` + a API do checkout):
  - Lê os tipos **ativos** de `dss-2026`.
  - **Se houver:** mostra um **seletor de tipo** (cards com preço/desconto), e o valor cobrado vem do
    tipo escolhido — **derivado no servidor** (`getTipo` + `valorCobradoDoTipo`); o client nunca manda preço.
    A venda grava `tipo_ingresso`, o que acende o breakdown por tipo (Onda B).
  - **Se não houver:** cai no preço único de `lib/produtos.ts` (fallback). O checkout **nunca quebra**,
    mesmo sem migration rodada.

---

## Fluxo de uso (pós-deploy)

1. `cd web && npx vercel --prod --yes`
2. `POST /api/admin/migrate` (logado) — adiciona a coluna e a tabela.
3. **Cobrança avulsa:** `/admin/cobranca` → preenche → gera link → manda no WhatsApp.
4. **Tipos DSSBR:** `/admin/ingressos` → cadastra Estudante / Profissional / VIP / Corporativo com preços.
5. **Conferir:** `/dssbr-2026/inscricao` mostra o seletor; `/admin` abre o breakdown por tipo.
6. **Validar em prod:** 1 cobrança/inscrição pequena por caminho → confere `paid` → marca `is_teste`
   (esconde de lista/KPIs sem apagar).

## Arquivos

**Novos:** `src/lib/tipos-ingresso.ts` · `src/app/admin/(painel)/cobranca/{page,CobrancaForm}.tsx` ·
`src/app/admin/(painel)/ingressos/{page,IngressosManager}.tsx` ·
`src/app/api/admin/cobranca/route.ts` · `src/app/api/admin/ingressos/route.ts` · este doc.

**Alterados:** `sql/admin-migration.sql` · `src/app/api/admin/migrate/route.ts` · `src/lib/db.ts` ·
`src/lib/admin-queries.ts` · `src/app/admin/(painel)/layout.tsx` · `src/app/admin/(painel)/page.tsx` ·
`src/app/admin/(painel)/vendas/{page,Filtros}.tsx` · `src/app/api/inscricao/route.ts` ·
`src/app/api/dssbr-2026/inscricao/route.ts` · `src/app/dssbr-2026/inscricao/{page,InscricaoForm}.tsx`.
