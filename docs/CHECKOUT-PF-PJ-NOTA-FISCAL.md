# Checkout PF/PJ + endereço da nota fiscal — doc técnico

Seletor **Pessoa física / Pessoa jurídica** explícito nos 3 checkouts pagos, razão social e
endereço do tomador pra emissão de NFS-e — e, principalmente, esse endereço **chegando no
Asaas**, que é o que faltava.

Nasceu de uma auditoria pedida pelo Binhara em 2026-07-15: *"em todos os checkouts precisamos
pedir o CPF da pessoa ou, se for empresa, o CNPJ... e apresentar isso na interface; da empresa
precisamos de dados de endereço completo para emissão da nota. Revisa se temos essa informação
sendo pedida."*

**Status: commitado em `main` (`95268ed`→`a06e037`), verificado localmente, NÃO DEPLOYADO.**
Produção segue no `4631549` — nada disto está no ar.

---

## O achado que motivou tudo

O CPF/CNPJ estava bem resolvido (`lib/validacao-doc.ts` valida dígito verificador de verdade,
os 3 checkouts passam por ele). O endereço, não. Quatro furos, em ordem de gravidade:

### 1. O endereço era write-only — nunca chegava na nota

`createInvoice` (`POST /invoices`) **não recebe endereço**. O Asaas monta a NFS-e a partir do
**cadastro do cliente**, e `findOrCreateCustomer` criava esse cadastro com exatamente quatro
campos: `name`, `email`, `cpfCnpj`, `mobilePhone`.

Ou seja: todo endereço já coletado estava parado na coluna JSONB `nf_endereco`, que nenhum
código lia. A tela pedia, o banco guardava, a nota não via.

### 2. PF/PJ escondido atrás de um checkbox

O radio PF/PJ só existia **dentro** do toggle "Preciso de nota fiscal". Quem não marcava
gravava `pessoa_tipo = NULL` — mesmo tendo digitado 14 dígitos de CNPJ. O checkout aceitava
CNPJ mas não derivava o tipo dele.

Ironia: `api/admin/cobranca/route.ts:110` já fazia certo (`cpf.length === 14 ? 'PJ' : 'PF'`).
O checkout público, que é por onde entra a maior parte do dinheiro, não.

### 3. Endereço não era obrigatório em lugar nenhum

Nem no client (nenhum input tinha `required`) nem no servidor (`normalizarExtras` aceitava
qualquer subconjunto e guardava o que viesse). Dava pra marcar "quero NF" → PJ → deixar tudo
em branco → `nf_endereco: null`, e o pedido passava. Razão social também era opcional pra PJ.

### 4. GU BigData pago e `/admin/cobranca` não tinham nada disso

O GU não importava `CamposExtras` — quem comprasse o ingresso de R$ 30 como empresa não tinha
como pedir nota. E a **cobrança avulsa do admin** gravava `nf_endereco: null` fixo, apesar de ser
onde nascem as propostas corporativas PJ: as vendas com maior chance de exigir nota.

---

## Decisões do Binhara nesta sessão

| Pergunta | Decisão |
|---|---|
| Endereço de PJ: sempre, ou só se pedir nota? | **Sempre que for PJ.** CNPJ implica nota; melhor o atrito do que uma venda PJ impossível de faturar. |
| GU R$ 30 também exige endereço? | **Não** — mostra PF/PJ e grava `pessoa_tipo` certo, mas não trava um ingresso de comunidade de R$ 30 por endereço. Quem for PJ e quiser nota, preenche. |
| `/admin/cobranca` entra também? | **Sim, mesmo padrão** (endereço obrigatório pra PJ). É o caminho de PJ que mais vira nota — deixar de fora anularia metade do ganho. |
| Nome do cliente PJ no Asaas | **Razão social**, não o nome de quem preencheu. O tomador da NFS-e é o dono do CNPJ. |

Isso virou a flag `enderecoObrigatorioPJ` por produto, não uma regra global.

---

## Arquitetura

### Fonte da verdade do tipo de pessoa

**O documento decide, não o radio.** `pessoaTipoDoDocumento()` deriva PJ de 14 dígitos e PF de
11, no servidor. O seletor da interface só escolhe máscara e quais campos aparecem — o client
pode mentir à vontade que `normalizarExtras(body, cpf)` ignora.

Efeito colateral bom: `pessoa_tipo` nunca mais grava NULL numa venda paga, então o filtro
PF/PJ do `/admin/vendas` passa a refletir a realidade.

### Componentes (`src/components/checkout/`)

| Arquivo | Papel |
|---|---|
| `tema.ts` | Classes dos campos nos 3 temas em uso: `dark` (Lakehouse, DSSBR), `light` (GU, que imita marketplace) e `admin` (cobrança avulsa, rótulo em caixa alta). Existe porque os componentes são compartilhados por 4 formulários e cada um vive num tema. |
| `CampoDocumento.tsx` | Radio PF/PJ + campo do documento. Label e máscara trocam junto (CPF ↔ CNPJ). Trocar de tipo **zera** o documento — reaproveitar dígitos do outro formato só geraria doc inválido. |
| `DadosNota.tsx` | Razão social (PJ) + endereço do tomador + ViaCEP. Separado do `CamposExtras` porque o GU precisa **deste** bloco mas não dos outros extras (lá o `como_conheceu` já carrega a associação). Uma implementação de endereço só. |
| `CamposExtras.tsx` | Empresa, cargo, como conheceu, consentimento LGPD. Delega a nota ao `DadosNota`. |

`ExtrasValue extends NotaValue` — o pai guarda um estado só e o `CamposExtras` repassa.

### Regra de exibição do endereço

```
mostrarEndereco = (pessoaTipo === 'PJ' && enderecoObrigatorioPJ) || querNf
```

- **PJ + produto exige** (Lakehouse, DSSBR): endereço abre direto, sem toggle. Não há o que
  optar — sem endereço não há nota, e sem nota a empresa não paga.
- **PJ + produto não exige** (GU): mostra razão social, endereço fica atrás do toggle.
- **PF**: toggle "Preciso de nota fiscal"; se marcar, os campos ficam obrigatórios.

**Razão social vive FORA dessa regra** — ela acompanha o CNPJ, não a nota. Ver "Gotchas".

### Validação no servidor (`lib/checkout-extras.ts`)

`validarExtras(body, { cpfCnpj, enderecoObrigatorioPJ })` → mensagem pt-BR ou `null`:

1. PJ sem razão social → erro (é o nome do tomador na nota).
2. PJ + `enderecoObrigatorioPJ` → endereço completo obrigatório.
3. **Qualquer endereço começado tem que ser terminado** — meio endereço não emite nota nenhuma.
   Obrigatórios: cep, logradouro, numero, bairro, cidade, uf. `complemento` é o único dispensável.
4. CEP com 8 dígitos; UF contra a lista real das 27 (`UFS`).

Erro cita o que falta pelo nome: *"Endereço incompleto pra emissão da nota: falta número,
bairro, cidade, UF"*.

### O que faz a nota sair (`lib/asaas.ts`)

`CreateCustomerInput` ganhou `company` + os 5 campos de endereço. Mapa (`enderecoParaAsaas`):

| nosso | Asaas |
|---|---|
| cep | `postalCode` |
| logradouro | `address` |
| numero | `addressNumber` (`S/N` se vazio) |
| complemento | `complement` |
| bairro | `province` |
| razao_social | `company` + `name` (PJ) |

**`cidade`/`uf` NÃO são enviadas** — o Asaas resolve as duas pelo `postalCode`. Mandar texto
livre só criaria divergência com o CEP. Continuam no nosso `nf_endereco` (o ViaCEP preenche).

Pra PJ, `customer.name` = **razão social**: o tomador da NFS-e é o dono do documento, não quem
preencheu o form. O nome da pessoa continua na nossa coluna `nome`.

`findOrCreateCustomer` agora, ao **reusar** um cliente por CPF/CNPJ, compara o cadastro e dá
`PUT /customers/{id}` (patch parcial) se chegou endereço/razão social novos. Sem isso, quem já
comprou antes ficaria preso ao cadastro incompleto da primeira compra e a nota nunca sairia.
**Falha nesse PUT é logada e engolida** — cadastro é acessório, cobrança é o negócio; um não
derruba o outro.

### Máscaras (`lib/format.ts`)

`maskCpf`, `maskCnpj`, `maskCep` e `maskDocumento(v, tipo)`. As 3 cópias byte-idênticas de
`maskCpfCnpj` (uma por checkout) morreram junto. `maskPhone` **não** foi tocado — segue
duplicado nos 3 forms, de propósito: é commit isolado, não se mistura com mudança de regra.

---

## Arquivos

**Novos:** `components/checkout/{tema.ts,CampoDocumento.tsx,DadosNota.tsx}` ·
`lib/__tests__/checkout-extras.test.ts`

**Alterados:** `lib/{format.ts,checkout-extras.ts,asaas.ts,checkout-produto.ts,produtos.ts}` ·
`components/checkout/CamposExtras.tsx` · `app/api/inscricao/route.ts` ·
`app/api/admin/cobranca/route.ts` · `app/admin/(painel)/cobranca/CobrancaForm.tsx` ·
`app/{lakehouse-comunidade,dssbr-2026}/inscricao/InscricaoForm.tsx` ·
`app/gubigdata/inscricao/InscricaoGuForm.tsx` · `lib/__tests__/asaas.test.ts` ·
`docs/ASAAS-INTEGRACAO-COMPLETA.md`

Os **4 formulários** que pedem documento usam o mesmo par `CampoDocumento` + `DadosNota`:
Lakehouse, DSSBR, GU e a cobrança avulsa do admin. No admin, o campo "Nome / razão social" virou
**"Nome do contato"** — a razão social agora tem campo próprio.

**Sem migração de banco.** As colunas (`pessoa_tipo`, `razao_social`, `nf_endereco`) já
existiam desde 2026-06-16 — o que faltava era alguém preenchê-las e lê-las.

---

## Gotchas

- **Razão social não pode viver dentro do toggle de NF.** Foi assim que a primeira versão saiu
  e criou um **beco sem saída** no GU: PJ sem marcar "preciso de nota" → campo invisível →
  servidor responde *"Informe a razão social da empresa"* → o usuário não tem onde digitar.
  Pego dirigindo o navegador, não pelos testes. Razão social acompanha o **CNPJ**, não a nota.
- **ViaCEP e stale closure.** `buscarCep` é `async`: o `value` capturado no closure é o de
  **antes** da digitação. Fazer `set({...})` com o resultado devolvia o CEP pra string vazia — o
  campo se limpava sozinho enquanto cidade/UF apareciam preenchidas. Por isso o `onChange` do CEP
  monta o `proximo` e o passa explícito pra `buscarCep(cep, proximo)`. Pego **olhando o
  screenshot**, não pelo teste (que só conferia cidade/UF e ignorava o CEP).
- **`enderecoObrigatorioPJ` está em 2 lugares por produto**: no registry (`lib/produtos.ts`,
  autoridade do servidor) e como const no form (o client precisa saber o que renderizar). O do
  Lakehouse é hardcoded nos dois lados — ele tem checkout próprio e **não passa pelo registry**.
  Mudar um sem o outro faz a UI e a validação discordarem.
- **ViaCEP falha em silêncio.** Fora do ar não pode derrubar venda; só deixa de adiantar o
  preenchimento. Nunca transformar isso em erro bloqueante.
- **O `PUT` de cadastro só manda campos com valor.** O update do Asaas é patch: mandar string
  vazia **sobrescreveria** o dado bom que já está lá.
- **Turbopack em `/mnt/d/` serve build stale** (gotcha velho do projeto, mordeu de novo). A
  primeira verificação da correção do beco sem saída deu **falso negativo**. `pkill -f "next dev"`
  + `rm -rf .next` + restart antes de acreditar em qualquer verificação de UI.

---

## Verificação (local, 2026-07-15)

79 testes (29 novos) · `tsc` limpo · eslint exit 0 · `next build` 44/44 páginas.

**Contra o servidor rodando** — os 4 casos que **antes passavam**, agora rejeitados:

| Caso | Resposta |
|---|---|
| PJ sem razão social e sem endereço | `Informe a razão social da empresa` |
| PJ com razão social, sem endereço | `Endereço incompleto...: falta CEP, logradouro, número, bairro, cidade, UF` |
| PJ com endereço pela metade | `Endereço incompleto...: falta número, bairro, cidade, UF` |
| PF pedindo NF com endereço pela metade | `Endereço incompleto...: falta logradouro, número, bairro, cidade, UF` |
| UF `XX` | `UF inválida` |

**Não regrediram** (passam a validação e chegam no Asaas — 401 local por falta de chave):
PF simples · PJ completo · **GU com PJ sem endereço** (confirma a exceção do produto).

A cobrança avulsa do admin responde igual (autenticada): PJ sem razão social → erro · PJ sem
endereço → erro · PJ completo e PF simples → chegam no Asaas.

**No navegador** (playwright-core, os **4** formulários): seletor renderiza · label troca
CPF↔CNPJ · máscara aplica `11.222.333/0001-81` · ViaCEP resolve `80010-010` → Rua Marechal
Deodoro / Curitiba / PR **preservando o CEP digitado** · Lakehouse+DSSBR+admin abrem endereço no
PJ · GU mostra razão social **sem** forçar endereço.

**Não exercitado contra Asaas real.** O `PUT /customers/{id}` e o endereço no cadastro estão
cobertos por teste com fake (`__setAsaasFetch`), mas nenhuma NFS-e foi emitida de verdade.

---

## Pendente

1. **Um PIX real de PJ** que emita nota ponta a ponta — é o que fecha a prova.
2. Os clientes Asaas **já existentes** só ganham endereço quando comprarem de novo (o `PUT` é
   oportunista). Vendas antigas de PJ seguem sem cadastro completo — e não há backfill possível,
   porque o dado nunca foi coletado. Pra emitir nota de venda PJ antiga: preencher na mão no
   painel do Asaas.
3. `maskPhone` segue com 3 cópias nos forms + a de `lib/format.ts` — commit isolado, de propósito.
