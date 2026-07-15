# Handoff — Checkout PF/PJ + endereço da nota fiscal (2026-07-15)

> ⚠️ **COMMITADO em `main`, NÃO DEPLOYADO.** Produção segue no `4631549` (sessão do
> fit/preparatório, 2026-07-14) — **nada disto está no ar**. Working tree limpo.
> A verificação abaixo é **local**, contra `next dev` — nunca tocou o Asaas real.

```
95268ed feat(checkout): derivar PF/PJ do documento e exigir endereço completo pra nota
7a1f53d feat(asaas): mandar endereço e razão social pro cadastro do cliente
bcc1b4f feat(checkout): seletor PF/PJ explícito + endereço da nota nos 3 checkouts
740e3b9 feat(admin): cobrança avulsa com PF/PJ e endereço da nota
a06e037 docs: checkout PF/PJ + endereço da nota (doc técnico + handoff)
```

**O deploy foi interrompido pelo Binhara** no momento de rodar o `vercel --prod`. O binário
**não está em `node_modules/.bin/vercel`** — resolver de onde chamar o CLI antes de tentar de novo
(ver [[deployment_vercel_hostinger]]).

Doc técnico completo: [docs/CHECKOUT-PF-PJ-NOTA-FISCAL.md](./docs/CHECKOUT-PF-PJ-NOTA-FISCAL.md).

## De onde partiu

Binhara pediu uma auditoria: *"em todos os checkouts precisamos pedir o CPF da pessoa ou, se
for empresa, o CNPJ... e apresentar isso na interface; da empresa precisamos de dados de
endereço completo para emissão da nota. Revisa se temos essa informação sendo pedida."*

**Resposta curta da auditoria:** o CPF/CNPJ estava bem resolvido; o endereço não — e o pedaço
que existia não servia pra emitir nota.

## O achado principal

**O endereço era write-only.** `POST /invoices` não recebe endereço: o Asaas monta a NFS-e a
partir do **cadastro do cliente**, e `findOrCreateCustomer` criava esse cadastro com 4 campos
(nome, email, doc, telefone). Todo endereço já coletado estava parado numa coluna JSONB que
ninguém lia. A tela pedia, o banco guardava, a nota não via.

Mais três furos: PF/PJ escondido dentro do toggle "preciso de nota" (gravava `pessoa_tipo` NULL
mesmo com 14 dígitos de CNPJ digitados) · endereço sem `required` no client e sem validação no
servidor (dava pra pedir nota e mandar endereço vazio) · GU pago sem nenhum desses campos.

## Decisões do Binhara

- **Endereço de PJ: sempre obrigatório** (não só quando pede nota). CNPJ implica nota.
- **GU R$ 30: exceção** — mostra PF/PJ e grava o tipo certo, mas não trava por endereço.

Virou a flag `enderecoObrigatorioPJ` por produto (registry `lib/produtos.ts`), não regra global.

## O que entrou (5 commits)

1. **Máscaras compartilhadas** (`lib/format.ts`): `maskCpf/maskCnpj/maskCep/maskDocumento`.
   Matou as 3 cópias byte-idênticas de `maskCpfCnpj`. **`maskPhone` NÃO foi tocado** — segue
   duplicado, de propósito (commit isolado, conforme sua preferência).
2. **Validação no servidor** (`lib/checkout-extras.ts`): `pessoa_tipo` passa a ser **derivado do
   documento**, nunca do client (14 dígitos = PJ). `validarExtras` exige razão social de PJ,
   endereço completo quando aplicável, CEP de 8 dígitos e UF contra a lista real.
3. **Endereço chegando no Asaas** (`lib/asaas.ts`): `findOrCreateCustomer` manda
   `postalCode/address/addressNumber/complement/province` + `company`; cliente reusado com dado
   novo leva `PUT /customers/{id}`. `cidade`/`uf` ficam de fora (Asaas deriva do CEP).
4. **UI**: `CampoDocumento` (radio PF/PJ + doc, label e máscara trocam junto), `DadosNota`
   (razão social + endereço + ViaCEP), `tema.ts` (dark/light/admin). Ligados nos **4** forms.
5. **`/admin/cobranca`** (decisão do Binhara nesta sessão): mesmo padrão, endereço obrigatório
   pra PJ. Era `nf_endereco: null` fixo — e é onde nascem as propostas corporativas.

## 2 bugs encontrados NA verificação (e corrigidos)

Nenhum dos dois foi pego por teste — só por dirigir o navegador e **olhar o screenshot**.

1. **Beco sem saída no GU**: razão social só aparecia dentro do toggle de NF, mas o servidor a
   exige pra qualquer PJ → o usuário levava *"Informe a razão social da empresa"* sem campo pra
   preencher. Corrigido: **razão social acompanha o CNPJ, não a nota**.
2. **ViaCEP apagava o CEP**: `buscarCep` é async e capturava o `value` de **antes** da digitação;
   o merge do resultado devolvia o CEP pra string vazia. Ficava cidade/UF preenchidas e CEP
   vazio. O teste anterior não pegou porque só conferia cidade/UF. Corrigido passando o estado
   já atualizado (`proximo`) explicitamente pra `buscarCep`.

## Verificação (local)

79 testes (29 novos) · `tsc` limpo · eslint exit 0 · `next build` 44/44.

Contra o servidor: os **4 casos que antes passavam** agora são rejeitados com mensagem que diz o
que falta; PF simples, PJ completo e GU-PJ-sem-endereço passam e chegam no Asaas (401 local, sem
chave). A cobrança avulsa do admin (autenticada) responde igual. No navegador, nos **4** forms:
seletor, máscara, ViaCEP resolvendo `80010-010` → Curitiba/PR **preservando o CEP**,
Lakehouse+DSSBR+admin abrindo endereço no PJ, GU não forçando.

**Nunca exercitado contra Asaas real.** O `PUT` e o endereço no cadastro estão cobertos por
fake (`__setAsaasFetch`); nenhuma NFS-e saiu de verdade.

## ⏭️ PENDÊNCIAS

1. **DEPLOYAR** — os 5 commits estão em `main`, prod segue no `4631549`. Interrompido na hora do
   `vercel --prod`: o CLI **não está em `node_modules/.bin/vercel`**; descobrir de onde chamar.
   Sem migração de banco; rollback = voltar o deploy anterior.
2. **1 PIX real de PJ** emitindo nota ponta a ponta — é o que fecha a prova, e **só dá pra fazer
   depois do deploy** (local não tem chave Asaas).
3. Clientes Asaas **já existentes** só ganham endereço quando comprarem de novo (o `PUT` é
   oportunista). Vendas PJ antigas seguem com cadastro incompleto — **não há backfill possível**,
   o dado nunca foi coletado. Pra emitir nota de venda PJ antiga: preencher na mão no painel.
4. Continuam de sessões anteriores: link do post do GU, importar venda do Tiago, rodar
   `/admin/conciliacao`, tipos do DSSBR, antecipação no painel Asaas.

## Sujeira conhecida

- **Nenhuma linha de teste criada em prod nesta sessão** (o dev local aponta pro Neon de teste e
  o Asaas local não tem chave — as tentativas morreram em 401 antes de virar venda).
- Sem migração de banco: as colunas já existiam desde 2026-06-16; faltava preencher e ler.
- Linhas de teste no banco **local** (proposta "Consultoria" R$5.000, canceladas) — é o Neon de
  teste, não prod. Ver [[reference_db_mismatch]].
- Commits foram direto na `main` — é o fluxo do projeto (deploy por CLI, sem auto-deploy do
  GitHub), mas nada foi pushado pro remoto.

## Gotcha de processo (custou 2 falsos negativos)

- **Turbopack em `/mnt/d/` serve build stale.** A verificação da correção do beco sem saída deu
  falso negativo até `pkill -f "next dev"` + `rm -rf .next` + restart. Não acreditar em
  verificação de UI sem restart limpo.
- **O login do admin manda `{senha}`, não `{password}`** — errei isso por 2 tentativas, inclusive
  contra prod (o 401 não era senha divergente, era campo errado).
