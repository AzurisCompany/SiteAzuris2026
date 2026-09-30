# Sessão 2026-09-29 (tarde): camiseta oficial do DSS 2026, valor de palestrante

**Tipo:** produto novo em produção, com uma coluna nova em `inscricoes`. A sessão começou no repo
do site do GU (`siteGu2026v2`) e passou pra cá no pedido da camiseta.

**Estado do repo ao fim:** `main` = `origin/main`, com 2 commits de código (`23861ed`, `6baf030`)
mais este contexto. **Deploys:** 2, os dois verificados no ar (`r13po523j`, depois `8difcrury`).
**Migração de prod:** rodada 2 vezes, 52/52 nas duas. **Testes:** 295 passando (27 arquivos),
eram 293. Build limpo.

---

## 1. O pedido

*"crie um novo produto de compra para venda da camiseta do congresso — valor para palestrantes —
tem que informar o nome, o tamanho (P, M, G, GG) e quantidade — valor R$ 55"*, com a arte em
`materiais/imagemcamisa/imagemcamisa.png`. Depois: *"faltou o XGG"*.

## 2. Como ficou

| | |
|---|---|
| checkout | `/dssbr-2026/camiseta`: link direto, `noindex`, fora da landing |
| API | `POST /api/dss-camiseta/inscricao` → `processarCheckout('camiseta-dss-2026')` |
| tamanhos | tipos `p` · `m` · `g` · `gg` · `xgg` em `/admin/ingressos`, R$ 55, 3x, sem limite, sem prazo |
| quantidade | 1 a 10 por pedido (`quantidadeMax` no registry) |
| cobrança | **preço do tipo × quantidade**, no servidor, antes do parcelamento; Asaas descreve `tamanho G × 3` |
| arte | `public/dssbr-2026/camiseta-oficial.jpg` (PNG de 1,9 MB → JPG de 250 KB, 1531×1027, sem redimensionar) |
| e-mail | caso próprio em `email/conteudo.ts`: tamanho, quantidade e "retirada no credenciamento" |
| painel | aba "Camiseta DSS"; tamanho × quantidade na lista, linhas "Ingresso / tamanho" e "Quantidade" no detalhe; opção na cobrança avulsa (o valor digitado é o **total**) |

Decisões minhas, **ainda não confirmadas pelo Binhara**:
- **Um tamanho por pedido.** Tamanhos diferentes = pedidos separados, e a página avisa. É também
  o que mantém o anti-duplicação (CPF + valor + tipo, janela de 10 min) coerente.
- **Retirada no credenciamento**, sem frete nem endereço de entrega. Está na página e no e-mail.
- O "nome" pedido é o nome de quem compra, e não um nome estampado na camiseta. A arte não mostra
  personalização.

## 3. A coluna `quantidade`, e por que ela é gravada num UPDATE

`ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS quantidade INTEGER` (NULL = 1). O INSERT de
`criarInscricaoPendente` é comum a **todos** os checkouts. Se ele citasse a coluna, qualquer venda
de qualquer produto falharia entre o deploy e a migração. Por isso:

- `gravarQuantidade(id, q)` (`db.ts`) roda **depois** de a cobrança ser criada, só pra produto com
  `quantidadeMax`, dentro de try/catch. Se falhar, a venda segue e a quantidade continua na
  descrição do Asaas.
- O e-mail, sem quantidade gravada, cai em "camiseta oficial" (1 unidade) e não inventa número.
  Há teste pra isso.

O "Por tipo" do painel conta **pedidos** por tamanho, não unidades. A grade de produção tem que
somar a coluna `quantidade`.

## 4. Publicação "segura, com backup e migrações" (pedido explícito)

Receita seguida nas duas vezes:

1. `npx vitest run` + `next build`
2. commit
3. backup em `/mnt/d/2026/siteAzuris2026/backups/<pasta>/`, **fora do git** porque tem dados
   pessoais: integridade (`GET /api/admin/migrate`), CSV de vendas (`/api/admin/exportar?teste=1`),
   tipos, cupons e o deploy de prod anterior (alvo de rollback)
4. deploy
5. conferir no ar
6. `POST /api/admin/migrate`
7. integridade depois, e diff dos tipos contra o backup
8. push

| publicação | backup | inscrições | eventos Asaas | tipos | colunas |
|---|---|---|---|---|---|
| camiseta (P–GG) | `prod-2026-09-29-antes-camiseta` | 254 → 254 | 249 → 249 | 19 → 23 | 46 → 47 |
| XGG | `prod-2026-09-29-antes-xgg` | 255 → 255 | 250 → 250 | 23 → 24 | 47 → 47 |

Nas duas, os tipos que já existiam ficaram **byte a byte iguais** ao backup. Entre uma
publicação e outra entrou uma venda real (254 → 255), que não tem relação com a camiseta.

⚠️ **O CSV não é um dump do banco.** Ele sai com uma linha por pessoa/produto (226 linhas pra 254
inscrições). A restauração completa é a *point-in-time restore* do Neon, pelo painel da Neon.

Entre o deploy e a migração, a página mostra "vendas momentaneamente indisponíveis" com o link do
WhatsApp, e não um formulário que o servidor recusaria. Isso foi verificado nas duas publicações.

## 5. Armadilhas desta sessão

- **O React Compiler (lint) passou a acusar `window.location.href = …`** assim que o componente
  ganhou mais estado. Troquei por `window.location.assign(…)`, que tem o mesmo efeito. Os dois
  erros de `setState` em effect do `InscricaoForm` **já existiam** antes: conferi lintando a
  versão do HEAD numa cópia temporária.
- **O `tsc` acusa `oculto` faltando em `__tests__/checkout-produto.test.ts`.** O erro já existia
  e o vitest passa. Ficou como está.
- **`git stash` + comando longo em background é perigoso.** O `tsc` estourou os 5 min e o
  `stash pop` ficou esperando. Não mexa em arquivo até confirmar o pop.
- **O `.env.local` não tem chave do Asaas.** Um POST válido local cria a inscrição e morre em
  401. Deu pra conferir o valor (3 × G = 16500 centavos) na linha cancelada do banco de teste.
- **O auto mode bloqueia `vercel --prod` de forma intermitente.** Com o OK explícito do Binhara
  ("pode publicar"), passou.
- A grade de tamanhos era `grid-cols-4` fixa, e o XGG quebrava a linha. Agora é uma coluna por
  tipo cadastrado. Conferido a 375 px.

## Fica pendente

**Desta sessão:**
- **Uma compra real** de 1 unidade no PIX, pra exercitar Asaas, webhook, e-mail e gravação da
  quantidade. Depois, marcar como teste no painel. O fluxo pago da camiseta nunca cobrou.
- Confirmar com o Binhara: 1 tamanho por pedido · retirada no credenciamento · "nome" = comprador.
- Distribuir o link aos palestrantes. Ele não é secreto: quem tiver o link compra por R$ 55.

**Herdado (29/09, manhã):**
- Desligar os tipos 35/36 do GU de 24/09, que continua vendendo.
- dssbr.com.br: Business R$ 984, FullPass R$ 887, One Day R$ 357, combo R$ 850.
- Desligar os tipos 50/51 do café depois de 06/10 · DSS **27–29/10**.

Última revisão: **2026-09-30**.
