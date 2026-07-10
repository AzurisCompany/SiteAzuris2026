# Admin — Reconciliação de caixa, Importação e Diagnóstico de conciliação

> Três ferramentas financeiras adicionadas em **2026-07-10** ao painel `/admin`, todas em torno de
> reconciliar o **Asaas** (dinheiro) com o **nosso banco** (receita reconhecida). Complementa
> [ADMIN-FINANCEIRO-ONDAS-2026-07-09.md](./ADMIN-FINANCEIRO-ONDAS-2026-07-09.md) e o guia completo
> da integração em [ASAAS-INTEGRACAO-COMPLETA.md](./ASAAS-INTEGRACAO-COMPLETA.md).

| Ferramenta | Rota | Para quê |
|---|---|---|
| Reconciliação de caixa | `/admin/saude` (bloco no topo) | Entender por que o **saldo Asaas** ≠ **líquido recebido** do dash |
| Importar cobranças | `/admin/importar` | Trazer pro banco cobranças criadas **direto no painel do Asaas** |
| Falhas de conciliação | `/admin/conciliacao` | Ver **quais** cobranças o cron não consegue sincronizar e **por quê** |

Commits: `d9ea600` (reconciliação) · `8a295b3` (importar) · `2c9c85b` (diagnóstico) ·
`2a289f3` (agrupar parceladas) · `0da384d` (filtro por data).

---

## 1. Reconciliação de caixa (`/admin/saude`)

### O problema que resolve
O dashboard mostra **"Líquido recebido"** (soma do `valor_liquido_centavos` das vendas `paid`) e o
Asaas mostra um **saldo** diferente. **Isso é esperado, não é bug** — são métricas distintas:

- **Saldo disponível** (`GET /finance/balance`) = caixa pra saque *agora*. Embute saques (−),
  antecipações (+) e taxas.
- **Líquido recebido** (banco) = receita líquida *acumulada* de vendas confirmadas.

**Ponte:** `Saldo = Σ(pagamentos liberados) + Σ(antecipações) − Σ(saques) − taxas`.

### O que o bloco mostra
Um bloco no topo de `/admin/saude` com:
- **3 KPIs:** Saldo Asaas · Líquido recebido (banco) · Diferença (com explicação do sinal).
- **Extrato das últimas 60 movimentações** (`GET /financialTransactions`) **agrupado por tipo**:
  Recebimentos / Antecipações / Taxas / Saques / Estornos / Outros — valores sinalizados.
- Lista individual expansível (data · descrição · valor).

A chamada externa é **isolada em try/catch**: se o Asaas falhar, só o bloco mostra aviso; o resto
do diagnóstico de saúde continua.

### Arquivos
- `lib/asaas.ts` — `getBalance()`, `getFinanceTransactions(limit, offset)`.
- `lib/reconciliacao.ts` — `reconciliacaoCaixa()` (monta saldo × líquido + agrupa o extrato),
  `grupoDaTransacao(type)`, `labelGrupo()`.
- `lib/admin-queries.ts` — `totalLiquidoRecebido()` (escalar do KPI do dash).
- `app/admin/(painel)/saude/page.tsx` — componente `ReconciliacaoBloco`.

### Direção da diferença (interpretação)
- **Saldo > líquido:** antecipação de parcelas futuras e/ou webhook perdido (dinheiro entrou, venda
  não fechou no banco).
- **Saldo < líquido:** cartão `CONFIRMED` ainda não liberado (compensa D+30) e/ou saques já feitos.

### Caveat
`getFinanceTransactions` usa `order=desc` (assumido). Confira na sua conta que o extrato vem do mais
novo pro mais velho; se o default for asc, precisa paginar pelo fim.

---

## 2. Importar cobranças do Asaas (`/admin/importar`)

### O problema que resolve
Cobranças criadas **direto no painel do Asaas** (fora do nosso checkout) não têm inscrição no banco
→ **não aparecem no dashboard**, por mais pagas que estejam. Esta tela mapeia e importa essas
cobranças.

### Como funciona
1. Varre `GET /payments` (paginado, com filtro de data — ver abaixo).
2. Faz o **diff** contra os `asaas_payment_id` já no banco (`idsAsaasNoBanco()`).
3. Lista o que existe no Asaas mas **não** no banco, enriquecido com o cliente (`GET /customers/{id}`).
4. Botão **Importar** por item → cria inscrição no bucket **`avulso-asaas`** (lote `unico`), já com
   status/valor/líquido reais. **Idempotente** (`ON CONFLICT (asaas_payment_id) DO NOTHING`).

### Parcelado agrupado (importante)
O Asaas trata **cada parcela como um pagamento próprio**, agrupado por um `installment` id. A tela
**agrupa por parcelamento** e importa como **UMA venda**:
- `valor_centavos` = **soma** das parcelas (ex.: 3× R$183,33 → R$550).
- `installments` = nº de parcelas.
- **status agregado** — espelha o checkout: cartão parcelado autorizado = venda `paid` (basta uma
  parcela paga).
- chaveada pela **parcela representante** (menor vencimento) → idempotente.
- selo na lista: `Nx · P/T pagas` (quantas parcelas já compensaram).

Cobranças avulsas (sem `installment`) entram como 1 linha cada.

### Filtro por data
Por padrão só lista cobranças **criadas a partir de `2026-06-01`** (não escaneia histórico antigo).
- Atalhos no topo: **jun/2026** · **jul/2026** · **2026**.
- Override por URL: `?desde=YYYY-MM-DD`.
- Implementado com `dateCreated[ge]` no `GET /payments` (escaneia menos, não trunca).

### Arquivos
- `lib/asaas.ts` — `listPayments({ limit, offset, dateCreatedGe, dateCreatedLe })`,
  `getInstallmentPayments(installmentId)`, `getCustomer(id)`.
- `lib/db.ts` — `idsAsaasNoBanco()`, `criarInscricaoImportada()` (INSERT com `ON CONFLICT`),
  tipo `InscricaoImportada`.
- `lib/importar-asaas.ts` — `cobrancasForaDoBanco({ desde })` (scan → agrupa → diff → enriquece),
  `importarCobranca(paymentId)` (avulsa), `importarInstallment(installmentId)` (grupo).
- `app/api/admin/importar-cobranca/route.ts` — `POST { asaas_payment_id }` **ou** `{ installment_id }`.
- `app/admin/(painel)/importar/page.tsx` + `ImportarButton.tsx` (client).
- `admin-queries.ts` — rótulos do bucket `avulso-asaas` (`PRODUTO_LABEL`, `PRODUTO_TAB`).

### Regra de negócio recomendada
Para **evitar** cobranças fora do sistema, criar avulsas pelo **`/admin/cobranca`** em vez do painel
do Asaas — assim já nasce inscrição + vínculo + webhook. A importação é a rede de segurança pro que
já foi criado no painel.

### Caveat do agrupamento
`importarInstallment` soma as parcelas via `GET /payments?installment={id}`. Se o Asaas não trouxer
todas as parcelas, o total vem menor — conferir se o valor bate.

---

## 3. Falhas de conciliação (`/admin/conciliacao`)

### O problema que resolve
O cron `/api/cron/reconciliar` reporta só um número (`erros: N`) — não diz **quais** cobranças
falham nem **por quê**. Esta tela responde isso.

### Como funciona (dry-run, NÃO escreve)
Para cada cobrança **não-final** (`pending`/`overdue`, ou `paid` sem taxa consolidada) com
`asaas_payment_id`, tenta `getPayment` e lista as que falham + a **mensagem crua do Asaas**.
Classifica:
- **"não existe no Asaas"** (amarelo) — erro 404/not-found. Quase sempre linha de **teste/sandbox**
  cujo pagamento não existe na conta de produção.
- **"erro"** (vermelho) — qualquer outra falha; investigar caso a caso.

Cada linha tem botão **"marcar teste"** (`is_teste`) — reusa o `TesteButton` das vendas. Marcar
tira dos KPIs **e** do cron (o `sincronizarTodas` já filtra `NOT is_teste` via a condição de status),
sem apagar nada.

### Arquivos
- `lib/asaas-sync.ts` — `diagnosticarConciliacao()` (dry-run) + tipo `FalhaConciliacao`.
- `app/admin/(painel)/conciliacao/page.tsx` — página; reusa `vendas/TesteButton`.
- `app/admin/(painel)/saude/page.tsx` — link "🔎 Falhas de conciliação" no header.

### Uso típico
1. Abrir `/admin/conciliacao`.
2. Nas **amarelas** ("não existe no Asaas") → **marcar teste**. Somem dos KPIs e do cron.
3. Se aparecer **vermelha** → é venda real com problema; investigar no detalhe (`/admin/vendas/[id]`).

---

## Novo bucket `avulso-asaas`

Cobranças importadas do painel entram com `curso_slug = 'avulso-asaas'`, `lote = 'unico'`. Rótulos:
`PRODUTO_LABEL['avulso-asaas'] = 'Avulso (Asaas)'`, `PRODUTO_TAB['avulso-asaas'] = 'Avulsos'`. Não
mistura com as vagas de Lakehouse/DSSBR. Não precisa de migration (reusa colunas existentes).

## Limites conhecidos (comuns às 3)
- As chamadas ao Asaas rodam **em produção** (chave só existe no Vercel) — não dá pra exercitar da
  CLI local. Cada tela isola o erro do Asaas em try/catch.
- **Parcelado no modelo do banco:** uma venda parcelada = **uma linha** com o valor cheio. As
  parcelas 2..N do Asaas (ids próprios) **não** viram receita nova (senão duplicaria). Só a
  representante fica no banco.
- O escaneamento de `/admin/importar` é limitado a `maxPaginas × pageSize` (default 3×100). Se
  truncar, a tela avisa; refine o `?desde` pra reduzir o volume.

---

*Doc técnico — 2026-07-10. Ver também o handoff da sessão em
`CONTEXTO-SESSAO-RECONCILIACAO-IMPORT-2026-07-10.md`.*
