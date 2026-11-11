# Sessão 11/11/2026 — Upgrade Elite: slides das palestras (R$ 30)

## Estado no fim da sessão

| o quê | estado |
|---|---|
| slides Elite R$ 30 (`slides-elite-dss-2026`) | **EM PROD** — `/dssbr-2026/certificado-elite/slides` |
| página de escolha com 3 cards (digital, impresso, slides) | **EM PROD** — `/dssbr-2026/certificado-elite` |
| commit / deploy | `349ac07`, deploy `site-azuris-2026-8kl76a9g5` (Ready, Production), verificado no ar |
| push | feito até `349ac07` (levou junto o `bf74014`, docs de 09/11) |
| banco | **nada mudou** — sem migração, sem tipo |

## 1. Releitura

Pedido: *"reload"* / *"releia o projeto"*. Estado encontrado: `main` 1 à frente do origin
(`bf74014`, docs). No ar: `/ett/ativacao`, `/ett/aceleracao`, `/gubigdata` e `/dssbr-2027/preload` com 200.
`/ett/aceleracao` ainda mostra "abrem em breve" → tipo `aceleracao` segue sem cadastro em prod.

## 2. Upgrade Elite — slides

Pedido: *"crie mais um checkout DSS 2026 — Upgrade Elite (certificado) - para upgrade de slides
para elite - valor 30 reais"*.

Mesmo padrão dos certificados (ver `CONTEXTO-SESSAO-CERTIFICADO-ELITE-2026-11-04.md`):
- **Produto próprio** no registry (`PRODUTOS` em `src/lib/produtos.ts`), não tipo: a trava de
  1 compra paga por CPF é por produto, então quem levou certificado compra slides também.
- R$ 30, cartão 1x, sem desconto PIX, `pixNaTela`, telefone obrigatório, sem endereço PJ.
- `CertificadoCheckout.tsx` ganhou o formato `slides` (mapas `ITEM`/`DESCRICAO`/`ENTREGA`).
- Rota `POST /api/dss-certificado-elite/slides`; status compartilhado inclui o slug novo.
- Admin: label "DSS 2026 — Upgrade Elite (slides)", aba "Slides Elite", `CHECKOUT_URL`,
  preço sugerido, cobrança avulsa, `/admin/links`, e-mail de confirmação.
- Docs: README + `docs/CATALOGO-PRECOS-E-VENDAS.md`.

Decisões tomadas pelo Claude (não confirmadas pelo Binhara):
1. Entrega **por e-mail**, manual (o Binhara manda o link dos slides depois do pagamento).
2. URL embaixo de `/certificado-elite/` pra reusar o checkout; URL própria = redirect.

Verificação: vitest 336/336, eslint sem erro, build ok; local e no ar: página 200 com R$ 30,00,
API recusa payload vazio (`Nome inválido`).

Deploy: `vercel --prod` rodou pela sessão do Claude depois do OK explícito do Binhara.

## 3. Em aberto

1. 1 PIX real nos slides (fluxo idêntico ao digital, validado com a #336 em 04/11).
2. Mandar o link dos slides a cada venda (não há entrega automática).
3. Não confere se o comprador participou do DSS 2026.
4. Herdado de 09/11: criar o tipo `ett-aceleracao/aceleracao` em prod; 1 inscrição real na
   Aceleração (e-mail gratuito); 1 PIX real na ativação R$ 97.
5. Depois de 19/11: desligar tipos 238/239 do GU.
