# Sessão 07/10/2026 — /admin/links (links de venda com botão copiar)

## Estado no fim da sessão

| o quê | estado |
|---|---|
| `/admin/links` (1ª versão) | **EM PROD** — deploy `dpl_9cGverFe8irQkEFQhgDo8tsgcvQ4`, rodado pelo Binhara com `!` |
| preço do lote vigente em VIP/Business | **EM PROD** (subiu com o deploy do One Day, `n45w4lth9`); não visto renderizado (atrás do login) |
| **Passe One Day encerrado** | **EM PROD** — `f10f6bc`, deploy `n45w4lth9`, push feito; verificado no ar (seção 7) |
| tipos do café 06/10 (50, 51) e GU 24/09 (35, 36) | **AINDA LIGADOS** em prod — vendendo evento que já passou; aguardando OK do Binhara pra desligar |

`main` = `origin/main` = produção.

## 1. Pedido

Binhara não achava onde copiar o link da camiseta de palestrante (`/dssbr-2026/camiseta`, noindex,
fora da landing). Solução: página **Links** no menu do admin, com todos os checkouts. Doc:
`docs/ADMIN-LINKS-DE-VENDA.md`.

## 2. Conferido no ar (1ª versão)

Login pela API do admin → `/admin/links` 200, 19 links, incluindo
`/dssbr-2026/inscricao?tipo=estudante` (R$ 400, montado do tipo oculto do banco). Preços vistos:
One Day 357 · FullPass 887 · combo 850 · camiseta palestrante 55 · congressista 70 · ETT 67 ·
GU/café 30 · Business 984–1.279 · VIP 1.275–1.657 (faixa → motivou a correção do item 3).

## 3. Correção pós-deploy (não está no ar)

VIP/Business mantêm os lotes todos ativos (vira por quantidade), então "menor a maior" enganava.
Agora a página usa `escadaPorQuantidade` + `contarInscritosPorTipo` e mostra
"R$ 1.275,00 · Lote 2 · N vagas"; escada sem vaga → selo "esgotado". Lint ok; não visto renderizado.

## 4. Achado: eventos passados ainda à venda

A página não acusou "sem tipo ativo" no café nem no GU. Consulta em `GET /api/admin/ingressos`:

| id | produto | tipo | preço |
|---|---|---|---|
| 50 | cafe-networking-2026-10 | geral | R$ 30 |
| 51 | cafe-networking-2026-10 | convidado | grátis |
| 35 | gubigdata-2026-09 | geral | R$ 30 |
| 36 | gubigdata-2026-09 | associado | grátis |

Desligar = `ativo=false` em `/admin/ingressos` (ou `POST /api/admin/ingressos`, upsert do registro
**inteiro**). Não feito: pede confirmação.

## 5. Verificação

- `links-venda.test.ts`: 21/21.
- `tsc --noEmit`: 1 erro em `src/lib/__tests__/checkout-produto.test.ts:26` (fixture sem `oculto`),
  arquivo já commitado e não tocado nesta sessão — pré-existente, não corrigido.
- eslint dos arquivos novos: limpo.

## 6. Pendências herdadas (sem mudança)

PIX na chave CNPJ (decisão aberta) · card Business "40 ingressos" × 30 no banco · prazo camiseta
20/10 × 15/10 · 409 de 1 ingresso por CPF não testado com POST real · ~50 NFs a emitir.

## 7. One Day encerrado (fim da sessão)

Pedido: "encerre as vendas do ingresso one day". Mesmo caminho do combo One Day + curso (25/08):

- `/dssbr-2026/one-day` → `permanentRedirect('/dssbr-2026/inscricao')` (308 pro FullPass; o link circulou).
- `POST /api/dss-one-day/inscricao` removido.
- Landing: card One Day e menção no hero saíram; vitrine = FullPass + combo, `max-w-3xl` 2 colunas.
- `dss-one-day-2026` em `PRODUTOS_ENCERRADOS`, fora do `CHECKOUT_URL`, de `links-venda.ts` e de
  `cupom-produtos.ts`. Fica no registry (histórico) e no seletor da cobrança avulsa.
- `one-day/lotes.ts` e `precos-one-day.test.ts` apagados (sem checkout, sem escada).

Verificação: vitest 320/320, build ok. No ar: `/dssbr-2026/one-day` 308 → `/dssbr-2026/inscricao`;
API 404; landing só com "Garantir FullPass" e "Garantir combo".

Obs.: o 1º `vercel --prod` publicou (`asaeotrm5`) mas a saída truncada não mostrou; rodei de novo
(`n45w4lth9`). Mesmo commit, sem efeito.

PIX do One Day já gerado e não pago continua pagável na fatura do Asaas — webhook confirma normal.

## 8. Ainda aberto

- Tipos 50/51 (café 06/10) e 35/36 (GU 24/09) **ainda ativos** — perguntado de novo, sem resposta.
- Pendências da seção 6 sem mudança.
