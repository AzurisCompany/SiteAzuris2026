# Cupons de desconto — vendedoras e parceiros

Duas situações, um mecanismo:

- **Vendedora**: entra em `/vendas`, digita a senha dela e recebe um link **novo**, com prazo
  (48h por padrão), pra mandar pro cliente. Um por cliente, quantos quiser.
- **Parceiro**: recebe de você um link **fixo**, sem prazo (`?c=CODIGO`), pra divulgar. Ele não
  acessa nada — você copia o link na aba e manda.

Nos dois casos o desconto sai do preço no servidor, e **desligar o cupom no admin derruba os
links na hora**, inclusive os que já estão na mão de cliente.

- **Aba do admin:** `/admin/cupons` — cadastro, ligar/desligar e quanto cada um já vendeu
- **Página da vendedora:** `/vendas` (noindex, `Disallow` no robots)
- **Código:** `src/lib/cupom.ts` (token) · `src/lib/cupons.ts` (tabela + regra) ·
  `src/app/api/vendas/link/route.ts` · `src/app/api/admin/cupons/route.ts`
- **Testes:** `src/lib/__tests__/cupom.test.ts` e `cupom-checkout.test.ts`

---

## 1. A regra que sustenta tudo

**O link concede um percentual, nunca um preço.** Quem calcula quanto se paga é sempre o
servidor, em `processarCheckout()`. O desconto entra no **preço do ingresso**, antes das regras
de PIX e parcelamento, então os juros de 2x–3x incidem sobre o valor já com desconto.

```
Lote 1 (admin) R$ 570  →  −10%  →  R$ 513  →  regra de PIX/cartão  →  valor cobrado
```

E **quem manda no percentual é a linha da tabela, não o token**. Mudar 15% pra 12% no admin
muda os links que já estão na rua.

## 2. As duas formas de chegar com desconto

| | Vendedora | Parceiro |
|---|---|---|
| URL | `?d=<token assinado>` | `?c=CODIGO` |
| Prazo | `validade_horas` (48) | nenhum (`NULL`) |
| Quem gera | ela, em `/vendas`, um por cliente | você, uma vez, na aba |
| Morre quando | vence sozinho | só quando você desliga |

**O código da vendedora não vale como `?c=`.** Sem essa trava, bastaria usar o código dela numa
URL pra ter um link permanente e furar as 48h. Cupom com `validade_horas` só circula assinado.

## 3. Por que o token da vendedora é assinado

`base64url("codigo|produto|pct|expira_em") + "." + HMAC-SHA256 truncado`.

A validade está **dentro do que é assinado**: esticar a data quebra a assinatura. É isso que
permite prazo por link sem guardar uma linha por link gerado.

**Segredo:** `CUPOM_SECRET`, com fallback pra `ADMIN_SESSION_SECRET` e depois `ADMIN_PASSWORD`.
Sem nenhum dos três, nada é assinado e nada é aceito (falha fechada).

**Teto rígido:** `CUPOM_PCT_MAX = 20`, conferido na leitura do token **e** na gravação do
cadastro. Token pedindo 90% é recusado mesmo assinado.

## 4. O que o cliente vê

| Situação | Página |
|---|---|
| Link válido | Tarja verde com o preço de/por e, se houver prazo, até quando vale |
| Vencido, desligado, esgotado ou adulterado | Nota discreta de "expirou" e o checkout **normal**, no preço cheio |

Link morto **nunca** vira página de erro. Perder a venda porque o cupom expirou seria o pior
desfecho possível.

## 5. Atribuição (de onde sai a comissão)

Com cupom válido, o servidor **sobrescreve** a origem:

| coluna | valor |
|---|---|
| `utm_source` | `vendedora` ou `parceiro` |
| `utm_medium` | `link` |
| `utm_content` | o **código** do cupom |
| `utm_campaign` | o que veio na URL, preservado |

São colunas que já existem em `inscricoes` — aparecem no `/admin`, na venda e no CSV de
contatos. A aba de cupons soma por aí: `usos` conta paid+pending (pendente já ocupa vaga do
limite), a receita conta só o que entrou.

A cobrança no Asaas fica carimbada: descrição ganha `— desconto 10%` e o `externalReference`
vira `dss-2026:lote-1:cupom-<codigo>`.

**Abas de origem em `/admin/vendas` (2026-08-14):** a faixa "Origem" (abaixo das abas de
produto, e combinável com elas) filtra por esse mesmo `utm_source` — **Link de vendedora**
e **Parceiro**, com contagem. Nelas a tabela ganha a coluna **Cupom** (`utm_content`), que
é quem vendeu. A lista de abas sai de `TIPOS_CUPOM` (`lib/cupons.ts`): tipo novo de cupom
nasce com aba. Copiar e-mails e o CSV de contatos respeitam os filtros, então já saem por
aba. Um canário em `cupom-checkout.test.ts` amarra o `utm_source` gravado ao valor que a
aba filtra — se desencontrarem, a aba fica muda e "0 vendas" parece plausível.

⚠️ **Trocar o código de um cupom zera o histórico dele** — as inscrições antigas continuam
gravadas com o código velho. Renomeie o `nome` à vontade; o código, não.

## 6. Tabela `cupons`

| campo | pra quê |
|---|---|
| `codigo` | normalizado em minúsculas; é a chave lógica |
| `nome` | quem é (aparece na aba, não no link) |
| `tipo` | `vendedora` \| `parceiro` |
| `produto_slug` | um cupom vale pra **um** produto |
| `pct` | desconto inteiro, teto de 20 |
| `validade_horas` | `NULL` = link sem prazo |
| `limite_usos` | `NULL` = ilimitado |
| `ativo` | **o botão de matar** |

Migração aditiva e idempotente, em `sql/admin-migration.sql` e espelhada em
`POST /api/admin/migrate` (é por essa rota que roda em produção).

## 7. Como testar de ponta a ponta (local)

```bash
cd web && npx next dev -p 3111

# senha = ADMIN_PASSWORD do .env.local
curl -s -c /tmp/cj -X POST localhost:3111/api/admin/login \
  -H 'Content-Type: application/json' -d '{"senha":"SUA_SENHA"}'
curl -s -b /tmp/cj -X POST localhost:3111/api/admin/migrate    # cria a tabela

curl -s -b /tmp/cj -X POST localhost:3111/api/admin/cupons -H 'Content-Type: application/json' \
  -d '{"nome":"Celeste","codigo":"CEL01","tipo":"vendedora","produto_slug":"dss-2026","pct":10,"validade_horas":48}'
curl -s -b /tmp/cj -X POST localhost:3111/api/admin/cupons -H 'Content-Type: application/json' \
  -d '{"nome":"Parceiro X","codigo":"PARC15","tipo":"parceiro","produto_slug":"dss-2026","pct":15,"validade_horas":null}'

curl -s -X POST localhost:3111/api/vendas/link -H 'Content-Type: application/json' -d '{"codigo":"CEL01"}'

curl -s "localhost:3111/dssbr-2026/inscricao?d=<token>"  | grep -o "513,00" | head -1
curl -s "localhost:3111/dssbr-2026/inscricao?c=PARC15"   | grep -o "484,50" | head -1
```

## 8. Decisões e contrapartidas

- **A tabela guarda a regra, não os links.** Não existe linha por link gerado — por isso o prazo
  da vendedora vive dentro da assinatura, e não no banco.
- **Código de parceiro é curto e adivinhável de propósito** (`GAIO15`): ele precisa divulgar. A
  defesa é o botão de desligar e o limite de usos, não o sigilo.
- **`limite_usos` conta pending.** Quem abandonou o checkout ocupa vaga até a cobrança vencer.
  É o mesmo critério da lotação de ingresso, para não vender além do combinado.
- **Sem sessão em `/vendas`.** O código É a credencial. A rota atrasa 400ms em erro e devolve
  mensagem única.
- **Histórico anterior a 13/08/2026:** o cadastro morava numa caixa de texto em
  `/admin/financeiro` (chave `vendedoras` da `config_financeiro`), sem revogação e sem painel.
  Foi substituído por esta tabela; a chave velha ficou órfã no banco e pode ser apagada.

Última revisão: **2026-08-13**.
