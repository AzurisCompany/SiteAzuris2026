# Ingresso oculto (“só por link”) — e o Estudante do DSS 2026

> Extensão do catálogo de tipos de ingresso ([ADMIN-VENDAS-COBRANCA-INGRESSOS.md](./ADMIN-VENDAS-COBRANCA-INGRESSOS.md),
> Onda C). Aqui só o que é novo: a flag `oculto` e o que ela sustenta.

Um tipo de ingresso pode ficar **fora da vitrine**: não aparece na lista do checkout,
e só é vendido pra quem chega com `?tipo=<tipo_id>` na URL. É o que permite ter um
**Estudante a R$ 400** convivendo com o **Lote 1 a R$ 570** sem transformar os R$ 400
no preço aberto de todo mundo.

## Schema

```sql
ALTER TABLE tipos_ingresso ADD COLUMN IF NOT EXISTS oculto BOOLEAN NOT NULL DEFAULT false;
```

Aditiva e idempotente: todo tipo que já existia continua visível (`false`).

## As duas funções que sustentam a regra

| | o que faz |
|---|---|
| `listarTiposPublicos(slug)` | vitrine: `ativo = true AND oculto = false`. **Era `listarTiposAtivos`** — o nome mudou porque “ativo” deixou de ser sinônimo de “aparece”. |
| `aplicarTipoDoLink(publicos, pedido, doLink, hoje, inscritos)` | decide o que o `?tipo=` concede. Regra PURA, testada em `src/lib/__tests__/tipos-ingresso.test.ts`. |

`aplicarTipoDoLink` devolve `{ tipos, selecionado, recusa }`:

- link válido → o oculto **entra** na lista (ordenado por `ordem`) e já vem selecionado;
- id inexistente → `recusa: 'inexistente'`;
- esgotado / fora de prazo / desligado → `recusa: 'indisponivel'`;
- link pra um tipo que já está na vitrine → só pré-seleciona, sem duplicar card.

**Recusa nunca vira página de erro.** Cai na vitrine, no preço cheio, com uma tarja
explicando o motivo — mesma filosofia do cupom vencido ([CUPONS-DESCONTO.md](./CUPONS-DESCONTO.md)).
Perder a venda porque o link envelheceu seria o pior desfecho.

O preço continua **derivado no servidor** em `processarCheckout` (`getTipo` +
`valorCobradoDoTipo`): o client manda o `tipo_id`, nunca um valor.

## Onde vale

- `/dssbr-2026/inscricao?tipo=<id>` — seletor com o oculto incluso e marcado.
- `/gubigdata/inscricao?tipo=<id>` — mesma regra (a página já lia `?tipo=` pra pré-seleção).
- Vitrines que **não** enxergam oculto: a landing `/dssbr-2026` (preço “a partir de”),
  a lista do checkout e o `/preparatorio-dados/reserva`.

## Como criar/desligar (admin, sem deploy)

`/admin/ingressos` → marque **“Oculto — some da lista do checkout; só compra quem
recebe o link”**. O painel mostra o link pronto e um botão **copiar link**; na tabela,
tipo oculto ganha a tarja **só por link**.

Desligar é o mesmo botão `ativo` de sempre — e mata o link na hora, inclusive os já
distribuídos.

## O Estudante do DSS 2026

| campo | valor |
|---|---|
| `produto_slug` / `tipo_id` | `dss-2026` / `estudante` |
| preço | R$ 400,00 (PIX ou cartão; até 3x, 2x–3x com juros) |
| âncora “de” | R$ 570,00 (o Lote 1 vigente) |
| lotação | **50** (conta pagas + pendentes, sem `is_teste`) |
| prazo | nenhum |
| link | `https://azuris.com.br/dssbr-2026/inscricao?tipo=estudante` |

## Armadilhas

- **O link não é segredo.** Quem adivinhar `?tipo=estudante` compra pelo mesmo preço —
  a assinatura HMAC dos cupons não existe aqui. A barreira real é a **conferência do
  comprovante de matrícula na entrada do evento**; a descrição do tipo avisa isso no card.
  Se um dia isso vazar a ponto de doer, o caminho é revogar (`ativo=false`) e recriar com
  outro `tipo_id`.
- **`tipo_id` é chave lógica e fica gravado em `inscricoes.tipo_ingresso`.** Trocar o id
  quebra o link distribuído e desliga o ingresso do histórico. Renomeie o `nome` à vontade.
- **`limite_qtd` conta pendente**: quem abandonou o checkout ocupa vaga até a cobrança vencer.
- **Oculto ≠ inativo.** Inativo não vende de jeito nenhum; oculto vende, só não se anuncia.
- A migração precisa rodar **depois** do deploy (`POST /api/admin/migrate`). Entre um e
  outro, o checkout do DSS cai no preço único do registry — que hoje é o mesmo R$ 570,
  então a janela é invisível pra quem compra.

Última revisão: **2026-08-14**.
