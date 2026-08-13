# Link de desconto pras vendedoras (FullPass DSS 2026)

Uma vendedora abre `/vendas`, digita o código dela e recebe um link pronto pro cliente com
**10% de desconto** no FullPass, **válido por 48 horas**. Ninguém precisa entrar no admin, e
ninguém digita preço em lugar nenhum.

- **Página da vendedora:** `/vendas` (noindex, fora do menu, `Disallow` no robots)
- **Link gerado:** `/dssbr-2026/inscricao?d=<token>&utm_source=vendedora&utm_medium=link&utm_content=<slug>`
- **Cadastro de quem pode gerar:** `/admin/financeiro` → seção *Vendedoras (link com desconto)*
- **Código:** `src/lib/cupom.ts` · rota `src/app/api/vendas/link/route.ts` · testes em
  `src/lib/__tests__/cupom.test.ts` e `cupom-checkout.test.ts`

---

## 1. A regra que sustenta tudo

**O link concede um percentual, nunca um preço.** Quem calcula quanto se paga é sempre o
servidor, em `processarCheckout()` — o mesmo lugar de sempre. O desconto entra no **preço do
ingresso**, antes das regras de PIX e parcelamento, então os juros de 2x–3x incidem sobre o
valor já com desconto.

```
Lote 1 (admin) R$ 570  →  −10%  →  R$ 513  →  regra de PIX/cartão  →  valor cobrado
```

Se algum dia alguém for tentado a mandar o valor pelo body do POST: não. O cliente edita.

## 2. Como o link expira sem banco nem cron

O token é `base64url("vendedora|produto|pct|expira_em") + "." + HMAC-SHA256 truncado`.

A validade está **dentro do que é assinado**. Esticar a data, trocar o percentual ou mudar o
produto quebra a assinatura, e `lerCupom()` devolve `null`. Não existe estado pra guardar, nem
job pra rodar: o link morre de velhice sozinho.

**Segredo:** `CUPOM_SECRET`, com fallback pra `ADMIN_SESSION_SECRET` e depois `ADMIN_PASSWORD`
— por isso funciona sem env nova. Sem nenhum dos três, nada é assinado e nada é aceito (falha
fechada, nunca aberta).

**Teto rígido:** `CUPOM_PCT_MAX = 20`. Um token pedindo 90% é recusado na leitura, mesmo que
venha assinado. Se o segredo vazar, o estrago para em 20%.

## 3. O que o cliente vê

| Situação | Página |
|---|---|
| Link válido | Tarja verde: *"Desconto de 10% aplicado · ~~R$ 570~~ R$ 513 · vale até 15/08 às 12h29"*, e todos os valores já com desconto |
| Link vencido ou adulterado | Nota discreta: *"o link expirou — os valores abaixo são os normais"* e o checkout **normal**, no preço cheio |

Link vencido **nunca** vira página de erro. Perder a venda porque o cupom expirou seria o pior
desfecho possível.

## 4. Atribuição (de onde sai a comissão)

Com cupom válido, o servidor **sobrescreve** a origem:

| coluna | valor |
|---|---|
| `utm_source` | `vendedora` |
| `utm_medium` | `link` |
| `utm_content` | slug da vendedora (`ana-paula`) |
| `utm_campaign` | o que veio na URL, preservado |

São colunas que **já existem** em `inscricoes` — aparecem no `/admin`, na venda, e no CSV de
contatos (`/api/admin/exportar`). Não foi preciso construir relatório nenhum.

A cobrança no Asaas também fica carimbada: descrição ganha `— desconto 10%` e o
`externalReference` vira `dss-2026:lote-1:v-ana-paula`. Sem isso, um R$513 solto no extrato é
adivinhação na hora de conciliar.

## 5. Cadastrar / descadastrar vendedora

`/admin/financeiro` → *Vendedoras (link com desconto)*. Uma por linha:

```
Ana Paula: ANA-7K2M
Carla Souza: CARLA93Z
```

Vale na hora, **sem deploy** (fica na tabela `config_financeiro`, chave `vendedoras`). Aceita
`=` no lugar de `:`, e vírgula no lugar de quebra de linha. Linha malformada é ignorada em
silêncio — por isso a tela mostra, embaixo do campo, **o que o sistema entendeu**. Se o nome de
alguém não aparecer ali, ela não consegue gerar link.

Códigos: use algo com pelo menos 6 caracteres e que não se adivinhe (`ANA-7K2M`, não `ANA123`).
Códigos com menos de 4 caracteres são recusados pelo parser.

**Tirar a linha revoga o acesso na hora** — mas **não** mata links já gerados. Esses vencem
sozinhos em até 48h. É a contrapartida assumida de não ter tabela (seção 7).

## 6. Como testar de ponta a ponta (local)

```bash
cd web && npx next dev -p 3111

# 1. cadastra uma vendedora (senha = ADMIN_PASSWORD do .env.local)
curl -s -c /tmp/cj -X POST localhost:3111/api/admin/login \
  -H 'Content-Type: application/json' -d '{"senha":"SUA_SENHA"}'
curl -s -b /tmp/cj -X POST localhost:3111/api/admin/config \
  -H 'Content-Type: application/json' \
  -d '{"chave":"vendedoras","valor":"Ana Paula: ANA-7K2M"}'

# 2. gera o link
curl -s -X POST localhost:3111/api/vendas/link \
  -H 'Content-Type: application/json' -d '{"codigo":"ANA-7K2M"}'

# 3. confere o preço na página (deve sair 513, não 570)
curl -s "localhost:3111/dssbr-2026/inscricao?d=<token>" | grep -o "513,00" | head -1
```

## 7. Decisões e contrapartidas

- **Sem tabela de cupons.** Escolhido pra não precisar de migração nem CRUD. O preço: link
  vazado não é revogável antes de vencer — o estrago máximo é 10% por 2 dias. Se um dia isso
  incomodar (ou se quiserem "1 uso por link", ou painel de conversão por vendedora), é aí que
  entra a tabela.
- **Sem limite de usos.** A vendedora gera um link por cliente de qualquer jeito, e link de
  1 uso cria o caso chato de quem abandona o checkout e volta com o link queimado.
- **Só o FullPass.** O mecanismo é genérico (`produto` está dentro do token e é conferido na
  leitura), mas hoje só a rota `/api/vendas/link` emite, e só pra `dss-2026`. Estender pro One
  Day é trocar uma constante.
- **Sem sessão em `/vendas`.** O código É a credencial. A rota atrasa 400ms em código errado e
  devolve mensagem única — encarece brute force sem incomodar quem acerta.

Última revisão: **2026-08-13**.
