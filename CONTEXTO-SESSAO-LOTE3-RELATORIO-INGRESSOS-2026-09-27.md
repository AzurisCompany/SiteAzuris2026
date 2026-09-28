# Sessão 2026-09-27: relatório de ingressos do DSSBR e virada pro Lote 3

**Tipo:** releitura, depois um relatório de vendas do congresso (por quantidade), depois a
virada de preço do FullPass, do One Day e do combo pro último lote.

**Estado do repo ao fim:** `main` **6 commits à frente de `origin/main`** (os 2 de 15/09, os 2 de 18/09,
`cf8da5e` e o de docs desta sessão). O push aguarda o OK do Binhara.

| commit | o quê |
|---|---|
| `cf8da5e` | feat(dss): vira o lote. One Day Lote 3 (R$357) e combo FullPass+curso R$850 |
| *(este)* | docs: contexto de 27/09 + catálogo de preços no Lote 3 |

**Banco de prod:** mudou pela API do admin (FullPass Lote 3; ver §3). **Migração:** nenhuma.
**Deploy:** ⏳ **pendente.** O modo automático nega `vercel --prod`. Até rodar o deploy, o One Day
continua cobrando R$ 290 e o combo continua em R$ 750:

```
! cd /mnt/d/2026/siteAzuris2026/web && npx vercel --prod --yes
```

**Testes:** 293/293 (27 arquivos). Build de prod limpo. Os erros de lint e tsc que aparecem já existiam
(`dssbr-2026/page.tsx:506` `<a href="/">`, `checkout-produto.test.ts` sem `oculto`) e não vêm
desta mudança.

---

## 0. Releitura

- O GU de 24/09 **passou e o checkout continua vendendo** (`/gubigdata/inscricao` ainda mostra 24 de
  setembro, R$ 30). É a mesma armadilha do encontro de 26/08. **Desligar os tipos 35/36 de
  `gubigdata-2026-09`**. Isso foi oferecido e ainda não foi feito.
- `/cafe-networking` está certo (Bindflow, R$ 30).

## 1. Relatório de ingressos do congresso (por quantidade, em 27/09)

Pedido: *"relatório completo de venda dos ingressos por tipos, a quantidade já paga e em aberto,
incluindo os ingressos de quem comprou o curso"*.

| Tipo | Pagos | A vencer | Vencidos |
|---|---:|---:|---:|
| FullPass | **113** | 28 | 13 |
| ↳ site | 52 | 1 | 6 |
| ↳ empresas (cobrança manual) | 48 | 27 | 7 |
| ↳ bônus do curso Lakehouse | 12 | – | – |
| ↳ estudante | 1 | – | – |
| One Day | **12** | 2 | 1 |
| VIP | **3** | 2 | – |
| Business | **5** | 1 | 1 |
| **Total** | **133** | **33** | **15** |

### Como os números foram montados (pra refazer)

- **Fonte:** `/admin/vendas?curso=<slug>&page=N` de prod, com login pela API (ver
  [[reference_operar_prod_via_admin_api]]). Raspei só produto, tipo, valor, forma e status.
  Nome e e-mail ficaram de fora. Os totais bateram com o contador da página
  (58 + 13 + 5 + 4 = 80 vendas do site).
- **Slugs do congresso:** `dss-2026`, `dss-one-day-2026`, `dss-vip-2026`, `dss-business-2026`,
  `dss-fullpass-curso-2026` (0 vendas), `dss-one-day-curso-2026` (0).
- **Uma linha pode ser mais de um ingresso.** `dss-2026` Lote 1 R$ 2.166 = 4 × 570 × 0,95, e One Day
  R$ 494 = 2 × 247. Deduzi do valor.
- **Cobranças manuais (`?curso=proposta`, 29 linhas):** a quantidade sai da descrição
  (`como_conheceu`, "Cobrança manual: DSSBR - 4 ingressos fullpass"), lida em
  `/admin/vendas/<id>`. Casos decididos pelo Binhara:
  - DOT Digital Group (ids 48/49/50, R$ 437,50 cada): **1 ingresso por cobrança**.
  - id 34 (R$ 2.538, descrição = só o CNPJ): **6 FullPass** (2.538 ÷ 423 = 470 com 10% off).
  - Patrocínio COTA RUBI + Estande Prata (ids 106 e 157, R$ 10.000 cada, pagos) **inclui
    ingressos**, mas **a quantidade não foi informada**. Isso ficou fora da conta.
- **Curso Lakehouse:** 12 compras pagas, todas antes de 25/08. Enquanto o bônus valia, cada uma
  levava 1 FullPass. Depois de 25/08 ninguém comprou. Nos pacotes de empresa com vaga no curso
  (ids 35, 57, 105, 218, 237), contei só os FullPass escritos na descrição.

### Pontos em aberto do relatório

1. Quantos ingressos vêm no patrocínio.
2. Os ids 35 (10/07, R$ 3.572) e 105 (04/08, R$ 4.351,83 em 3x) dizem os dois "9 FullPass + 1 vaga
   curso". Se forem o mesmo pedido, os pagos caem de 133 pra **124**.
3. O id 237 (pendente, 23/09) repete a descrição e o valor do 209 (pago, 21/09). Pode ser cobrança duplicada.
4. Os vencidos são, em boa parte, cobranças refeitas (ex.: 55/58 venceram e o 63 pagou os mesmos 2).
   Por isso ficam numa coluna à parte e não entram como venda perdida.
5. Não cruzei nomes, então quem comprou curso **e** ingresso pode estar contado duas vezes.

## 2. Virada de lote: decisões do Binhara

| ingresso | antes | depois | onde vive |
|---|---|---|---|
| FullPass | Lote 2 R$ 670, âncora R$ 820 | **Lote 3 R$ 887, sem âncora** | banco (`/admin/ingressos`) |
| One Day | Lote 2 R$ 290, âncora R$ 357 | **Lote 3 R$ 357, sem âncora** | código (`produtos.ts` + `one-day/lotes.ts`) |
| Combo FullPass + curso | R$ 750 | **R$ 850** | código (`produtos.ts`) |
| Estudante (oculto) | R$ 400, âncora R$ 670 | R$ 400, âncora **R$ 887** | banco (ajuste meu, pra âncora seguir o lote vigente) |

A divergência de 14/09 entre o dssbr.com.br e o checkout foi resolvida assim: **FullPass = 887** (valor
do dssbr.com.br) e **One Day = 357** (valor do checkout; o dssbr.com.br dizia 350).

⚠️ **Com isso, o combo (R$ 850) sai mais barato que o FullPass sozinho (R$ 887).** Foi uma escolha
explícita. A regra antiga dizia que o portal entrava por R$ 80. A nota da página agora diz "O FullPass
sozinho sai por R$ 887 — no combo, com o portal do curso junto, fica R$ 850", e o canário
`precos-lakehouse.test.ts` trava `combo < fullpass` e `combo = 85000`.

## 3. O que foi feito

**Banco de prod (API do admin, sem deploy; valeu na hora):**
- `POST /api/admin/ingressos` criou `lote-3` (id **107**): 88700, `preco_de` 0, 3x, `ordem` 0,
  `limite_qtd` null, ativo.
- `lote-2` (id 30): `ativo:false`, o resto reenviado igual (o upsert troca o registro inteiro).
- `estudante` (id 20): `preco_de_centavos` 67000 → 88700.
- Conferido no ar: `/dssbr-2026/inscricao` mostra a escada 570 (riscado), 670 (riscado), 887
  (vendendo agora), sem o degrau "No dia". A landing mostra R$ 887.

**Código (`cf8da5e`):**

| arquivo | mudança |
|---|---|
| `src/lib/produtos.ts` | `dss-2026` fallback 88700, âncora 0 · `dss-one-day-2026` 35700, âncora 0 · `dss-fullpass-curso-2026` 85000 |
| `src/app/dssbr-2026/one-day/lotes.ts` | `atual` → Lote 3 |
| `src/app/dssbr-2026/one-day/page.tsx` | meta "Lote 3 por R$ 357" |
| `src/app/dssbr-2026/fullpass-curso/page.tsx` | meta R$ 850 + nota nova |
| `src/app/dssbr-2026/page.tsx` | "Ingressos a partir de R$ 357" (era 290), comentários |
| `src/lib/admin-queries.ts` | dica da cobrança avulsa: sem a âncora ia virar "Lote 2 · preço cheio R$ 0,00" |
| `src/lib/__tests__/precos-dss.test.ts` | lote vigente 88700; âncora só é checada **se existir** |
| `src/lib/__tests__/precos-one-day.test.ts` | no último lote, a âncora é 0 |
| `src/lib/__tests__/precos-lakehouse.test.ts` | combo R$ 850, **abaixo** do FullPass |
| `src/lib/__tests__/cobranca-manual.test.ts` | a dica cita "Lote 3" |

Docs: [`CATALOGO-PRECOS-E-VENDAS`](./docs/CATALOGO-PRECOS-E-VENDAS.md) (tabelas de tipos, preço único,
escada §7.1).

## 4. Links dos checkouts

| ingresso | link | preço |
|---|---|---|
| FullPass | https://www.azuris.com.br/dssbr-2026/inscricao | R$ 887 |
| One Day | https://www.azuris.com.br/dssbr-2026/one-day | R$ 357 *(depois do deploy)* |
| FullPass + curso | https://www.azuris.com.br/dssbr-2026/fullpass-curso | R$ 850 *(depois do deploy)* |
| VIP | https://www.azuris.com.br/dssbr-2026/vip | R$ 957 → 1.275 → 1.657 por quantidade |
| Business | https://www.azuris.com.br/dssbr-2026/business | R$ 757 → 984 → 1.279 por quantidade |
| Estudante (oculto) | https://www.azuris.com.br/dssbr-2026/inscricao?tipo=estudante | R$ 400 |
| Vitrine | https://www.azuris.com.br/dssbr-2026 | |

## 5. Armadilhas desta sessão

- **`/admin/vendas?manual=1` não filtra**, devolve tudo. Pra listar as cobranças manuais, use `?curso=proposta`.
  As cobranças manuais com produto escolhido (DSS, VIP…) caem no slug do produto e já entram
  na contagem dele.
- A descrição da cobrança manual só aparece no detalhe, na linha "Como conheceu"
  (`descricaoManual(como_conheceu)`). A lista não mostra.
- **Dois comandos com `replace` do mesmo texto no mesmo arquivo:** o 1º já troca todas as
  ocorrências, e o 2º `assert` falha e aborta a escrita do arquivo inteiro. Conferir `git diff --stat`.
- `vitest` + `tsc` + `eslint` juntos passam de 120 s: rodar em background.
- O canário `cobranca-manual.test.ts` pegou a dica "preço cheio R$ 0,00". **Âncora 0 é um estado
  válido agora**, e qualquer texto que interpola `precoDeVendaCentavos` precisa tratar o caso sem âncora.

## Fica pendente

**Desta sessão:**
- **Deploy** (comando no topo). Depois, conferir no ar: `/dssbr-2026/one-day` com R$ 357 e sem 290;
  `/dssbr-2026/fullpass-curso` com R$ 850; landing com "a partir de R$ 357".
- **dssbr.com.br:** atualizar os cards pra FullPass R$ 887, One Day R$ 357 e combo R$ 850.
  O `DSS-2026-LINKS-CHECKOUT-VIP-BUSINESS.md` (na raiz, fora do repo) já foi anotado.
- As cobranças manuais em aberto continuam com o valor antigo. Só as novas usam o preço novo.
- Relatório: número de ingressos do patrocínio · se 35/105 são o mesmo pedido · se 237 é duplicata do 209.
- **Desligar os tipos 35/36 do GU de 24/09** (continua vendendo).
- `git push` (6 commits).

**Herdado:** colar o link do café no post do DSSBR · marcar as NFs emitidas · Business 30 × 40 ·
VIP/Business incluem FullPass? · café 06/10 → desligar os tipos 50/51 depois · DSS **27–29/10**.

Última revisão: **2026-09-27**.
