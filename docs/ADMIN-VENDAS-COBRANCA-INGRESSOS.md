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

## Onda D — o que mudou em 2026-08-14

Três acréscimos em cima do que está acima. Detalhe em
[INGRESSO-OCULTO-ESTUDANTE.md](./INGRESSO-OCULTO-ESTUDANTE.md) e
[CUPONS-DESCONTO.md](./CUPONS-DESCONTO.md); o mapa geral em
[CATALOGO-PRECOS-E-VENDAS.md](./CATALOGO-PRECOS-E-VENDAS.md).

### 1. Coluna `tipos_ingresso.oculto` — ingresso fora da vitrine
`ALTER TABLE tipos_ingresso ADD COLUMN IF NOT EXISTS oculto BOOLEAN NOT NULL DEFAULT false`
(aditiva; todo tipo existente continua visível). Tipo oculto **some da lista do checkout** e
só é vendido por `?tipo=<tipo_id>`.

- **`listarTiposAtivos` virou `listarTiposPublicos`** (`ativo AND NOT oculto`) — "ativo" tinha
  virado sinônimo de "aparece", e deixou de ser. Os 5 call sites acompanharam.
- `aplicarTipoDoLink()` (pura, testada) resolve o `?tipo=`: link bom inclui e pré-seleciona o
  oculto; recusa cai na vitrine com tarja, nunca em página de erro.
- Admin: checkbox **oculto**, link pronto pra copiar e tarja "só por link" na tabela.

### 2. Tipos de ingresso no seletor da cobrança avulsa
`/admin/cobranca` listava só produtos, então vender um tipo na mão gravava a venda **sem**
`tipo_ingresso` — fora da lotação e do breakdown. Agora cada tipo **ativo** entra como opção
logo abaixo do produto dele (`opcoesComTipos`), com preço do catálogo sugerido:

- a opção passou a ser identificada por **`slug:tipo`** (`opcaoId`), não só pelo slug;
- **oculto entra** (vender na mão é o caso dele); **gratuito não** (cobrança de R$ 0 não existe);
- a API confere o tipo contra o banco (`getTipo`, tem que ser do mesmo produto) e carimba a
  venda; **não** checa prazo nem lotação — venda manual é decisão do admin;
- tipo novo cadastrado em `/admin/ingressos` aparece aqui **sem deploy**.

### 3. Abas de origem em `/admin/vendas`
Faixa **Origem** abaixo das abas de produto, combinável com elas: **Link de vendedora** e
**Parceiro**, filtrando pelo `utm_source` que o checkout carimba (= tipo do cupom). A lista sai
de `TIPOS_CUPOM`, então tipo novo de cupom nasce com aba. Nessas abas a tabela ganha a coluna
**Cupom** (`utm_content`). `contarPorOrigem` conta com os filtros da tela **ignorando** o
filtro de origem — senão as abas inativas mostrariam zero e pareceriam vazias. Copiar e-mails
e CSV já seguiam os filtros: valem por aba.

---

## Onda E — o que mudou em 2026-09-14

### 1. Marcar ingresso como gerado (`d47732d`)
Botão **"marcar gerado"** na coluna Ação de `/admin/vendas` e no detalhe da venda
(`IngressoGeradoButton.tsx`). Grava `inscricoes.ingresso_gerado_em` (NULL = não gerado) via
`POST /api/admin/inscricoes/ingresso-gerado` `{ id, gerado }`. Marcado, vira **"✓ ingresso
dd/mm"**, com a hora no tooltip. Remarcar preserva a primeira data (`COALESCE`); desmarcar pede
confirmação.

- Aparece só em venda **paga** (gratuito incluso) **ou já marcada**. Marca em venda estornada é o
  aviso pra revogar o ingresso.
- **Nenhuma query filtra pela coluna** (canário `ingresso-gerado.test.ts`): a lista funcionou entre
  o deploy e a migração, e o botão responde 503 "rode a migração" nessa janela. **Um filtro
  "gerado / não gerado" muda isso:** só deployar com a migração já rodada, e ajustar o canário.

### 2. CSV de contatos: documento formatado (`edc42a3`)
A coluna `documento` sai `00.000.000/0000-00` / `000.000.000-00`. Crua, o Excel mostrava o CNPJ
como `8,72889E+13` e **perdia dígitos** (CSVs baixados antes de 14/09 estão corrompidos nessa
coluna). Ver [ADMIN-EXPORT-CSV-CONTATOS.md](./ADMIN-EXPORT-CSV-CONTATOS.md).

### 3. VIP e Business na cobrança avulsa e nas abas (`a825797`)
Opções "Ingresso DSS VIP" e "Ingresso DSS Business", com os lotes no seletor. O preço sugerido é
o do Lote 1. **A cobrança avulsa não confere o lote vigente**: escolher o lote certo é o que ocupa
a vaga certa. Ver [DSS-VIP-BUSINESS-LOTES-POR-QUANTIDADE.md](./DSS-VIP-BUSINESS-LOTES-POR-QUANTIDADE.md).

---

## Onda F — nota fiscal na lista de vendas (2026-09-15)

*"Eu não consigo visualizar quem solicitou nota fiscal ou não e também não consigo filtrar por quem
preciso gerar as notas fiscais."*

### O que o banco guardava (e o que não)
**Não existe coluna "quer nota".** A caixinha "Preciso de nota fiscal" do checkout
(`DadosNota.tsx`, `querNf`) nunca vai pro servidor: ela só decide se o endereço aparece e é
enviado. O pedido fica gravado **no rastro**, e é isso que a regra lê (`lib/nota-fiscal.ts`):

| sinal gravado | significa | por quê |
|---|---|---|
| documento com 14 dígitos (ou `pessoa_tipo = 'PJ'`) | pediu | decisão de 15/07: CNPJ implica nota. Lê o documento, porque venda PJ anterior a 17/07 gravou `pessoa_tipo` NULL |
| `nf_endereco` com algum campo | pediu | PF só envia endereço marcando a caixinha |
| nenhum dos dois | não pediu | |

**Nenhuma venda perdeu o pedido de nota**, e a regra vale pro histórico inteiro sem backfill.

**Emitida** vem de duas fontes: a marcação manual nova (`nf_emitida_em`, pra nota emitida fora do
sistema, que é como sai hoje) ou `nf_status = 'AUTHORIZED'` (botão "Emitir NF" do detalhe via
Asaas, que nunca rodou em prod: configuração fiscal vazia).

Situação da venda (`situacaoNota`): **emitida** › **não pediu** › **a emitir** (pediu + `paid` +
valor > 0) › **pediu, aguardando pagamento**. Nota de venda gratuita não entra em "a emitir".

### Na tela
- **Selo** ao lado do nome: `NF A EMITIR` (âmbar), `PEDIU NF` (cinza, ainda não pagou), `NF EMITIDA`
  (verde). Tooltip diz o motivo (CNPJ ou caixinha). Quem não pediu não tem selo.
- **Filtro "Nota fiscal"**: todas · pediu · a emitir · emitida · não pediu. Vale junto com os
  outros e **passa pro CSV** (`?nf=`).
- **Atalho `NF a emitir (N)`** no cabeçalho, contando com os filtros da tela (menos o de nota).
- **Botão "marcar NF emitida"** na coluna Ação, só pra quem pediu e pagou (ou já marcada). Vira
  **"✓ NF dd/mm"**. No detalhe, aparece em **toda venda paga**: nota pedida depois, por WhatsApp,
  também se marca. Não aparece quando o Asaas já autorizou a nota.
- Detalhe ganhou a linha **"Pediu nota fiscal: Sim · comprou com CNPJ / marcou a caixinha / Não"**.
- Conserto junto: `/admin/cobranca?de=<id>` de um PF que pediu nota agora **liga a caixinha**. Antes
  o endereço vinha preenchido, mas escondido, e não ia pra cobrança nova.

### Migração
`inscricoes.nf_emitida_em TIMESTAMPTZ`, aditiva e nullable. `POST /api/admin/inscricoes/nota-emitida`
`{ id, emitida }` (503 "rode a migração" antes dela). `GET /api/admin/migrate` ganhou
`tem_coluna_nf_emitida_em`.

**Diferente do ingresso gerado, aqui o filtro depende da coluna.** Entre o deploy e a migração:
a lista abre normal e o atalho some (`contarNotasAEmitir` devolve null), mas **escolher um filtro de
nota mostra o erro "column nf_emitida_em does not exist"**. Por isso: deploy e migração em sequência.
Canário em `nota-fiscal.test.ts` (lista sem filtro não toca a coluna, contador engole só esse erro).
Paridade SQL × TS conferida no banco de dev (17 linhas, os 4 filtros batendo).

## Onda G — lista de vendas enxuta (2026-10-02, `b5f31e6`)

Pedido: *"revise o layout da lista /admin/vendas, está bem ruim a visualização"*. Sem migração,
sem mudança de dado. Só tela.

**Diagnóstico, medido em prod a 1440px:** cada linha tinha 160 a 230px. A coluna Ação tinha 112px
e empilhava até 6 botões (nova cobrança, marcar gerado, marcar NF emitida, marcar teste, regerar,
cancelar). Ela ficava ainda fora da tela: tabela de 1223px num container de 1118px. A 1ª venda
aparecia ~830px abaixo do topo (21 abas em 5 linhas + filtros em 3 linhas).

| | antes | depois |
|---|---|---|
| altura da linha | 160–230px | 82–104px |
| página com 50 vendas | 10.100px | 5.091px |
| tabela | 1223px em 1118px (rola de lado) | cabe (1246px em `max-w-7xl`) |

**O que mudou:**
- **Coluna Ação:** na linha ficam só as marcas do dia a dia, com rótulo curto (prop `curto` em
  `IngressoGeradoButton`/`NotaEmitidaButton`): `+ ingresso` / `✓ ingresso dd/mm` e `+ NF` /
  `✓ NF dd/mm`. Nova cobrança, marcar teste, regerar e cancelar vão pro menu **⋯**
  (`vendas/MaisAcoes.tsx`, fecha no clique fora e no Esc). No detalhe da venda e na conciliação os
  botões continuam com o rótulo longo.
- **Colunas:** Pgto saiu e virou linha menor embaixo do Valor (`PIX`, `Cartão · 3x`). Taxa saiu e
  virou linha embaixo do Líquido; o cabeçalho mostra `Σ líquido` e, embaixo, `taxa Σ`.
- **Abas de produto:** produto com 0 vendas não ganha aba (a ativa fica sempre, mesmo zerada).
- **Filtros:** uma grade só, 2 linhas de 5 no desktop (a busca vale 2 colunas no `xl`).
- **Layout do admin inteiro:** `max-w-6xl` → `max-w-7xl`; o menu do topo rola de lado no celular.
- A tabela fica `overflow-visible` a partir do `xl`, senão o menu ⋯ da última linha seria cortado.
  Abaixo disso ela rola de lado, como antes.

Conferido no ar logado: 50 linhas entre 82 e 104px, menu ⋯ abre, `/admin`, `/admin/vendas/[id]` e
`/admin/conciliacao` respondem 200.

---

## Onda H — selo "manual" e aba "Cobrança manual" (2026-10-02)

Pedido: identificar na lista as vendas que não vieram do checkout do site. Desde 02/10 o checkout
público vende **1 por CPF/CNPJ** (ver CATALOGO §4.1), então mais de um ingresso pro mesmo documento
sempre aparece como cobrança manual.

- **Selo `manual`** (azul) ao lado do nome, quando `ehCobrancaManual(r)` (`lib/cobranca-manual.ts`):
  `utm_source='admin'` **ou** `curso_slug='proposta'` (as propostas antigas, sem carimbo). O `title`
  mostra a descrição digitada na cobrança.
- **Aba de origem "Cobrança manual"** (`?origem=admin`): a página traduz pra filtro `manual`, que pega
  também as propostas antigas. Sem contador, porque `contarPorOrigem` agrupa por `utm_source` e não
  enxerga essas linhas. `contarPorOrigem` passou a ignorar `manual` (senão as outras abas zeravam).
- Uma linha manual pode valer **mais de um ingresso**: deduza pelo valor (ex.: R$ 494 = 2 × R$ 247).

---

## Relatório de ingressos por tipo (pago × em aberto): como montar

Não existe tela pronta pra isso, e o CSV de contatos tem dado pessoal demais pra uma contagem.
A receita usada em 27/09/2026 (resultado e decisões em
[`CONTEXTO-SESSAO-LOTE3-RELATORIO-INGRESSOS-2026-09-27.md`](../CONTEXTO-SESSAO-LOTE3-RELATORIO-INGRESSOS-2026-09-27.md)):

1. **Vendas do site, por produto:** `/admin/vendas?curso=<slug>&page=N` para `dss-2026`,
   `dss-one-day-2026`, `dss-vip-2026`, `dss-business-2026` e `dss-fullpass-curso-2026`. A coluna
   Produto traz o tipo (`lote-1`, `lote-2`, `estudante`…). Status: **Pago** · **Pendente** (a vencer)
   · **Vencido** · Cancelado/Estornado (fica fora). Confira a soma contra o "N registros" da página.
2. **Uma linha pode ser mais de um ingresso.** Deduza pelo valor (ex.: R$ 2.166 = 4 × 570 × 0,95).
3. **Cobranças a empresas:** `?curso=proposta` (**`?manual=1` não filtra**). A quantidade está na
   descrição, que só aparece no detalhe `/admin/vendas/<id>`, na linha "Como conheceu". Cobrança
   manual com produto escolhido (DSS, VIP…) cai no slug do produto e já entrou no passo 1.
4. **Bônus do curso:** quem comprou o Lakehouse (`lakehouse-comunidade`) **antes de 25/08/2026**
   ganhou 1 FullPass. Depois disso, não ganha mais.
5. **Vencido não é venda perdida:** muitas vezes a cobrança foi refeita e paga. Mostre numa coluna
   separada.

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
