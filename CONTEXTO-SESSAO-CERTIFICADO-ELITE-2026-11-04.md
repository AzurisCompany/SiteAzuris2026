# Sessão 04/11/2026 — Upgrade Elite, combo DSS 2027 + curso, revisão do site, PIX real e pendências do admin

## Estado no fim da sessão

| o quê | estado |
|---|---|
| certificado digital R$ 30 (`certificado-elite-digital-dss-2026`) | **EM PROD** — `/dssbr-2026/certificado-elite/digital` |
| certificado impresso R$ 50 (`certificado-elite-impresso-dss-2026`) | **EM PROD** — `/dssbr-2026/certificado-elite/impresso` |
| página de escolha | **EM PROD** — `/dssbr-2026/certificado-elite` |
| commit / deploy | `53c8347`, deploy `site-azuris-2026-i4qxjka02` (Ready, Production), verificado no ar |
| push | feito até `53c8347`; o commit deste arquivo, ver abaixo |
| banco | **nada mudou** — sem migração, sem tipo cadastrado |
| combo FullPass DSS 2027 + curso R$ 755 (`dss-2027-fullpass-curso`) | **EM PROD** — `/dssbr-2027/fullpass-curso`: `a47c953`, deploy `7xe6fvli8` |
| revisão do site (curso "nova turma" + combo nas vitrines) | **EM PROD** — `d79182d` + `ce485e0`, deploy `l35tqwl2k`, verificado |
| PIX real | **OK** — venda #336, R$ 30 no certificado digital, paga 22:54 (RECEIVED); tela confirmou sozinha; e-mail Resend enviado (`01a1a8c5-…`) |
| texto da tela do PIX ("sua compra", não "seu ingresso") | **EM PROD** — `3d4de19`, deploy `r9ysi6pej` |
| fix do sync (cobrança apagada no Asaas) + fix dos campos do "Regerar" | **EM PROD** — `66bce69`, deploy `jwqp4okha`; #18 sincronizada: PENDING → `cancelled` / `DELETED` |
| GoCloud R$ 10.000 e Tiago Nelson 3x | **importados** em prod: vendas #337 e #338 |

## 1. Releitura

Pedido: *"releia o projeto"*. `main` = `origin/main` = `d33f3f0` (Pre-Load DSS 2027, 29/10).
Achado: o Pre-Load não estava em nenhum doc — corrigido nesta sessão (README + CATALOGO).

## 2. Upgrade Elite — certificado

Pedido: *"crie um produto agora para upgrade Elite para compra do certificado — um digital
R$30 e outro link impresso R$50"*.

Decisões:
- **Dois produtos, não um produto com dois tipos.** `buscarCompraPagaDoDocumento` barra a
  2ª compra paga do mesmo CPF **no mesmo produto**; com um produto só, quem comprou o digital
  não levaria o impresso.
- **Preço fixo no registry** (`PRODUTOS` em `src/lib/produtos.ts`), sem tipo no banco: nada de
  migração. Mudar preço = editar o registry + deploy.
- **Cartão 1x** (`maxParcelas: 1`), sem desconto PIX, sem âncora.
- **PIX na nossa tela** (`pixNaTela: true`), igual ao Pre-Load. Status compartilhado pelos dois
  em `GET /api/dss-certificado-elite/status?id=pay_…`.
- Páginas `noindex`, fora da vitrine — só vende por link.
- Telefone obrigatório nos dois (no impresso é por WhatsApp que se combina a entrega).

Arquivos: `src/app/dssbr-2026/certificado-elite/` (`page.tsx` de escolha,
`CertificadoCheckout.tsx` compartilhado, `digital/` e `impresso/`),
`src/app/api/dss-certificado-elite/{digital,impresso,status}/route.ts`, e as listas de sempre:
`admin-queries.ts` (label, aba, CHECKOUT_URL, preço sugerido), `cobranca-manual.ts` (cobrança
avulsa), `links-venda.ts` (`/admin/links`), `email/conteudo.ts` (e-mail de confirmação),
testes `cobranca-manual` e `email-conteudo`.

Verificação: vitest 325/325, eslint limpo, build ok. Local e no ar: as 3 páginas 200 com
R$ 30,00 / R$ 50,00, APIs recusam payload/id inválido. (`tsc` acusa `oculto` faltando em
`checkout-produto.test.ts` — erro pré-existente, não é desta sessão.)

## 3. Combo FullPass DSS 2027 + curso (R$ 755)

Pedido: *"vamos criar a promoção novamente do DSS + Curso … DSS2027 Fullpass + Curso de
Pipeline de dados — nova turma — por 755"*. Base: o combo do 2026 (`dss-fullpass-curso-2026`).

- Produto `dss-2027-fullpass-curso`, preço fixo no registry, 3x com juros, `pixNaTela`.
- Página via `PasseCheckout` (aceita `?d=`/`?c=`), que ganhou `pixStatusEndpoint`.
- Rotas `/api/dss-2027-fullpass-curso/{inscricao,status}`. Pre-Load linka pro combo.
- Decisões (04/11, perguntas interativas): **sem teto**, **sem data de turma**, **sem cupom**.
- O `! vercel --prod` do Binhara deu `Not authorized`; o deploy rodou pela sessão do Claude
  (`vercel whoami` = `binhara-1483`). Causa não descoberta.

## 4. Revisão do site — promoção do curso

Pedido: *"vamos rever todo nosso site e atualizar essa promoção de venda do curso"*.

Escolhas do Binhara: curso segue **R$ 750 como "nova turma"** (sem data, **30 vagas**); combo
nas vitrines **página/checkout do curso, home e landing do DSS 2026**; banner flutuante e
callout do blog ficam **só com o curso**.

Mudou:
- `public/lakehouse-comunidade/index.html`: card "Mercado · Turma 2 — R$ 1.197, set/2026" →
  card do combo; "Turma 1 · 20 vagas" → "Nova turma · 30 vagas"; FAQ + JSON-LD sem aumento
  com data e com o combo 2027 (antes citava o combo do 2026 por R$ 750); CTA sem "Lote 1".
- **Checkout do curso prometia "Ingresso DSS 2026 incluso (R$ 520)"** — bônus acabou em
  25/08. Removido; entrou a chamada "Quer o DSS 2027 junto?".
- Home: 3º botão "Curso + FullPass DSS 2027 por R$ 755"; selo "nova turma aberta".
- `VendasEncerradas` (landing e links velhos do 2026): bloco "O DSS 2027 já está à venda"
  com Pre-Load e combo; `/dssbr-2026/fullpass-curso` aponta pro combo novo.
- Textos vencidos: Ecosystem ("Turma 1 começa 22/jun", "5 semanas"), CourseCallout ("5
  semanas, ao vivo"), banner ("Lote 1 aberto"), OG `/lakehouse-og` ("Turma 1 · 22/06").
- UTMs `lakehouse-t1-l1` → `lakehouse-nova-turma`; combo usa `combo-dss2027`.

Verificação: vitest 327/327, build ok; no ar, as 5 páginas com o texto novo e sem
"set/2026", "1.197" ou "2026 incluso". Lint: 2 erros pré-existentes em
`CourseFloatingBanner.tsx` (setState em effect, linhas não tocadas).

## 5. Decisões das perguntas interativas

Certificado: digital **por e-mail**, impresso **combinado no WhatsApp**, "Elite" **genérico**
— todos confirmados, textos mantidos.

## 6. PIX real (certificado digital)

Binhara pagou R$ 30 em `/dssbr-2026/certificado-elite/digital`:
- QR + copia-e-cola na nossa tela (sem fatura do Asaas) → venda #336 `pending`;
- pago → webhook → #336 `paid` (Asaas `RECEIVED`, 04/11 22:54) → a tela trocou sozinha pra
  "Pagamento confirmado!";
- e-mail nosso: log de prod `E-mail de confirmação enviado (inscricao 336 …, resend 01a1a8c5-…)`.
  O e-mail que o Binhara colou era o **comprovante do Asaas** (Fatura 958992554), não o nosso.

Valida o `pixNaTela` de ponta a ponta (Pre-Load e combo usam o mesmo fluxo). A #336 é venda real
no CPF do Binhara (estornar no Asaas se quiser).

Achados no caminho:
- A tela dizia "Seu ingresso está garantido" / "não se liga ao seu ingresso" também no
  certificado → `3d4de19`: "Sua compra está confirmada" / "não se liga à sua compra".
- O recebedor no app do banco aparece como **"ALESSANDRO DE OLIVEIRA BI…"** (nome da conta Asaas),
  não "Azuris". Se mudar, é no cadastro do Asaas, não no site.
- Pra achar o envio do e-mail sem banco: `vercel logs --environment production --since 2h -q "<id>" -x`.

## 7. Perguntas interativas (2ª rodada)

- Deploy da revisão: **sim** · turma: **sem data** · vagas: **30** · combo: **sem teto**.
- Certificado: digital **por e-mail**, impresso **WhatsApp**, "Elite" **genérico**.
- Combo nos cupons das vendedoras: **não** (já é promoção).
- Banner flutuante / callout do blog com o combo: **não**.

## 8. Pendências do admin (itens 1–4 da lista de 08/10)

Pedido: *"pode fazer essas"*.

1. **Sync ignorava cobrança apagada** → `src/lib/asaas-sync.ts`: `deleted: true` = `cancelled`
   (exceto pago/estornado), `asaas_status = 'DELETED'`. Campo `deleted` em `AsaasPaymentDetail`.
   Teste novo `src/lib/__tests__/asaas-sync-deleted.test.ts` (4 casos). O webhook já tratava
   `PAYMENT_DELETED`; o furo era só no sync.
2. **#18 / GoCloud / Tiago Nelson** → GoCloud e Tiago importados pela API do admin
   (`/api/admin/importar-cobranca`): **#337** e **#338**, ambos `RECEIVED`. A #18 se resolve com o
   fix do item 1 + sync da venda depois do deploy.
3. **Vencidas #55 #114 #182 #264** → **mantidas** (decisão do Binhara; a #55 ele cobra direto).
4. **Campos velhos no "Regerar"** → `AcoesCobranca.tsx` realinha os campos quando valor /
   vencimento / parcelas / meio / descrição mudam (ajuste durante o render, sem effect).

Verificação: vitest 331/331, eslint e tsc sem erro novo, build ok. Deploy `jwqp4okha`; depois,
`POST /api/admin/sync {id:18}` → `{"ok":true,"status":"cancelled"}`, detalhe da #18 mostra `DELETED`.
Detalhe em `docs/ADMIN-REVISAO-COBRANCAS-ABERTAS.md` §4.1 e `docs/ADMIN-TROCAR-MEIO-PAGAMENTO.md`.

## 9. Em aberto

1. ~~Textos de entrega~~ e ~~"Elite"~~ — confirmados em 04/11 (ver §5).
2. **Não confere se o comprador participou do DSS 2026** — qualquer CPF compra.
3. ~~1 PIX real~~ — feito (§6).
4. Liberar o curso na mão a cada combo vendido.
5. Vencidas #55 #114 #182 #264 seguem abertas por decisão; não cancelar sem novo OK.
6. Herdado, fora desta sessão: deploy automático pelo GitHub, 403 do painel Tráfego, chave do
   PostHog, erros de lint/tsc pré-existentes (banner flutuante; `oculto` em `checkout-produto.test.ts`).
