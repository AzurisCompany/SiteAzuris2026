# Sessão 04/11/2026 — Upgrade Elite: certificado digital R$ 30 e impresso R$ 50

## Estado no fim da sessão

| o quê | estado |
|---|---|
| certificado digital R$ 30 (`certificado-elite-digital-dss-2026`) | **EM PROD** — `/dssbr-2026/certificado-elite/digital` |
| certificado impresso R$ 50 (`certificado-elite-impresso-dss-2026`) | **EM PROD** — `/dssbr-2026/certificado-elite/impresso` |
| página de escolha | **EM PROD** — `/dssbr-2026/certificado-elite` |
| commit / deploy | `53c8347`, deploy `site-azuris-2026-i4qxjka02` (Ready, Production), verificado no ar |
| push | feito até `53c8347`; o commit deste arquivo, ver abaixo |
| banco | **nada mudou** — sem migração, sem tipo cadastrado |
| pagamento real | **nenhum ainda** |

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

## 3. Em aberto

1. **Textos de entrega inventados, aguardam o Binhara:** digital "chega no e-mail cadastrado";
   impresso "a gente chama no WhatsApp pra combinar a entrega". Estão na página
   (`CertificadoCheckout.tsx`, `ENTREGA`), na escolha (`page.tsx`, `OPCOES`) e no e-mail.
2. **O que o "Elite" tem de diferente** não está descrito em lugar nenhum — páginas genéricas.
3. **Não confere se o comprador participou do DSS 2026** — qualquer CPF compra.
4. **1 PIX real** de ponta a ponta (sugestão: R$ 30 no digital) — QR na tela, webhook, e-mail.
5. Herdado: Pre-Load DSS 2027 também sem PIX real; camiseta congressista fechou sozinha em 27/10.
