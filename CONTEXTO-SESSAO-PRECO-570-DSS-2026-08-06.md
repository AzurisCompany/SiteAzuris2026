# Sessão 2026-08-06 — o FullPass do DSS a R$570 e o fim do carimbo "pré-venda"

**Tipo:** auditoria de preço do congresso + 1 correção de conteúdo em 7 arquivos + 1 teste-canário.
**Estado do repo ao fim:** `main` = `d388228`, working tree limpa, **11 commits não pushados** pro GitHub (prod atualizado via CLI; auto-deploy segue inexistente).
**Deploy:** 1 em produção, Ready em 48s, verificado no ar.

---

## 1. O pedido

"Liste todas as páginas que têm preço do congresso" → virou "registre o 570, as pessoas
não podem ficar confusas com preço diferente de ingresso agora".

## 2. Onde o preço do DSS aparece (o mapa)

**Públicas:**

| Página | Preços | Fonte |
|---|---|---|
| `/dssbr-2026` | 570/820, 247/357, 360 | 3 cards — tipo do admin (FullPass) + registry (One Day, combo) |
| `/dssbr-2026/inscricao` | 570 + âncora 820 | tipo ativo no banco |
| `/dssbr-2026/one-day` | 247 + escada 247/297/357 | registry + array `LOTES` na própria page |
| `/dssbr-2026/one-day-curso` | 360 | registry |

Mais o **meta description** de três delas ("a partir de R$ 247", "por R$ 360"), que é o
que aparece no card do WhatsApp.

**Admin:** `/admin/ingressos` (onde o 570 existe de verdade), `/admin/cobranca` (preço de
tabela sugerido) e `/admin/vendas` + `[id]` (valores do banco).

**São 3 fontes de verdade:** o banco (`tipos_ingresso`) só manda no FullPass; o registry
(`lib/produtos.ts`) manda no One Day, no combo e no *fallback* do FullPass; e a escada de
lotes do One Day está escrita à mão em `one-day/page.tsx:13`, duplicando o registry.

## 3. O que estava errado

O registry dizia **R$470 — "pré-venda"** desde 17/07, quando o Lote 1 de R$570 entrou no ar.
Três caminhos vazavam o número velho:

1. **Fallback silencioso.** Landing e checkout leem o tipo ativo dentro de um `try`/`catch`
   vazio. Banco fora do ar → os dois passam a mostrar **R$470** sem avisar ninguém.
2. **Prefill da cobrança avulsa:** "Tabela: R$ 470,00 · pré-venda · preço cheio R$ 820,00".
3. **`asaasDescricao`** carimbava "(pré-venda)" na cobrança — e daí na nota fiscal.

E o pior não era o número. O checkout **no ar** mostrava:

> Pré-venda · Pré-venda · 27 a 29 de outubro · IEP, Curitiba

A página concatenava a palavra com um `descricao` que já começava com ela. Preço de Lote 1
sob rótulo de campanha encerrada, dito duas vezes.

## 4. A correção (`d388228`)

- `produtos.ts`: `47000` → **`57000`**; `descricao` perdeu o "Pré-venda ·";
  `asaasDescricao` virou "(FullPass, 3 dias)".
- `admin-queries.ts`: dica da cobrança avulsa → "Lote 1 (FullPass) · preço cheio R$ 820,00".
- `inscricao/page.tsx`: morreu a duplicação; o bloco com seletor mostra só o evento.
- Landing: "Garanta sua vaga na **pré-venda**" → "no **DSS 2026**"; a linha de apoio deixou
  de fixar "Lote 1".
- Home (`Ecosystem.tsx`): "🎟️ Pré-venda aberta" → "🎟️ Ingressos abertos".

**A regra que ficou:** nome de lote e de campanha saem de todo texto fixo. Quem diz o lote é
o tipo de ingresso do `/admin/ingressos`. Texto fixo é o que envelhece na virada e desencontra
do preço que está logo abaixo dele na mesma tela.

O fallback do registry continua existindo — mas agora está documentado como **espelho do lote
vigente**, e tem teste cobrando isso.

## 5. Teste-canário (`src/lib/__tests__/precos-dss.test.ts`)

Quebra a suíte se: o registry desencontrar do lote vigente (constante única no topo do
arquivo), a cobrança avulsa sugerir outro número, a âncora riscada ficar menor que o preço
praticado, ou **qualquer** produto do registry voltar a se anunciar como pré-venda.

## Verificação

- **149/149 testes** (eram 145), `tsc --noEmit` limpo, `next build` compilando.
- ESLint: 11 erros / 9 avisos — **conferido com `git stash` que são os mesmos 20 de antes**,
  todos em código não tocado (setState-em-effect e `<a>` pra rota interna).
- Build local servido em :3111 e o HTML lido: landing com 570/820, 247/357, 360 e **zero**
  ocorrência de "pré-venda".
- **No ar depois do deploy:** "Ingressos abertos" na home, "FullPass · 3 dias" na landing,
  "R$ 570,00" no checkout, "pré-venda" em lugar nenhum das três.
- O link externo `dssbr.com.br/blog/pre-venda-2026/` foi conferido e **está correto** — diz
  "a pré-venda encerrou (era R$ 470)" com o valor riscado e Lote 1 = R$ 570. Nada a fazer lá.

## Fica pendente

- **11 commits não pushados** pro GitHub.
- **Cobranças já emitidas** seguem com a descrição "(pré-venda)" no Asaas — são registros
  passados, não texto de página; só mudariam uma a uma.
- A escada de lotes do One Day continua duplicada entre `produtos.ts` e `one-day/page.tsx`.
  Na virada do lote são **dois** lugares pra mexer, e nada testa que eles concordam.
- Nada mudou no que já estava pendente: **nenhum PIX real de ponta a ponta**, home do
  englishtalktime com preço velho, e os 6 erros da sincronização Asaas de 01/08.
