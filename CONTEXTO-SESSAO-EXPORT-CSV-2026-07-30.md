# Sessão 2026-07-30 (tarde) — CSV de contatos por produto em /admin/vendas

**Tipo:** feature nova, entregue e no ar.
**Estado do repo ao fim:** `main` = `de92b13` + este doc. Working tree limpa.
**Deploy:** `dpl_7A1UUdPSWSjXYSG46p1sfEiVrXe3` — production, READY, verificado no ar.

Doc técnico completo: [`docs/ADMIN-EXPORT-CSV-CONTATOS.md`](./docs/ADMIN-EXPORT-CSV-CONTATOS.md).
Esta é a sessão da **tarde**; a da manhã foi o incidente do GU
([`CONTEXTO-SESSAO-GU-VENDAS-ENCERRADAS-2026-07-30.md`](./CONTEXTO-SESSAO-GU-VENDAS-ENCERRADAS-2026-07-30.md)).

## O pedido

> "quero um botão pra além de exportar a lista de email — um CSV completo, nome,
> email e telefone de cada tipo de produto"

e, na sequência, quando perguntei sobre agrupamento e formato:

> "quero um botão por produto"

O "por produto" respondeu as duas perguntas de uma vez: com um arquivo por
produto, a questão de como agrupar quem comprou coisas diferentes evapora.

## O que foi entregue

Botão de download em **cada aba de produto** de `/admin/vendas` (ao lado do ícone
de copiar emails) + um no cabeçalho pra aba ativa. Servidos por
`GET /api/admin/exportar`, que lê os **mesmos query params da tela** — o arquivo
é sempre o que está na tela.

21 colunas: nome, email, telefone, whatsapp (link `wa.me`), produto, tipo,
pagou, status, valor, meio, parcelas, documento, PF/PJ, empresa, cargo, origem,
campanha, como_conheceu, inscricao_em, pago_em, registros.

| Arquivo | |
|---|---|
| `src/lib/export-contatos.ts` | novo — monta o CSV, puro |
| `src/lib/__tests__/export-contatos.test.ts` | novo — 15 testes |
| `src/app/api/admin/exportar/route.ts` | novo — a rota |
| `src/app/admin/(painel)/vendas/BaixarCsvLink.tsx` | novo — o botão |
| `src/lib/admin-queries.ts` | `vendasParaExport()` + `EXPORT_MAX_LINHAS` |
| `src/app/admin/(painel)/vendas/page.tsx` | `exportHref()` + botões |

**Zero mudança de schema. Zero migração.**

## As 3 decisões que valem lembrar

1. **Uma linha por pessoa POR produto** (chave `email+curso_slug`). Cobrança
   regerada colapsa numa linha só, com `registros=N`.
2. **`pagou` olha TODAS as linhas colapsadas**, não só a que sobreviveu. Se a
   pessoa pagou em junho e você regerou em julho, a linha mais recente é a
   pendente — sem essa regra ela sairia da lista como se nunca tivesse comprado.
3. **`;` + BOM + vírgula decimal.** Abre no Excel pt-BR e no Sheets com duplo
   clique. **No pandas precisa de `sep=';'`.** E campo começando com `=`/`+`/`-`/`@`
   ganha prefixo `'`: nome e empresa vêm digitados no checkout público, e o Excel
   executaria como fórmula ao abrir.

## Verificação (o que foi realmente exercitado)

- `vitest` **115/115**, `tsc --noEmit` limpo, `next build` compila e registra
  `ƒ /api/admin/exportar`.
- Local (Neon de teste): headers, BOM+CRLF no `cat -A`, `?curso=` filtrando de
  verdade, filtro sem resultado devolvendo só o cabeçalho, **401 sem cookie**,
  screenshot headless das abas com os 6 botões ativos e os vazios apagados.
- **Prod, contra o banco real:** 72 contatos no total — GU 38, Curso 12, DSS 11,
  Propostas 9, One Day 0. No arquivo do GU: 21 colunas, **zero linhas com nº de
  campos ≠ 21** (nenhum `;` de dado vazou sem escape), 38 emails únicos em 38
  linhas, 38 com telefone. 401 sem cookie confirmado em prod.
- Cookie jar e CSVs baixados **apagados do scratchpad** ao fim — eram dados reais
  de cliente.

## Consertado de passagem

`src/lib/__tests__/cobranca-manual.test.ts` (commit `e6af635`) esperava 4 slugs em
`OPCOES_COBRANCA`; o `abc7ad9` (21/07) adicionou `dss-one-day-2026` e
`dss-one-day-curso-2026` sem atualizar a asserção. **A suíte estava vermelha no
`main` desde 21/07.**

## Fica pendente

- **⚠️ DSSBR: Lote 1 expira 10/08.** `vendas_ate='2026-08-10'`, `limite_qtd=100`.
  Quando expirar ou esgotar, sem Lote 2 ativo o checkout do FullPass fica **sem
  opção de compra, em silêncio** — o mesmo mecanismo que fechou o GU na manhã
  desta mesma data. Criar em `/admin/ingressos` antes de 10/08. Continua sem
  nenhum monitoramento de tipo prestes a expirar sem sucessor.
- **One Day zerado.** No ar desde 21/07, repreçado em 22/07, **0 vendas**. Não dá
  pra saber daqui se é falta de tráfego ou se o caminho está quebrado — o fluxo
  nunca teve um PIX real de ponta a ponta.
- **Números do GU enganam:** os 38 aparecem como pagos porque o tipo `associado`
  é gratuito. Pra receita, filtrar por valor, não por status.
- Aba **`preparatorio-dados` mostra o slug cru** — falta entrada em `PRODUTO_TAB`
  (`admin-queries.ts`). Uma linha, pré-existente, não mexi.
- Bug aberto de antes: campos do bloco "Regerar" ficam velhos após `router.refresh()`.
