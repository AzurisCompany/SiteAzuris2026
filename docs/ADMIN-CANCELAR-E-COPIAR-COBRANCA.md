# Cancelar cobrança e copiar dados do cliente

Duas operações do painel financeiro, entregues em 2026-07-20. Ambas nasceram da
mesma pergunta do Binhara: *"preciso recriar uma proposta mudando o valor, e
poder cancelar cobrança"*.

Complementam o que já existia: [ADMIN-VENDAS-COBRANCA-INGRESSOS.md](./ADMIN-VENDAS-COBRANCA-INGRESSOS.md)
(cobrança avulsa) e [ADMIN-TROCAR-MEIO-PAGAMENTO.md](./ADMIN-TROCAR-MEIO-PAGAMENTO.md)
(regerar trocando o meio).

---

## 1. Cancelar cobrança

`POST /api/admin/cobranca/cancelar` — body `{ id }`.

Encerra de vez uma cobrança **pendente ou vencida**: apaga no Asaas e marca a
venda como `cancelled`. A linha não some do painel — vira histórico, o lead fica.

### Ordem das operações (e por quê)

1. `getPayment` no Asaas **antes de apagar**. Se o Asaas disser que está paga
   (`mapAsaasStatus === 'paid'`), responde **409** e não apaga nada. O banco pode
   estar desatualizado (webhook perdido) e apagar uma cobrança paga seria estrago
   irreversível.
2. `deleteInstallment(installment)` quando é cartão parcelado, senão
   `deletePayment(id)`. Parcelado no Asaas é um `installment` com N pagamentos —
   apagar parcela por parcela deixaria o resto de pé.
3. Só então `cancelarInscricao(id)` no banco.

Se o `getPayment` falhar (404 — a cobrança já não existe lá), segue e encerra só
do nosso lado. Se o DELETE falhar, **aborta sem tocar no banco**.

### Quem NÃO pode ser cancelado

| Situação | Resposta |
|---|---|
| Já cancelada | 409 |
| Paga / estornada | 409 — *"cobrança paga se resolve por estorno no painel do Asaas"* |
| Paga só no Asaas (banco desatualizado) | 409 — pede pra rodar o sync antes |
| Sem `asaas_payment_id` (ex.: inscrição gratuita) | 200, encerra só no banco |

**Estorno não tem código.** Cobrança já paga se resolve no painel do Asaas.

### Onde aparece

`CancelarButton.tsx` (em `(painel)/vendas/`), duas variantes:

- `linha` — botão compacto em `/admin/vendas` e em `/admin/cobranca`, só nas
  linhas pendente/vencida.
- `bloco` — no detalhe da venda, com o texto explicando o efeito.

Ambas passam por `confirm` nomeando o cliente. É destrutivo e não tem desfazer.

---

## 2. Copiar dados do cliente pra uma cobrança nova

`GET /admin/cobranca?de=<id>`

O caso real: o LAET tinha uma cobrança de **ingresso**, mudou de ideia e queria o
**curso**. Não é editar a cobrança antiga — é uma cobrança nova pro mesmo cliente.

A página lê a venda `<id>` e passa o **cadastro** dele como valores iniciais do
formulário de cobrança avulsa: nome, e-mail, CPF/CNPJ, telefone, PF/PJ, razão
social e endereço da nota.

**Produto, valor e descrição ficam em branco de propósito** — é justamente o que
mudou. E **a cobrança antiga não é tocada**: continua pendente. Se tiver que
morrer, é o botão cancelar, decisão separada e explícita.

### O que NÃO foi feito, e por quê

Uma primeira versão criava a venda nova pelo servidor, cancelava a antiga e
ligava as duas por uma coluna `regerada_de_id`. Foi **revertida a pedido do
Binhara**: *"não precisa criar nada de banco, só passar os dados do cliente pra
nova cobrança"*. A coluna chegou a ser criada no banco **local de teste** e foi
removida (13 inscrições antes, 13 depois); **produção nunca foi migrada**.

Consequência aceita: a venda nova **não sabe** que veio da antiga. Não há rastro
consultável entre as duas.

### Onde aparece

- `/admin/vendas` — link `nova cobrança` em toda linha.
- `/admin/cobranca` — link `nova cobrança` em toda linha.
- `/admin/vendas/[id]` — botão *"nova cobrança com estes dados"*.

> **Rótulo mudou em 2026-08-21** (`96e4c50`): era `copiar dados` nas duas listas. Passou a
> conviver com o botão de **copiar os dados do cliente pro clipboard** (ao lado do nome), e
> dois "copiar dados" na mesma linha fazendo coisas diferentes era armadilha. Ver
> [ADMIN-COPIAR-DADOS-CLIENTE.md](./ADMIN-COPIAR-DADOS-CLIENTE.md).

Entradas inválidas (`?de=9999`, `?de=abc`) caem no formulário vazio, sem erro.

---

## 3. Produto da cobrança avulsa vira dropdown

Eram 4 botões-chip; viraram um `<select>`. Mesmo conteúdo, mesma regra.

| opção | aba do painel | `curso_slug` |
|---|---|---|
| Curso | Curso | `lakehouse-comunidade` |
| Ingresso DSS | Ingressos DSS | `dss-2026` |
| Ingresso GU | GU BigData | `gubigdata-2026-07` |
| Customizado | Propostas | `proposta` |

É o mesmo `?curso=` dos filtros de `/admin/vendas`. Trocar atualiza a descrição
sugerida e o preço de tabela **sem sobrescrever** o que já foi digitado.

**Fora da lista de propósito** (e recusados também pelo servidor, não só pela
tela): `assinatura` (fluxo próprio em `/admin/assinaturas`), `avulso-asaas`
(balde do que foi *importado* do painel do Asaas — criar aqui mentiria sobre a
origem) e `preparatorio-dados` (reserva de interesse, sem pagamento).

---

## 4. Bug corrigido: detalhe da venda dava 500

`/admin/vendas/[id]` devolvia **500** em toda venda com `due_date` preenchido —
6 das 8 pendentes em produção. No navegador aparecia *"This page couldn't load"*,
que parecia erro de navegação mas era erro de servidor.

```
Objects are not valid as a React child (found: [object Date])
```

**Causa:** o driver do Neon devolve coluna `DATE` como **objeto `Date`**, e
`InscricaoRow` declara `due_date: string | null`. O tipo mentia desde que a
coluna passou a ser preenchida (`43255a7`, upgrade financeiro de 09/07). A
página renderizava `{insc.due_date}` cru e o React derrubava tudo.

**Segundo efeito, silencioso:** no `trocar-meio`,
`insc.due_date >= hojeBRT()` comparava `Date` com string — em JS isso é sempre
`false`, sem erro. Todo regerar jogava o vencimento pra "hoje + 3 dias" em vez de
preservar o que ainda era futuro.

**Correção:** `toISODate()` em `lib/format.ts`, aplicado em `getInscricao`.

```ts
// Lê os componentes LOCAIS do Date, não o ISO: o driver monta o objeto na
// meia-noite do fuso do SERVIDOR (em BRT vira 03:00Z). toISOString().slice(0,10)
// só acerta por a Vercel rodar em UTC — num fuso a leste voltaria o dia anterior.
```

Coberto por 6 testes, incluindo virada de mês e `Date` inválida.

> **Atenção pra quem for mexer:** qualquer outra coluna `DATE` lida direto do
> driver tem o mesmo problema. Colunas `TIMESTAMPTZ` passam por `fmtDataHora()`,
> que faz `new Date(...)` e tolera ambos.

---

## Arquivos

| Papel | Arquivo |
|---|---|
| API cancelar | `src/app/api/admin/cobranca/cancelar/route.ts` |
| Botão cancelar (2 variantes) | `src/app/admin/(painel)/vendas/CancelarButton.tsx` |
| Prefill do cliente | `src/app/admin/(painel)/cobranca/page.tsx` (`copiarDadosDe`) |
| Formulário com valores iniciais | `src/app/admin/(painel)/cobranca/CobrancaForm.tsx` (`Prefill`) |
| Dropdown de produto | idem, `<select id="produto-cobranca">` |
| Normalização de DATE | `src/lib/format.ts` (`toISODate`) + `src/lib/admin-queries.ts` (`getInscricao`) |

Sem migração de banco em nenhuma das três entregas.

---

## Verificação feita

Contra o servidor local com login real: guardas do cancelar (401 sem cookie, 400
id inválido, 404 inexistente, 409 em paga e em já-cancelada) e o caminho feliz num
`overdue` de teste, restaurado depois. Prefill com `?de=1` preenchendo os 4 campos,
form vazio sem `?de`, e `?de=9999`/`?de=abc` sem quebrar. `COALESCE` com parâmetro
nulo testado direto no driver. Em produção: as 11 páginas de detalhe que antes
davam 500 voltaram 200, e o prefill do LAET (id 48) veio completo.

## O que NÃO foi verificado

**Nada disso encostou no Asaas real.** A chave local é sandbox e está quebrada —
o valor em `.env.development.local` começa com `$`, que o dotenv do Next expande
pra vazio, resultando em `401 access_token_not_found` em todo teste local. Não é
chave inválida: é o cifrão. Pra testar localmente, escapar (`\$aact_hml…`) ou
trocar aspas duplas por simples.

Falta: **cancelar 1 cobrança pendente de verdade** e conferir no painel do Asaas
que ela sumiu.
