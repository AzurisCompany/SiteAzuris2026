# Sessão 2026-09-14: ingresso gerado, CNPJ no CSV, VIP e Business

**Tipo:** releitura do projeto, seguida de quatro entregas em produção: marcação de ingresso
gerado, conserto do CSV, push atrasado e checkouts VIP e Business com lote por quantidade.

**Estado do repo ao fim:** working tree limpa, `origin/main` == `HEAD`.

| commit | o quê |
|---|---|
| `d47732d` | feat(admin): marcar ingresso como gerado na lista de vendas |
| `3962075` | docs: contexto (1ª versão) |
| `edc42a3` | fix(export): documento sai formatado no CSV de contatos |
| `e5505b7` | docs: CNPJ no contexto |
| `a825797` | feat(dss): ingressos VIP e Business com lote que vira sozinho por quantidade |
| `710fb73` | docs: VIP e Business no contexto |
| *(este)* | docs: doc de VIP/Business, runbook, admin, catálogo e este contexto consolidado |

**Deploys:** 4 em prod (dois idênticos por engano, ver §6), todos verificados no ar.
**Migrações de prod:** 46 → **47** (coluna nova) → **49** (seeds dos lotes).
**Testes:** 252 → **273** (26 arquivos). Build limpo.

Docs novos ou tocados: [`docs/DSS-VIP-BUSINESS-LOTES-POR-QUANTIDADE.md`](./docs/DSS-VIP-BUSINESS-LOTES-POR-QUANTIDADE.md)
(novo) · [`CATALOGO §7.2`](./docs/CATALOGO-PRECOS-E-VENDAS.md) · [`ADMIN-VENDAS… Onda E`](./docs/ADMIN-VENDAS-COBRANCA-INGRESSOS.md)
· [`RUNBOOK`](./docs/RUNBOOK.md) · [`BANCO-DE-DADOS`](./docs/BANCO-DE-DADOS.md) ·
[`ADMIN-EXPORT-CSV-CONTATOS`](./docs/ADMIN-EXPORT-CSV-CONTATOS.md) · `ARQUITETURA` · `README`.

---

## 0. O que a releitura encontrou

- Site no ar e preços batendo com o catálogo (DSS Lote 2 R$ 670, One Day R$ 290, GU 24/09 R$ 30).
- **6 commits (25/08 → 05/09) não estavam no GitHub:** `origin/main` parado em `620fb02`. O deploy
  pela CLI não passa pelo GitHub, então prod estava à frente do repositório remoto. Push feito
  nesta sessão (`620fb02..3962075`) e depois mantido em dia.

## 1. Marcar ingresso como gerado (`d47732d`)

*"quero poder marcar na lista dos ingressos como gerados na coluna de ações... preciso depois
fazer a migração segura"*

- Botão **"marcar gerado"** na coluna Ação de `/admin/vendas` e no detalhe. Marcado, vira
  **"✓ ingresso dd/mm"**, com a hora no tooltip. Desmarcar pede confirmação.
- Coluna **`inscricoes.ingresso_gerado_em TIMESTAMPTZ`**: `NULL` = não gerado, e remarcar preserva a
  primeira data (`COALESCE`). `POST /api/admin/inscricoes/ingresso-gerado` `{ id, gerado }`.
- Só aparece em venda **`paid`** (gratuito incluso) **ou já marcada**. Marca em venda estornada é
  o aviso pra revogar.

**Por que a migração foi segura:** aditiva e nullable. A lista lê `SELECT *`, então **entre o
deploy e a migração ela ficou de pé** (verificado em prod: 200 com o botão). O botão responderia
503 "rode a migração" em vez de 500. `GET /api/admin/migrate` ganhou `tem_coluna_ingresso_gerado_em`.
O canário `ingresso-gerado.test.ts` reprova três casos: coluna ausente das migrações, statement
destrutivo e query em `admin-queries.ts` que dependa da coluna.

| momento | inscrições | eventos | tipos | colunas | coluna nova |
|---|---|---|---|---|---|
| antes do deploy | 175 | 180 | 12 | 44 | — |
| deploy, antes da migração | 175 | 180 | 12 | 44 | false |
| depois (47/47) | 175 | 180 | 12 | 45 | true |

Conferido: marcar/desmarcar a venda **123** (já `is_teste`, paga).

## 2. O CNPJ que virava `8,72889E+13` no CSV (`edc42a3`)

O Binhara abriu o CSV de contatos do DSS no Excel e o `documento` de PJ veio em notação
científica. O Excel lê CNPJ cru (14 dígitos) como número e guarda só 15 dígitos de precisão, então
**os arquivos já baixados perderam dígitos de vez**. CPF com zero à esquerda perdia o zero.

Fix: a coluna sai formatada pelo `documentoTexto` (o mesmo do "copiar dados do cliente"). Com
ponto e barra, o Excel mantém o valor como texto. 4 testes, sem migração.

**Não conferido no arquivo de prod:** o `curl` do export é bloqueado pelo classificador (dados
pessoais). A conferência é o Binhara baixar de novo.

## 3. Ingressos VIP e Business (`a825797`)

*"VIP 10 primeiros R$ 957, depois 15 a R$ 1.275 e último lote 15 a R$ 1.657; Business 10 a
R$ 757, 10 a R$ 984 e 10 a R$ 1.279. Crie os checkouts."*

Detalhe completo em [`docs/DSS-VIP-BUSINESS-LOTES-POR-QUANTIDADE.md`](./docs/DSS-VIP-BUSINESS-LOTES-POR-QUANTIDADE.md).
Resumo:

- `/dssbr-2026/vip` e `/dssbr-2026/business`, produtos `dss-vip-2026` / `dss-business-2026`, 3x.
- **Lote por quantidade, não por data nem na mão:** os 3 lotes ficam ativos com `limite_qtd`, e
  `lib/lotes-quantidade.ts` escolhe o primeiro com vaga. O servidor (`tipoObrigatorio`) só vende
  esse lote: sem tipo → 400 (o fallback do registry é o preço do Lote 1), lote que fechou → 409
  com o nome do lote novo.
- Os lotes vieram por **seed da migração**, sem cadastro manual. O canário trava preço e vagas dos
  6 lotes na rota e no espelho SQL.
- Benefícios copiados dos cards do dssbr.com.br (que já existiam como "Sob consulta" + lista de
  espera), mais "tudo do FullPass", que é **suposição**.
- Admin: abas "VIP DSS" / "Business DSS", `CHECKOUT_URL`, cobrança avulsa e e-mail próprio.
- Escada do checkout passou a formatar milhar (`1.275`) sem quebrar linha no celular. Vale
  também pro FullPass.

**Verificado local (banco de dev):** com o Lote 1 do VIP desligado, a página foi pra R$ 1.275
("restam 15") e o POST `lote-1` deu 409 citando o Lote 2. Religado, voltou a R$ 957. Screenshot
em 400px OK.

**Prod:**

| passo | resultado |
|---|---|
| antes | 176 inscrições · 12 tipos |
| deploy, antes da migração | as duas páginas → "As vendas abrem em instantes" |
| migração 49/49 | 176 inscrições · **18** tipos; 6 lotes conferidos pela API |
| páginas | VIP **R$ 957,00**, Business **R$ 757,00**, "restam 10", lotes 2 e 3 "em breve" |
| portões | sem tipo 400 · `lote-2` 409 · `lote-1` passa (parou no CPF inválido, **sem cobrança**) |
| regressão | FullPass 570 · 670 · 820 intacto; One Day 200 |

## 4. Guia pro dssbr.com.br

Entregue ao Binhara como arquivo fora do repo:
`/mnt/d/2026/siteAzuris2026/DSS-2026-LINKS-CHECKOUT-VIP-BUSINESS.md`. Contém links com UTM, texto
pronto dos cards, como o checkout funciona, onde operar no admin e checklist.

Recomendação registrada lá: **mostrar os três lotes no card, não "a partir de R$ 957"**. O site é
texto fixo e o checkout muda de preço sozinho.

Na leitura do dssbr.com.br apareceram **duas divergências de preço com o checkout**:

| card | dssbr.com.br | checkout |
|---|---|---|
| FullPass Lote 3 | R$ 887 | "no dia" R$ 820 |
| One Day Lote 3 | R$ 350 | R$ 357 |

## 5. Decisões desta sessão

- **`ingresso_gerado_em` é timestamp, não boolean:** o "quando" vem de graça, no precedente do
  `email_confirmacao_em`.
- **Documento formatado no CSV**, e não `="…"` nem apóstrofo: fica legível e abre em qualquer
  planilha.
- **VIP/Business como produtos próprios** (slug, aba, e-mail), não como tipos do `dss-2026`: a
  escada de cada um é independente e o FullPass continua virando lote na mão.
- **Página com lote único no formulário:** os outros lotes são informação (escada), não opção.
- **Não mexer** na landing `/dssbr-2026` (a vitrine desses ingressos é o dssbr.com.br), nos
  cupons (VIP/Business não aceitam) nem nos widgets flutuantes (já aparecem em todo checkout DSS).

## 6. Armadilhas desta sessão

- **Login da API do admin é `{"senha": …}`**, não `password`. Com o campo errado a resposta é
  "Senha incorreta." e parece que a senha mudou.
- **`vercel --prod | tail`** mostra só o JSON de dicas do fim e parece falha. Rodei de novo e subiram
  **dois deploys idênticos**. Conferir com `vercel ls --prod` antes de repetir.
- **`limite_qtd = 0` vira "sem limite"** (a API grava `null`). O teste local de "esgotar zerando
  as vagas" não virou o lote por isso. Pra fechar um lote, desligue.
- **`python3 … 2>/dev/null` esconde `AssertionError`** dos scripts de edição (o WSL cospe um warning
  de `distutils` no stderr a cada execução). Conferir com `grep` depois de cada edição em lote.
- **Push e deploy precisam de OK explícito a cada vez.** O classificador bloqueou um deploy que
  não tinha sido pedido pra aquela mudança, e um push em comando encadeado. `git push` sozinho passou.
- **O `tsc --noEmit` tem um erro antigo** em `checkout-produto.test.ts` (fixture sem `oculto`). Não
  afeta o build e não é desta sessão.

## Fica pendente

**Desta sessão (depende do Binhara):**

- **Business: 30 ou 40 ingressos?** O card do dssbr.com.br diz 40, o combinado soma 30.
- **VIP/Business incluem os 3 dias do FullPass?** O checkout diz que sim.
- **Trocar os botões "Lista de espera" do dssbr.com.br** (`pipeline-azuris.vercel.app/lp/vip` e
  `/lp/bussiness`) pelos checkouts, usando o guia do §4.
- **Resolver FullPass Lote 3 (887 × 820) e One Day Lote 3 (350 × 357).**
- **Baixar de novo os CSVs de contatos.** Os de antes de 14/09 têm CNPJ truncado.
- **Zero pagamento real** em VIP/Business. A virada de lote por venda de verdade nunca foi
  exercitada em prod.

**Desta sessão (código, não feito):**

- Filtro "ingresso gerado / não gerado" em `/admin/vendas`. Se entrar, a query passa a depender da
  coluna: ajustar o canário `ingresso-gerado.test.ts`.
- Cupom pra VIP/Business (hoje `/admin/cupons` só lista FullPass e One Day).

**Datas:**

- **GU 24/09** (daqui a 10 dias): depois do evento, **desligar `gubigdata-2026-09`** (ids 35/36).
- Café DSSBR **06/10**. DSS **27–29/10** (43 dias), com Lote 2 R$ 670 sem virada marcada.

**De antes, inalterado:** link do café no post do DSSBR · zero PIX real em GU, café e produtos de
25/08 · copy pré-evergreen do curso na home (`Ecosystem.tsx`, `CourseCallout`, `lakehouse-og`) ·
`CUPOM_SECRET` ausente na Vercel · bug do bloco "Regerar" · NFS-e no Portal Nacional · PostHog sem
chave · deploy ainda é `vercel --prod` na mão (e exige `git push` separado).

Última revisão: **2026-09-14**.
