# Sessão 2026-09-14 — marcar ingresso como gerado na lista de vendas

**Tipo:** releitura do projeto → feature pequena de admin, com migração de prod.

**Estado do repo ao fim:** working tree limpa. Código em `d47732d` + este contexto.
**Deploy:** feito e verificado no ar. **Migração de prod:** 47/47 (era 46).
**Testes:** 255 passando (25 arquivos; eram 252/24). Build limpo.

---

## 1. O pedido

*"quero poder marcar na lista dos ingressos como gerados na coluna de ações... preciso depois
fazer a migração segura"*

## 2. O que entrou

- Botão **"marcar gerado"** na coluna Ação de `/admin/vendas` e no detalhe da venda. Marcado,
  vira **"✓ ingresso dd/mm"** (hora completa no tooltip). Desmarcar pede confirmação.
- Coluna **`inscricoes.ingresso_gerado_em TIMESTAMPTZ`** — `NULL` = não gerado. Remarcar
  preserva a primeira data (`COALESCE`).
- Aparece só em venda **`paid`** (gratuito incluso, porque entra como `paid`) **ou já marcada** —
  marca em venda estornada é o aviso pra revogar o ingresso.
- `POST /api/admin/inscricoes/ingresso-gerado` `{ id, gerado }`.

## 3. Por que a migração é segura

- Aditiva e nullable (`ADD COLUMN IF NOT EXISTS`), no `migrate/route.ts` e no espelho
  `sql/admin-migration.sql`.
- A lista lê via `SELECT *`: **entre o deploy e a migração ela seguiu de pé** (verificado em prod
  — 200 com 44 botões), e o botão responderia 503 "rode a migração" em vez de 500.
- `GET /api/admin/migrate` ganhou `tem_coluna_ingresso_gerado_em`.
- Canário `ingresso-gerado.test.ts`: coluna nas duas migrações, nenhum statement destrutivo
  (DROP/TRUNCATE/DELETE/UPDATE/ALTER COLUMN/RENAME), e `admin-queries.ts` não referencia a coluna.

## 4. Prod

| momento | inscricoes | asaas_eventos | tipos_ingresso | colunas | coluna nova |
|---|---|---|---|---|---|
| antes do deploy | 175 | 180 | 12 | 44 | — |
| deploy, antes da migração | 175 | 180 | 12 | 44 | false |
| depois da migração | 175 | 180 | 12 | 45 | true |

Conferido no ar: marcar e desmarcar a venda **123** (já `is_teste`, paga) → detalhe mostrou
"✓ ingresso 14/09" → desmarcada, voltou a `NULL`.

## 5. Armadilhas desta sessão

- **O login do admin é `{"senha": …}`, não `password`** — com o campo errado responde
  "Senha incorreta." e parece que a senha mudou.
- `vercel --prod` com `| tail` mostrou só o JSON de dicas do fim e pareceu falha; rodei de novo
  e subiram **dois deploys idênticos** do mesmo commit. Conferir com `vercel ls --prod` antes de
  repetir.

## 6. Depois: o CNPJ que virava 8,72889E+13 no CSV

O Binhara abriu o CSV de contatos do DSS no Excel e o `documento` de PJ veio `8,72889E+13`.
CNPJ cru (14 dígitos) o Excel lê como número — e guarda só 15 dígitos de precisão, então **os
arquivos já baixados perderam dígitos de vez**. CPF com zero à esquerda perdia o zero.

Fix `edc42a3`: a coluna sai formatada via `documentoTexto` (o mesmo do "copiar dados do
cliente"), e com ponto/barra o Excel mantém como texto. 4 testes novos (259 no total), sem
migração. Deploy + push feitos. **Não conferido no arquivo de prod**: o curl do export é
bloqueado pelo classificador (dados pessoais) — conferência é baixar pelo `/admin/vendas`.

## 7. Ingressos VIP e Business com lote que vira por quantidade (`a825797`)

Pedido: *"VIP 10 primeiros R$957, depois 15 a R$1275 e último lote 15 a 1657; Business 10 a
R$757, 10 a R$984 e 10 a R$1279 — crie os checkout"*.

- `/dssbr-2026/vip` e `/dssbr-2026/business`, produtos `dss-vip-2026` / `dss-business-2026`.
- Os 3 lotes de cada um são tipos **ativos ao mesmo tempo** com `limite_qtd`, semeados pela
  migração (49/49). `lib/lotes-quantidade.ts` escolhe o primeiro com vaga; o servidor
  (`tipoObrigatorio`) só vende esse — sem tipo 400, lote que fechou 409 com o nome do novo.
- Benefícios copiados dos cards do dssbr.com.br + "tudo do FullPass" (**suposição, a confirmar**).
- Escada do checkout passou a formatar milhar (`1.275`) sem quebrar linha — vale pro FullPass.

**Prod:** antes 176 inscrições / 12 tipos → depois 176 / **18**. Entre deploy e migração as
páginas mostraram "As vendas abrem em instantes" (esperado). Conferido no ar: VIP R$ 957 e
Business R$ 757, "restam 10", lotes 2 e 3 "em breve"; POST sem tipo 400, lote-2 409, lote-1 passa
do portão (parou no CPF inválido de propósito — nenhuma cobrança gerada). FullPass sem regressão.

**Armadilha:** `limite_qtd = 0` no admin vira **sem limite** (a API grava `null`). Pra fechar um
lote, desligue — não zere.

**Em aberto:** Business soma **30**, o card do dssbr.com.br diz "Apenas 40" · confirmar "tudo do
FullPass" · botões "Lista de espera" do dssbr.com.br (`pipeline-azuris.vercel.app/lp/vip` e
`/lp/bussiness`) precisam apontar pros checkouts novos · nenhum PIX real ainda · pendente segura
vaga até 3 dias.

## Fica pendente

- ~~Push~~ feito: `origin/main` == `HEAD`.
- **Baixar de novo o CSV do DSS** — os arquivos antigos têm CNPJ truncado.
- Filtro "ingresso gerado / não gerado" na lista — não feito. Se entrar, a query passa a
  depender da coluna: ajustar o canário e só deployar **com a migração já rodada**.
- `tsc` acusa erro antigo em `checkout-produto.test.ts` (fixture sem `oculto`) — não afeta build.

**De antes, inalterado:** GU 24/09 — desligar os tipos `gubigdata-2026-09` (ids 35/36) depois do
evento · link do café no post do DSSBR · zero PIX real em GU/café/produtos de 25/08 · DSS Lote 2
sem virada marcada · copy pré-evergreen do curso na home · `CUPOM_SECRET` ausente na Vercel ·
bug do "Regerar" · PostHog sem chave · deploy na mão.

Última revisão: **2026-09-14**.
