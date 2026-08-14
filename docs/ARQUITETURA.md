# Arquitetura do app

O que este repositório é, hoje: um **site institucional que também vende**. Next.js 16 (App
Router, Turbopack) + React 19.2 + Tailwind v4, rodando na Vercel, com Postgres (Neon) e
cobrança pelo Asaas.

Comece pelo [CATALOGO-PRECOS-E-VENDAS.md](./CATALOGO-PRECOS-E-VENDAS.md) se a sua pergunta é
sobre preço ou venda. Este doc é o mapa do **código**.

---

## 1. As três metades

| metade | o que é | como renderiza |
|---|---|---|
| **Institucional** | home, serviços, cases, blog, produtos, comunidade, sobre, contato | estático (SSG) |
| **Venda** | checkouts de DSS, One Day, combo, GU, ETT, Lakehouse, preparatório | `force-dynamic` — preço vem do banco a cada request |
| **Admin** | `/admin/*` — painel financeiro e operacional | `force-dynamic`, atrás de senha única |

Essa divisão explica quase toda decisão de cache do projeto: página que mostra preço **nunca**
é estática, porque preço muda no admin sem deploy.

## 2. Camadas

```
src/app/**          rotas (páginas + API). Fina: parseia, chama a lib, devolve.
src/lib/**          regra de negócio. É aqui que mora o que precisa de teste.
src/components/**   UI compartilhada (checkout/, sections/, three/)
content/blog/**     14 posts em MDX
sql/**              schema + migração + scripts de manutenção
```

A convenção que se repete: **a rota não decide nada**. `POST /api/dssbr-2026/inscricao` tem 19
linhas e delega pra `processarCheckout()`; a regra que importa (preço, cupom, lotação) fica em
`src/lib/`, pura o suficiente pra ter teste sem banco.

### As libs que carregam o peso

| lib | responsabilidade |
|---|---|
| `produtos.ts` | registry de produtos com checkout (preço-fallback, regras de PF/PJ, descrição da fatura) |
| `tipos-ingresso.ts` | catálogo de tipos (preço no banco), disponibilidade, ingresso oculto |
| `checkout-produto.ts` | o checkout genérico: valida → deriva preço no servidor → cria cobrança |
| `cobranca-pipeline.ts` | pipeline Asaas comum: customer → payment → inscrição pendente → vínculo |
| `cupons.ts` / `cupom.ts` | regra dos cupons no banco / assinatura HMAC do link de vendedora |
| `parcelamento.ts` | juros (Price, 2,99% a.m.), tetos de parcela |
| `asaas.ts` / `asaas-sync.ts` | cliente da API / sincronização de status, taxas e líquido |
| `admin-queries.ts` | todas as consultas do painel (lista, filtros, totais, resumos) |
| `db.ts` | acesso ao Postgres, tipos das linhas, lotes do Lakehouse |
| `email/` | conteúdo, envio (Resend) e gatilho de notificação |
| `vigilancia.ts` | regras do vigia de vendas (produto sem opção de compra, prazo perto, lotação alta) |

## 3. Rotas públicas

**Institucional:** `/` · `/sobre` · `/servicos` (+5 landings) · `/cases` · `/cases/[slug]` ·
`/blog` · `/blog/[slug]` · `/produtos` · `/produtos/[slug]` · `/produtos/curso-pipelines` ·
`/comunidade` · `/contato` · `/azuriz`

**Venda:** `/dssbr-2026` · `/dssbr-2026/inscricao` (+ `/obrigado`) · `/dssbr-2026/one-day` ·
`/dssbr-2026/one-day-curso` · `/gubigdata` (+ `/inscricao`) · `/ett/adesao` · `/ett/assinatura` ·
`/lakehouse-comunidade/inscricao` (+ `/obrigado`) · `/preparatorio-dados/reserva` · `/vendas`
(gerador de link da vendedora)

**Admin:** `/admin/login` e, sob `(painel)`: visão geral · vendas (+ detalhe) · cobrança ·
cupons · ingressos · assinaturas · conciliação · financeiro · importar · saúde · tráfego

## 4. API

| grupo | rotas |
|---|---|
| checkout | `/api/inscricao` (Lakehouse) · `/api/dssbr-2026/inscricao` · `/api/dss-one-day/inscricao` · `/api/dss-one-day-curso/inscricao` · `/api/gubigdata/inscricao` · `/api/ett/adesao/inscricao` · `/api/ett/assinatura` · `/api/preparatorio-dados/inscricao` |
| venda | `/api/vendas/link` (gera o link assinado da vendedora) |
| Asaas | `/api/webhook/asaas` (idempotente; fecha status) |
| admin | `login` · `migrate` · `sync` · `cobranca` (+ `atualizar`, `cancelar`, `trocar-meio`) · `importar-cobranca` · `ingressos` · `cupons` · `assinatura` · `nf` · `config` · `exportar` · `inscricoes/teste` · `email-teste` |
| cron | `/api/cron/reconciliar` (06:00 UTC) · `/api/cron/vigia-vendas` (12:00 UTC) |

Tudo em `/api/admin/*` exige `estaLogado()`. O webhook autentica por token do Asaas.

## 5. Proxy (ex-middleware)

`src/proxy.ts` — no Next 16 o middleware virou `proxy.ts`. Faz **uma** coisa: detecta tráfego
perdido do Azuriz FC (clube de futebol com nome parecido) por referrer ou `?fc=1`, marca um
cookie, e a home mostra um banner discreto. A landing dedicada é `/azuriz`.

## 6. Conteúdo

- **Blog:** 14 posts em `content/blog/*.mdx`, renderizados com `next-mdx-remote` + `remark-gfm`,
  `rehype-slug` e `rehype-autolink-headings`. Capa gerada por componente (`BlogCover`).
- **Cases:** **não** são MDX — são estruturas tipadas em `src/lib/cases.ts`, pra renderizar com
  componentes próprios (KPIs, tabelas, diagramas, galeria).
- **Produtos do ecossistema:** catálogo tipado em `src/lib/produtos-catalogo.ts` (7 produtos),
  que alimenta `/produtos` e `/produtos/[slug]`. Não confundir com `produtos.ts` (preço/checkout).
- **Stack:** `src/lib/tech-stack.ts` (30 techs com logo via `simple-icons`).

## 7. SEO e analytics

`src/app/sitemap.ts`, `robots.ts` e `opengraph-image.tsx` na raiz do App Router. Checkouts são
`noindex` de propósito — a página indexável é a landing do produto.

**GTM `GTM-T7647L5K` em toda página** é regra do [AGENTS.md](../AGENTS.md), com canário no
vitest que varre `public/**/*.html`. O gtag legado (`GT-NNZW5FW` → GA4 `G-0231JKF0F0`) roda em
paralelo e é ele que dispara `begin_checkout` — não configure tag GA4 dessa mesma propriedade
dentro do container, ou o pageview sai dobrado. PostHog está no código, mas **sem chave**: na
prática, morto.

## 8. Testes

`npx vitest run` — 19 arquivos, ~198 testes, todos de **regra pura** (sem banco, sem rede). O
que eles protegem, em uma linha cada:

- preço e parcelamento (o número que vai pro Asaas, não o da tela);
- cupom: desconto real na cobrança, teto, falha fechada, atribuição da comissão;
- tipos de ingresso: disponibilidade, gratuidade, ingresso oculto por link;
- catálogo do admin: todo produto tem checkout, rótulo e aba;
- GTM: nenhuma página estática sem o container;
- CSV de contatos, validação de CPF/CNPJ, formatação, e-mail e vigia de vendas.

Quando uma regra nova puder falhar **em silêncio** (preço plausível e errado, aba muda, tag
faltando), o padrão do projeto é deixar um **canário**: um teste que quebra na hora em que os
dois lados desencontram.

## 9. Convenções que valem pra código novo

1. **Preço nunca vem do client.** O navegador manda id de tipo e cupom; o valor é derivado no
   servidor, sempre.
2. **Nome de lote e preço não entram em texto fixo de página** — envelhecem na virada e passam
   a mentir ao lado do preço certo.
3. **Recusa não vira página de erro.** Link vencido, esgotado ou desligado cai no preço cheio
   com tarja explicando; perder a venda por causa do link é o pior desfecho.
4. **Falha fechada em dinheiro:** sem segredo ou sem banco, o desconto é negado — nunca
   concedido no escuro.
5. **Migração é aditiva e idempotente.** Sem ela rodada, a tela degrada (banner de erro ou
   fallback), não quebra.
6. **Cadastro é formulário, não caixa de texto livre.** Quem cadastra não deve precisar decorar
   formato — já custou três rodadas de retrabalho.

Última revisão: **2026-08-14**.
