# Sessão 2026-09-18 — o café de 06/10 troca de apresentação: sai a Arlequim, entra a Bindflow

**Tipo:** releitura do projeto, seguida de uma troca de conteúdo em produção: a página e o
checkout de `/cafe-networking` passam a anunciar a Bindflow (Lucas Moraes, AtendeVet) no lugar
da Arlequim.

**Estado do repo ao fim:** working tree limpa, **`main` 4 commits à frente de `origin/main`**
(os 2 de 15/09 + os 2 desta sessão). O push aguarda o OK do Binhara.

| commit | o quê |
|---|---|
| `db8da51` | feat(cafe-networking): café de 06/10 passa a ser com a Bindflow (AtendeVet) |
| *(este)* | docs: contexto da sessão de 18/09 + receita de troca de apresentação |

**Deploy:** 1 em prod (`dpl_Ctne5KyaWUTjv3YfqFaqte6QW6DE`, `site-azuris-2026-cur9akfmf`), **rodado
pelo Binhara** (ver §4). Verificado no ar.
**Migração de prod:** nenhuma (continua 50/50). **Banco:** nada mudou.
**Testes:** 293 (27 arquivos), inalterado. Build limpo, eslint sem erro.

Docs tocados: [`EVENTOS-PRESENCIAIS`](./docs/EVENTOS-PRESENCIAIS.md) (tabela "em cartaz", nota de
palestrante, receita nova "Trocar a apresentação da MESMA edição", histórico).

---

## 0. O que a releitura encontrou

- `main` 2 commits à frente do GitHub (`1f2969c` + `2ebad8b`, de 15/09), push ainda pendente.
- 293/293 testes verdes, o mesmo número do README.
- Preços no ar batendo com o catálogo: FullPass R$ 670 (âncora R$ 820) · VIP R$ 957 · Business
  R$ 757 · One Day R$ 290 · combo FullPass+curso R$ 750 · GU 24/09 R$ 30 · café R$ 30.
- Armadilha de verificação: no HTML do React, o preço vem como `R$ <!-- -->670`. Um grep por
  `R\$ [0-9]` perde esse caso e dá a impressão de que a landing do DSS só mostra R$ 290. O padrão
  certo é `R\$ (<!-- -->)?[0-9]+`.

## 1. O pedido

*"crie o checkout para esse cafe https://dssbr.com.br/blog/cafe-networking-bindflow-outubro-2026/"*
e, depois: *"está errada a imagem e o conteúdo no checkout — é esse aqui […] pode desabilitar esse
da Arlequim"*

## 2. Não era um café novo, e sim o mesmo café com outra apresentação

O post da Bindflow tem **a mesma data (terça, 06/10) e o mesmo local (IEP)** do café que estava no
ar desde 05/09 com a Arlequim. O índice do blog do DSSBR não tem mais post da Arlequim, e o post
novo se chama "o último Café de Networking antes do DSSBR 2026". Ou seja, é a mesma manhã com outra
apresentação.

Antes de escolher o caminho, conferi as vendas em prod (`/admin/vendas?curso=cafe-networking-2026-10`):
**0 inscrições**, nem pagas nem gratuitas.

**Decisão: trocar o conteúdo e manter o produto.** O slug `cafe-networking-2026-10`, os dois tipos
(ids 50/51), a URL e o endpoint continuam os mesmos.

- Um produto novo (`…-2026-10b`, por exemplo) exigiria os 7 passos da receita, uma migração com seed
  novo e o passo 7 (desligar os tipos da Arlequim). Tudo isso pra proteger um histórico que não
  existe: sem inscrição, não há comprador a separar nem receita a apartar.
- Se houvesse inscrições, a conta mudaria. Essas pessoas se inscreveram pra ver a Arlequim, e ou
  seriam avisadas da troca, ou a edição viraria produto novo. Por isso a checagem de vendas vem
  **antes** da decisão, e virou o passo 1 da receita nova.

"Desabilitar a Arlequim", portanto, não tinha nada a desligar no banco: os ingressos são
compartilhados, e o deploy do conteúdo novo é o que tira a Arlequim do ar.

## 3. O que mudou (`db8da51`)

| arquivo | mudança |
|---|---|
| `src/app/cafe-networking/evento.ts` | título, chamada, tema, horário **8h às 10h** (era 10h30), metaDescricao, checkoutDescricao, 5 parágrafos da descrição, agenda de 5 itens, **palestrante Lucas Moraes**, realização, associação "Convidado da Bindflow" |
| `src/lib/produtos.ts` | `descricao` do registry: `8h às 10h30` → `8h às 10h` |
| `public/cafe-networking/banner-bindflow-outubro.jpg` | **novo**: arte do post (1600×900, 233 KB), baixada de `dssbr.com.br/assets/blog/cover-cafe-networking-bindflow-outubro-2026.jpg` |
| `public/cafe-networking/lucas-moraes.jpg` | **novo**: foto de `dssbr.com.br/assets/speakers/speaker-lucas-moraes.jpg` (800×800), recortada no rosto e reduzida pra 400×400 (22 KB) |
| `public/cafe-networking/banner-outubro.jpg` | **removido** (arte da Arlequim) |
| `docs/EVENTOS-PRESENCIAIS.md` | tabela "em cartaz" + histórico |

Detalhes que valem registro:

- **O arquivo da arte tem nome novo em vez de sobrescrever o antigo.** Com o mesmo nome, o
  otimizador de imagem do Next e os crawlers de OG (WhatsApp, LinkedIn) poderiam continuar servindo
  a arte da Arlequim do cache.
- **A seção "Quem apresenta" voltou sozinha.** Na versão da Arlequim, `palestrantes: []` a
  escondia. Com o Lucas na lista, ela aparece, sem mexer em componente.
- **A foto foi recortada** porque o componente mostra 64×64 com `rounded-full object-cover`. A
  foto original tem muito fundo, e sem o recorte o rosto ficaria pequeno no círculo.
- **O texto de preço veio do sistema, não do post.** O post não fala em preço. Mantive Geral R$ 30
  (3x) e Convidado grátis, a decisão de 05/09.
- O e-mail de confirmação (`lib/email/conteudo.ts`) não cita a empresa nem a data, então não mudou.

## 4. O deploy foi bloqueado duas vezes, e o Binhara rodou

O `npx vercel --prod --yes` foi **negado duas vezes pelo classificador do modo automático**
("Production Deploy"). Na primeira vez, a negação levou junto o `git commit` do mesmo comando
encadeado: o commit teve que ser refeito sozinho.

Enquanto isso, o Binhara abriu o checkout em prod e viu a arte e o texto da Arlequim. A página
estava certa, só não tinha subido. Quem subiu foi ele, pelo prompt:

```
! cd web && npx vercel --prod --yes
```

**Lições:**
- Não encadear commit e deploy no mesmo comando. Se o deploy for negado, o commit cai junto.
- Quando o deploy for negado, avisar na **primeira linha** que o site no ar ainda está velho. Senão,
  quem abre a página acha que a mudança saiu errada.

## 5. Verificado

**Local (`next start` na 3123, build de prod):** 0 "Arlequim", 0 "10h30", seção "Quem apresenta"
presente, R$ 30,00 + Grátis, foto e arte com 200, `?tipo=convidado` com "Convidado da Bindflow",
screenshot a 1440px conferido.

**Prod (depois do deploy):**

| página | Arlequim | Bindflow | arte nova | "10h30" |
|---|---|---|---|---|
| `/cafe-networking` | 0 | 28 | ✓ | 0 |
| `/cafe-networking/inscricao` | 0 | 12 | ✓ | 0 |
| `/cafe-networking/inscricao?tipo=convidado` | 0 | 14 | ✓ | 0 |

Também em prod: Geral R$ 30,00 e Grátis nos cards; `lucas-moraes.jpg` e `banner-bindflow-outubro.jpg`
com 200 `image/jpeg`; `/gubigdata` sem regressão (24 de setembro, R$ 30,00).

## 6. Armadilhas desta sessão

- **No `grep` deste ambiente (ugrep), padrões com `.{0,80}` estouram o limite de complexidade**
  ("exceeds complexity limits"). Pra extrair texto de página, usar Python com `re` + `html.unescape`,
  ou `command grep` com padrão simples.
- **O Python do sistema imprime um traceback de `_distutils_hack`** em toda execução. É ruído do
  `.pth`: o script roda normalmente (o PIL 12.2 está disponível pra recortar imagem).
- **`/admin/vendas` filtra produto por `?curso=`**, não `?produto=`. Com o parâmetro errado, a lista
  devolve todas as vendas (161) e parece que o produto tem vendas.
- Receita de screenshot: `playwright-core` do `node_modules` + o `chrome-headless-shell` em
  `node_modules/.pnpm/playwright-core@1.60.0/.../.local-browsers/chromium_headless_shell-1223/`.

## Fica pendente

**Desta sessão:**

- **Colar o link no post do DSSBR:** `https://www.azuris.com.br/cafe-networking`. O post da
  Bindflow ainda diz "Inscrições em breve" (e o CTA está comentado no HTML). O post fica no site do
  DSSBR, fora deste repo.
- **`git push`** (4 commits): aguarda o OK.
- O post diz "vagas limitadas pela capacidade do espaço", e o sistema continua sem `limite_qtd`
  (decisão de 05/09). Se lotar, o checkout segue aceitando inscrição.

**De 15/09:** marcar as notas já emitidas (backlog de 53 em 18/09, nenhuma marcada).

**De 14/09, ainda sem resposta:** Business 30 × 40 · VIP/Business incluem o FullPass? · botões do
dssbr.com.br · FullPass Lote 3 887 × 820 e One Day 350 × 357.

**Datas:** **GU 24/09** → depois, desligar `gubigdata-2026-09` (ids 35/36) · **café 06/10
(Bindflow)** → depois, desligar os tipos 50/51 · DSS **27–29/10**.

**Código, de antes:** filtro "ingresso gerado" · cupom VIP/Business · bug do bloco "Regerar" ·
`CUPOM_SECRET` na Vercel · PostHog sem chave · fluxo pago do café sem 1 PIX real · deploy na mão
+ push separado.

Última revisão: **2026-09-18**.
