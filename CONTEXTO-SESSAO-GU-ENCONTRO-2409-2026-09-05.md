# Sessão 2026-09-05 — o encontro de 24/09 entra, o de 26/08 sai (10 dias atrasado)

**Tipo:** releitura do projeto → troca do encontro em cartaz do GU BigData, pela receita
documentada, mais o conserto de duas datas escritas à mão que a receita jurava não existir.

**Estado do repo ao fim:** working tree limpa. Um commit de código (`c117206`) + este contexto.

**Deploy:** 1, verificado no ar rota por rota. **Migração de prod:** rodada, 45/45 (era 44) —
aditiva, só o seed novo. **Testes:** 238 passando (24 arquivos), eram 237. Build limpo.

Docs: [`docs/GUBIGDATA-EVENTO-CHECKOUT.md`](./docs/GUBIGDATA-EVENTO-CHECKOUT.md) (encontro em
cartaz + passo 7 da receita) · [`docs/CATALOGO-PRECOS-E-VENDAS.md`](./docs/CATALOGO-PRECOS-E-VENDAS.md).

---

## 1. O que a releitura encontrou

O encontro de **26/08 continuou vendendo por 10 dias depois de acontecer**: os dois tipos
seguiam `ativo=true` e a página no ar anunciava "26 de agosto" em 13 lugares. Ninguém comprou
nesse período, mas o checkout estava aberto — R$ 30 por um evento que já tinha passado.

A causa é o outro lado de uma política deliberada: desde 01/08 **nada expira sozinho**
(`vendas_ate` vazio), porque uma data digitada já fechou o checkout do GU na cara do público no
dia do evento de 30/07. O preço disso é que **nada fecha sozinho** — desligar o tipo do encontro
que passou virou o **passo 7** da receita de troca, que antes tinha só 6 e todos eram deploy.

## 2. O encontro novo

`gubigdata-2026-09` — **24 de setembro, 18h30, IEP Curitiba**: *"Churn Antes que Aconteça"*, o
case da **Onetopia** para a **Tecnofit** (previsão de churn + LTV, dashboard one-page integrado
por Embedded Analytics, módulo Discover de comparação regional, entrada em produção ao vivo
durante o Fitness Brasil). Palestram **Marcio Viana** (visão de negócio) e **Leandro Krukoski**
(desafios técnicos). Conteúdo transcrito do post do gubigdata.com.br; banner e as duas fotos
baixados de lá pro `public/gubigdata/`.

Preço: **Geral R$ 30** (3x) · **Associado grátis** — mesma estrutura de 30/07 e 26/08, sem
`vendas_ate`, sem limite de vagas.

**A URL continua `/gubigdata`.** Foi cogitada uma nova, mas o post do GU já publicou
`https://www.azuris.com.br/gubigdata` no botão "Quero me inscrever": trocar a URL quebraria o
funil da peça que vai ser divulgada. E é a arquitetura da casa — um encontro, um produto,
`/gubigdata` sempre o corrente.

## 3. As datas que estavam escritas à mão

O doc afirmava que "página, checkout, rota de API e o card da /comunidade leem do `evento.ts` —
nenhum deles tem data escrita à mão". Três lugares desmentiam:

| onde | o que dizia (desde 20/08) |
|---|---|
| `gubigdata/page.tsx` | `description: 'Dia 26/08 às 18h30… Alessandro Binhara… Marcelo Dallagassa'` + OG `'DSSBR ao Vivo e Process Mining na Saúde — 26/08'` |
| `gubigdata/inscricao/page.tsx` | `description: '…em 26/08 no IEP…'` |
| `comunidade/page.tsx` | título do card com os temas de agosto em texto fixo |

Nenhum quebra build, nenhum aparece na tela — é **SEO e preview de link compartilhado**
anunciando o evento errado, calados. Agora saem de campos novos do `EVENTO_GU`
(`tema`, `metaDescricao`, `checkoutDescricao`), e há **canário novo** que reprova qualquer
`dd/mm` solto nos arquivos de `src/app/gubigdata/`.

## 4. Prod virado por fora do deploy

Via `POST /api/admin/ingressos` ([[reference_operar_prod_via_admin_api]] — upsert do registro
INTEIRO, sempre com GET antes):

| tipo | antes | agora |
|---|---|---|
| `gubigdata-2026-08/geral` (id 23) | R$30, ativo | **desativado** (fica cadastrado — o histórico precisa do nome) |
| `gubigdata-2026-08/associado` (id 24) | grátis, ativo | **desativado** |
| `gubigdata-2026-09/geral` (id 35) | não existia | **R$ 30**, 3x, ativo, sem prazo |
| `gubigdata-2026-09/associado` (id 36) | não existia | **grátis**, ativo, sem prazo |

Feito **antes** do deploy de propósito: parou de vender o evento passado na hora, e a janela
até o deploy mostrou "inscrições em breve" na página velha — o estado menos errado dos dois.

## 5. Verificado no ar (não no build)

| rota | o que se viu |
|---|---|
| `/gubigdata` | título, data, agenda e os dois palestrantes de 24/09; card com **Geral R$ 30,00** e **Associado grátis**, ambos disponíveis |
| assets | `banner-setembro.jpg` (275KB), `marcio-viana.jpg`, `leandro-krukoski.jpg` — 200 |
| `/gubigdata/inscricao?tipo=associado` | abre com o gratuito marcado → "Confirmar inscrição gratuita" |
| `/comunidade` | card do próximo encontro com o tema de setembro |
| `POST /api/admin/migrate` | 45/45, seed idempotente não sobrescreveu nada |

Local, antes do deploy: fluxo gratuito E2E no `next start` — inscrição criada →
reenvio devolve `duplicada` → `?tipo=associadoo` responde **400**.

## 6. Armadilhas desta sessão

- **`curl` do endpoint de export de contatos é bloqueado pelo classificador** (dados pessoais).
  Panorama de vendas, quando precisar, sai pelo `/admin/vendas` na mão.
- **O `POST /api/gubigdata/inscricao` exige `consentimento: true`** (LGPD) antes de qualquer
  validação de tipo — teste de curl sem esse campo devolve 400 e parece bug de tipo.
- **O banco local do `.env.local` é outro banco** ([[reference_db_mismatch]]): rodar
  `/api/admin/migrate` local semeia os tipos só lá; prod precisa da chamada própria.

## Fica pendente

**Desta sessão:**

- **Fluxo PAGO do GU segue sem 1 PIX real** — quinto encontro no mesmo pipeline, nenhuma venda
  de R$ 30 exercida de ponta a ponta contra o Asaas.
- O post do GU **não credita a Azuris**; a página segue "Realização: IEP · Organização:
  GU Big Data & IA, Rede Sol e SUCESU PR" (decisão do Binhara, 05/09). A Azuris continua no
  rodapé como quem processa a inscrição.
- A peça de divulgação do GU já circulou **sem preço**. Se o público chegar esperando gratuito,
  é o mesmo atrito de 26/08.

**De antes, inalterado:** DSS a **52 dias** (27–29/10) com Lote 2 R$670 sem virada marcada ·
copy pré-evergreen do curso na home (`Ecosystem.tsx` com "Turma 1 começa 22/jun", `CourseCallout`
e `lakehouse-og` com "5 semanas") · zero pagamento real nos 3 produtos de 25/08 · NFS-e no
Portal Nacional · Resend nunca conferido numa venda real · `CUPOM_SECRET` ausente na Vercel ·
bug do bloco "Regerar" · PostHog sem chave · deploy ainda é `vercel --prod` na mão.

Última revisão: **2026-09-05**.
