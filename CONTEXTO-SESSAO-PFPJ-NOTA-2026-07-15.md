# Handoff — Checkout PF/PJ + endereço da nota fiscal (2026-07-15)

> ⚠️ **NADA FOI COMMITADO E NADA FOI DEPLOYADO.** Todo o trabalho está no working tree
> local. Produção segue no `4631549` (sessão do fit/preparatório, 2026-07-14).
> A verificação abaixo é **local**, contra `next dev` — nunca tocou o Asaas real.

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

## O que entrou (4 camadas, ~474 linhas)

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
   (razão social + endereço + ViaCEP), `tema.ts` (dark/light). Ligados nos 3 checkouts.

## Bug encontrado NA verificação (e corrigido)

Dirigindo o navegador, o GU com PJ virou **beco sem saída**: razão social só aparecia dentro do
toggle de NF, mas o servidor a exige pra qualquer PJ → o usuário levava *"Informe a razão social
da empresa"* sem campo pra preencher. Confirmado por curl, corrigido: **razão social acompanha o
CNPJ, não a nota**. Os testes não pegaram isso — só o navegador.

## Verificação (local)

79 testes (29 novos) · `tsc` limpo · eslint exit 0 · `next build` 44/44.

Contra o servidor: os **4 casos que antes passavam** agora são rejeitados com mensagem que diz o
que falta; PF simples, PJ completo e GU-PJ-sem-endereço passam e chegam no Asaas (401 local, sem
chave). No navegador: seletor nos 3, máscara, ViaCEP resolvendo `80010-010` → Curitiba/PR,
Lakehouse+DSSBR abrindo endereço no PJ, GU não forçando.

**Nunca exercitado contra Asaas real.** O `PUT` e o endereço no cadastro estão cobertos por
fake (`__setAsaasFetch`); nenhuma NFS-e saiu de verdade.

## ⏭️ PENDÊNCIAS

1. **Commitar e deployar** — nada disso está em produção. Sugestão de fatiamento:
   máscaras+validação · endereço no cliente Asaas · componentes+3 forms · docs.
2. **`/admin/cobranca` continua com `nf_endereco: null` fixo** — o form não coleta endereço, e é
   justamente onde nascem as propostas corporativas PJ. Ficou fora por ser form de admin.
3. **1 PIX real de PJ** emitindo nota ponta a ponta — é o que fecha a prova.
4. Clientes Asaas **já existentes** só ganham endereço quando comprarem de novo (o `PUT` é
   oportunista). Vendas PJ antigas seguem com cadastro incompleto.
5. Continuam de sessões anteriores: link do post do GU, importar venda do Tiago, rodar
   `/admin/conciliacao`, tipos do DSSBR, antecipação no painel Asaas.

## Sujeira conhecida

- **Nenhuma linha de teste criada em prod nesta sessão** (o dev local aponta pro Neon de teste e
  o Asaas local não tem chave — as tentativas morreram em 401 antes de virar venda).
- Sem migração de banco: as colunas já existiam desde 2026-06-16; faltava preencher e ler.
